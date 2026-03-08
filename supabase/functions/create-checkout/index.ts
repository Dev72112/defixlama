import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email;

    const { tierKey } = await req.json();

    if (!tierKey || !["pro", "pro_plus"].includes(tierKey)) {
      return new Response(
        JSON.stringify({ error: "Invalid tier. Use 'pro' or 'pro_plus'." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const priceId =
      tierKey === "pro"
        ? Deno.env.get("PADDLE_PRICE_PRO")
        : Deno.env.get("PADDLE_PRICE_PRO_PLUS");

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: "Price not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const paddleApiKey = Deno.env.get("PADDLE_API_KEY");
    if (!paddleApiKey) {
      return new Response(
        JSON.stringify({ error: "Paddle not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Paddle transaction (checkout)
    const paddleRes = await fetch(
      "https://api.paddle.com/transactions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paddleApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [{ price_id: priceId, quantity: 1 }],
          customer_email: userEmail,
          custom_data: { user_id: userId },
          checkout: {
            url: null, // Use Paddle's hosted checkout overlay
          },
        }),
      }
    );

    const paddleData = await paddleRes.json();

    if (!paddleRes.ok) {
      console.error("Paddle API error:", paddleData);
      return new Response(
        JSON.stringify({
          error: "Failed to create checkout",
          details: paddleData,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Return the transaction ID for Paddle.js overlay checkout
    return new Response(
      JSON.stringify({
        transactionId: paddleData.data?.id,
        checkoutUrl: paddleData.data?.checkout?.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Checkout error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
