import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map Paddle price IDs to subscription tiers
function getTierFromPriceId(priceId: string): "pro" | "pro_plus" | "free" {
  const proPriceId = Deno.env.get("PADDLE_PRICE_PRO");
  const proPlusPriceId = Deno.env.get("PADDLE_PRICE_PRO_PLUS");
  if (priceId === proPriceId) return "pro";
  if (priceId === proPlusPriceId) return "pro_plus";
  return "free";
}

// Verify Paddle webhook signature using HMAC-SHA256
async function verifySignature(
  rawBody: string,
  signature: string | null
): Promise<boolean> {
  const secret = Deno.env.get("PADDLE_WEBHOOK_SECRET");
  if (!secret || !signature) return false;

  // Paddle signature format: ts=TIMESTAMP;h1=HASH
  const parts = signature.split(";");
  const tsStr = parts.find((p) => p.startsWith("ts="))?.replace("ts=", "");
  const h1 = parts.find((p) => p.startsWith("h1="))?.replace("h1=", "");
  if (!tsStr || !h1) return false;

  const signedPayload = `${tsStr}:${rawBody}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === h1;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const paddleSignature = req.headers.get("paddle-signature");

    const isValid = await verifySignature(rawBody, paddleSignature);
    if (!isValid) {
      console.error("Invalid Paddle webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event_type;
    const data = event.data;

    console.log(`Paddle webhook: ${eventType}`, data?.id);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (
      eventType === "subscription.created" ||
      eventType === "subscription.updated"
    ) {
      const customerId = data.customer_id;
      const subscriptionId = data.id;
      const status = data.status; // active, canceled, past_due, trialing
      const currentPeriodEnd = data.current_billing_period?.ends_at;

      // Get the first price ID to determine tier
      const priceId = data.items?.[0]?.price?.id;
      const tier = priceId ? getTierFromPriceId(priceId) : "free";

      // Map Paddle status to our enum
      const mappedStatus =
        status === "active"
          ? "active"
          : status === "canceled"
          ? "canceled"
          : status === "past_due"
          ? "past_due"
          : status === "trialing"
          ? "trialing"
          : "active";

      // Find user by paddle_customer_id or email
      const customData = data.custom_data;
      const userId = customData?.user_id;

      if (!userId) {
        console.error("No user_id in custom_data");
        return new Response(JSON.stringify({ error: "No user_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            paddle_customer_id: customerId,
            paddle_subscription_id: subscriptionId,
            tier,
            status: mappedStatus,
            current_period_end: currentPeriodEnd || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) {
        console.error("Error upserting subscription:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (eventType === "subscription.canceled") {
      const customData = data.custom_data;
      const userId = customData?.user_id;

      if (userId) {
        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
