import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIER_PRICES_CENTS: Record<string, number> = {
  trial: 0,
  pro: 2900,
  pro_plus: 4900,
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

    const { tierKey, mode } = await req.json();
    if (!tierKey || !["pro", "pro_plus", "trial"].includes(tierKey)) {
      return new Response(
        JSON.stringify({ error: "Invalid tier. Use 'pro', 'pro_plus', or 'trial'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isTestMode = mode === "test";
    const secretKey = Deno.env.get(isTestMode ? "TEST_SECRET_KEY" : "LIVE_SECRET_KEY");
    if (!secretKey) {
      return new Response(
        JSON.stringify({ error: `Payment provider not configured for ${isTestMode ? "test" : "live"} mode` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderId = `${user.id}_${tierKey}_${Date.now()}`;
    const tierLabel = tierKey === "trial" ? "7-Day Free Trial" : tierKey === "pro" ? "Pro" : "Pro+";

    // Free trial — activate directly, no payment needed
    if (tierKey === "trial") {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const now = new Date();
      const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      await supabaseAdmin
        .from("subscriptions")
        .upsert(
          {
            user_id: user.id,
            tier: "pro",
            status: "trialing",
            trial_start: now.toISOString(),
            trial_end: trialEnd.toISOString(),
            current_period_end: trialEnd.toISOString(),
            updated_at: now.toISOString(),
          },
          { onConflict: "user_id" }
        );

      return new Response(
        JSON.stringify({ success: true, trial: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Paid tiers — redirect to Yoco checkout
    const successUrl = "https://defixlama.lovable.app/billing?status=success";
    const cancelUrl = "https://defixlama.lovable.app/billing?status=cancel";

    const res = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: TIER_PRICES_CENTS[tierKey],
        currency: "ZAR",
        successUrl,
        cancelUrl,
        metadata: {
          userId: user.id,
          tierKey,
          orderId,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Yoco API error:", data);
      return new Response(
        JSON.stringify({ error: "Failed to create checkout", details: data }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Write a pending subscription record
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          tier: tierKey,
          status: "pending",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    return new Response(
      JSON.stringify({
        redirectUrl: data.redirectUrl,
        checkoutId: data.id,
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
