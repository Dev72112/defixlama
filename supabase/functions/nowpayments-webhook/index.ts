import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifySignature(body: Record<string, unknown>, sig: string | null): Promise<boolean> {
  const secret = Deno.env.get("NOWPAYMENTS_IPN_SECRET");
  if (!secret || !sig) return false;

  // Sort keys alphabetically and stringify
  const sorted = Object.keys(body).sort().reduce((acc: Record<string, unknown>, key) => {
    acc[key] = body[key];
    return acc;
  }, {});
  const payload = JSON.stringify(sorted);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const computed = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === sig;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    const sig = req.headers.get("x-nowpayments-sig");

    const isValid = await verifySignature(body, sig);
    if (!isValid) {
      console.error("Invalid NOWPayments webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentStatus = body.payment_status;
    console.log(`NOWPayments webhook: status=${paymentStatus}, order=${body.order_id}`);

    // Only activate on confirmed/finished payments
    if (paymentStatus !== "finished" && paymentStatus !== "confirmed") {
      return new Response(JSON.stringify({ received: true, action: "ignored" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse order_id: {userId}_{tierKey}_{timestamp}
    const orderId = body.order_id as string;
    const parts = orderId.split("_");
    if (parts.length < 3) {
      console.error("Invalid order_id format:", orderId);
      return new Response(JSON.stringify({ error: "Invalid order_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UUID is first 5 parts joined by hyphens (standard UUID format)
    // order_id format: {uuid}_pro_{timestamp} or {uuid}_pro_plus_{timestamp}
    // UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (contains 4 hyphens but we used _ separator)
    // So userId parts are separated by _ too. We need a different parsing strategy.
    // Since UUID has format with hyphens, we stored it with hyphens intact.
    // Actually the user.id from Supabase is a UUID like "abc-def-..." 
    // order_id = `${user.id}_${tierKey}_${Date.now()}`
    // user.id example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    // So: "a1b2c3d4-e5f6-7890-abcd-ef1234567890_pro_1234567890"
    // or: "a1b2c3d4-e5f6-7890-abcd-ef1234567890_pro_plus_1234567890"
    
    // Find tier by checking if it contains _pro_plus_ or _pro_
    let userId: string;
    let tierKey: string;
    
    if (orderId.includes("_pro_plus_")) {
      const idx = orderId.indexOf("_pro_plus_");
      userId = orderId.substring(0, idx);
      tierKey = "pro_plus";
    } else if (orderId.includes("_pro_")) {
      const idx = orderId.indexOf("_pro_");
      userId = orderId.substring(0, idx);
      tierKey = "pro";
    } else {
      console.error("Cannot determine tier from order_id:", orderId);
      return new Response(JSON.stringify({ error: "Invalid tier in order_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    const { error } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          tier: tierKey,
          status: "active",
          current_period_end: periodEnd.toISOString(),
          nowpayments_invoice_id: body.invoice_id?.toString() || null,
          nowpayments_payment_id: body.payment_id?.toString() || null,
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

    console.log(`Subscription activated: user=${userId}, tier=${tierKey}`);

    return new Response(JSON.stringify({ received: true, activated: true }), {
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
