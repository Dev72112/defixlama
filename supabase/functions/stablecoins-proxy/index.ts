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
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint") || "/stablecoins?includePrices=true";

    const allowed = ["/stablecoins", "/stablecoincharts/", "/stablecoinprices"];
    if (!allowed.some(a => endpoint.startsWith(a))) {
      return new Response(JSON.stringify({ error: "Endpoint not allowed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(`https://stablecoins.llama.fi${endpoint}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Upstream error" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("stablecoins-proxy error:", error instanceof Error ? error.message : "Unknown");
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
