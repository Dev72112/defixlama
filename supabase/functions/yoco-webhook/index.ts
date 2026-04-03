import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
};

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function verifyWebhookSignature(
  body: string,
  webhookId: string | null,
  webhookTimestamp: string | null,
  webhookSignature: string | null
): Promise<boolean> {
  // Try both test and live secrets
  const testSecret = Deno.env.get("YOCO_WEBHOOK_SECRET_TEST");
  const liveSecret = Deno.env.get("YOCO_WEBHOOK_SECRET_LIVE");

  if (!webhookId || !webhookTimestamp || !webhookSignature) return false;

  const secrets = [testSecret, liveSecret].filter(Boolean) as string[];
  if (secrets.length === 0) return false;

  // Check timestamp is within 5 minutes
  const ts = parseInt(webhookTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 300) return false;

  const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
  const encoder = new TextEncoder();

  for (const rawSecret of secrets) {
    // Yoco secrets are prefixed with "whsec_" and base64 encoded
    const secretBase64 = rawSecret.startsWith("whsec_") ? rawSecret.slice(6) : rawSecret;
    const secretBytes = base64ToUint8Array(secretBase64);

    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signedContent));
    const computed = btoa(String.fromCharCode(...new Uint8Array(signature)));

    // webhook-signature can contain multiple sigs separated by spaces: "v1,<sig1> v1,<sig2>"
    const sigParts = webhookSignature.split(" ");
    for (const part of sigParts) {
      const [, sig] = part.split(",");
      if (sig === computed) return true;
    }
  }

  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const webhookId = req.headers.get("webhook-id");
    const webhookTimestamp = req.headers.get("webhook-timestamp");
    const webhookSignature = req.headers.get("webhook-signature");

    const isValid = await verifyWebhookSignature(rawBody, webhookId, webhookTimestamp, webhookSignature);
    if (!isValid) {
      console.error("Invalid Yoco webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.type;
    console.log(`Yoco webhook: type=${eventType}, id=${event.id}`);

    if (eventType !== "checkout.completed") {
      return new Response(JSON.stringify({ received: true, action: "ignored" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = event.payload || event.data;
    const metadata = payload?.metadata || {};
    const userId = metadata.userId;
    const tierKey = metadata.tierKey;
    const orderId = metadata.orderId;

    if (!userId || !tierKey) {
      // Fallback: parse from orderId
      if (!orderId) {
        console.error("No userId/tierKey in metadata and no orderId");
        return new Response(JSON.stringify({ error: "Missing metadata" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();

    if (tierKey === "trial") {
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 7);

      const { error } = await supabase
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            tier: "pro",
            status: "trialing",
            trial_start: now.toISOString(),
            trial_end: trialEnd.toISOString(),
            current_period_end: trialEnd.toISOString(),
            updated_at: now.toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) {
        console.error("Error upserting trial:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Trial activated: user=${userId}, ends=${trialEnd.toISOString()}`);
    } else {
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
