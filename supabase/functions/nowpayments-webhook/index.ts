import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifySignature(body: Record<string, unknown>, sig: string | null): Promise<boolean> {
  const secret = Deno.env.get("NOWPAYMENTS_IPN_SECRET");
  if (!secret || !sig) return false;

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

    if (paymentStatus !== "finished" && paymentStatus !== "confirmed") {
      return new Response(JSON.stringify({ received: true, action: "ignored" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderId = body.order_id as string;

    // Parse order_id: {uuid}_{tierKey}_{timestamp}
    // tierKey can be "trial", "pro", or "pro_plus"
    let userId: string;
    let tierKey: string;

    if (orderId.includes("_trial_")) {
      const idx = orderId.indexOf("_trial_");
      userId = orderId.substring(0, idx);
      tierKey = "trial";
    } else if (orderId.includes("_pro_plus_")) {
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

    const now = new Date();

    if (tierKey === "trial") {
      // Trial: 7 days of Pro+ access
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 7);

      const { error } = await supabase
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            tier: "pro_plus",
            status: "trialing",
            trial_start: now.toISOString(),
            trial_end: trialEnd.toISOString(),
            current_period_end: trialEnd.toISOString(),
            nowpayments_invoice_id: body.invoice_id?.toString() || null,
            nowpayments_payment_id: body.payment_id?.toString() || null,
            updated_at: now.toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) {
        console.error("Error upserting trial subscription:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Trial activated: user=${userId}, ends=${trialEnd.toISOString()}`);
    } else {
      // Regular subscription: 30 days
      const periodEnd = new Date(now);
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
            updated_at: now.toISOString(),
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
    }

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
