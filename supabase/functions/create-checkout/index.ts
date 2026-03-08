import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIER_PRICES: Record<string, number> = {
  trial: 1,
  pro: 29,
  pro_plus: 49,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tierKey } = await req.json();
    if (!tierKey || !["pro", "pro_plus", "trial"].includes(tierKey)) {
      return new Response(
        JSON.stringify({ error: "Invalid tier. Use 'pro', 'pro_plus', or 'trial'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("NOWPAYMENTS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Payment provider not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderId = `${user.id}_${tierKey}_${Date.now()}`;
    const tierLabel = tierKey === "trial" ? "7-Day Trial" : tierKey === "pro" ? "Pro" : "Pro+";
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/nowpayments-webhook`;
    const successUrl = "https://defixlama.lovable.app/billing?status=success";
    const cancelUrl = "https://defixlama.lovable.app/billing?status=cancel";

    const res = await fetch("https://api.nowpayments.io/v1/invoice", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: TIER_PRICES[tierKey],
        price_currency: "usd",
        order_id: orderId,
        order_description: `DefiXlama ${tierLabel} ${tierKey === "trial" ? "" : "Monthly "}Subscription`,
        ipn_callback_url: webhookUrl,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("NOWPayments API error:", data);
      return new Response(
        JSON.stringify({ error: "Failed to create invoice", details: data }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Write a pending subscription record using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const pendingTier = tierKey === "trial" ? "pro_plus" : tierKey;

    await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          tier: pendingTier,
          status: "pending",
          nowpayments_invoice_id: data.id?.toString() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    return new Response(
      JSON.stringify({
        invoice_url: data.invoice_url,
        invoice_id: data.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Checkout error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
