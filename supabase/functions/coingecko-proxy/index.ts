import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting (per IP, resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per IP

// Allowed CoinGecko endpoints (whitelist)
const ALLOWED_ENDPOINTS = [
  "/coins/",
  "/simple/price",
  "/coins/markets",
];

function isEndpointAllowed(endpoint: string): boolean {
  if (!endpoint || typeof endpoint !== "string") return false;
  // Check if endpoint starts with any allowed prefix
  return ALLOWED_ENDPOINTS.some(allowed => endpoint.startsWith(allowed));
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  record.count++;
  return { allowed: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";
    
    // Check rate limit
    const rateCheck = checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateCheck.retryAfter || 60)
          } 
        }
      );
    }

    const { endpoint, params } = await req.json();
    
    // Validate endpoint
    if (!endpoint || typeof endpoint !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid request: endpoint required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check endpoint against whitelist
    if (!isEndpointAllowed(endpoint)) {
      return new Response(
        JSON.stringify({ error: "Endpoint not allowed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate params if provided
    if (params && typeof params !== "object") {
      return new Response(
        JSON.stringify({ error: "Invalid request: params must be an object" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const COINGECKO_API_KEY = Deno.env.get("COINGECKO_API_KEY");
    
    if (!COINGECKO_API_KEY) {
      console.error("COINGECKO_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = "https://api.coingecko.com/api/v3";
    const url = new URL(`${baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        // Sanitize param keys and values
        if (typeof key === "string" && key.length < 100) {
          const sanitizedValue = String(value).slice(0, 500);
          url.searchParams.append(key, sanitizedValue);
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        "x-cg-demo-api-key": COINGECKO_API_KEY,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status}`);
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
    console.error("Error in coingecko-proxy:", error instanceof Error ? error.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: "Service temporarily unavailable" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
