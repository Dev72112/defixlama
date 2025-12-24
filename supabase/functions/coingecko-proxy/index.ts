import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, params } = await req.json();
    const COINGECKO_API_KEY = Deno.env.get("COINGECKO_API_KEY");
    
    if (!COINGECKO_API_KEY) {
      throw new Error("COINGECKO_API_KEY is not configured");
    }

    const baseUrl = "https://api.coingecko.com/api/v3";
    const url = new URL(`${baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    console.log(`Fetching CoinGecko: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      headers: {
        "x-cg-demo-api-key": COINGECKO_API_KEY,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CoinGecko API error: ${response.status} - ${errorText}`);
      // Return generic error to client without exposing internal details
      return new Response(
        JSON.stringify({ error: "External API error" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in coingecko-proxy:", error);
    // Return generic error to client without exposing internal details
    return new Response(
      JSON.stringify({ error: "Service temporarily unavailable" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
