import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30;

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.ceil((record.resetTime - now) / 1000) };
  }
  
  record.count++;
  return { allowed: true };
}

// Generate OKX signature
function generateSignature(
  timestamp: string,
  method: string,
  requestPath: string,
  body: string,
  secretKey: string
): string {
  const encoder = new TextEncoder();
  const preHash = timestamp + method + requestPath + body;
  const key = encoder.encode(secretKey);
  const message = encoder.encode(preHash);
  
  // Use SubtleCrypto for HMAC-SHA256
  return "";  // Will be computed async
}

async function computeSignature(
  timestamp: string,
  method: string,
  requestPath: string,
  body: string,
  secretKey: string
): Promise<string> {
  const encoder = new TextEncoder();
  const preHash = timestamp + method + requestPath + body;
  
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(preHash)
  );
  
  // Convert to base64
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// Allowed endpoints
const ALLOWED_ENDPOINTS = [
  '/api/v5/dex/aggregator/all-tokens',
  '/api/v5/dex/aggregator/quote',
  '/api/v5/dex/market/price',
  '/api/v5/market/ticker',
  '/api/v5/market/tickers',
  '/api/v5/market/index-tickers',
  '/api/v5/public/mark-price',
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateCheck = checkRateLimit(clientIp);
    
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', retryAfter: rateCheck.retryAfter }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateCheck.retryAfter)
          } 
        }
      );
    }

    const { endpoint, params, method = 'GET', body: requestBody } = await req.json();
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate endpoint
    const isAllowed = ALLOWED_ENDPOINTS.some(allowed => endpoint.startsWith(allowed));
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ error: 'Endpoint not allowed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get secrets
    const apiKey = Deno.env.get('OKX_API_KEY');
    const secretKey = Deno.env.get('OKX_SECRET_KEY');
    const passphrase = Deno.env.get('OKX_PASSPHRASE');

    if (!apiKey || !secretKey || !passphrase) {
      console.error('Missing OKX API credentials');
      return new Response(
        JSON.stringify({ error: 'OKX API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build URL
    const baseUrl = 'https://www.okx.com';
    let requestPath = endpoint;
    
    if (params && Object.keys(params).length > 0 && method === 'GET') {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      requestPath += '?' + searchParams.toString();
    }

    const url = baseUrl + requestPath;
    const timestamp = new Date().toISOString();
    const bodyStr = method === 'GET' ? '' : JSON.stringify(requestBody || {});
    
    // Compute signature
    const signature = await computeSignature(
      timestamp,
      method,
      method === 'GET' ? requestPath : endpoint,
      bodyStr,
      secretKey
    );

    console.log(`OKX API Request: ${method} ${requestPath}`);

    const headers: Record<string, string> = {
      'OK-ACCESS-KEY': apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': passphrase,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: method === 'GET' ? undefined : bodyStr,
    });

    const data = await response.json();
    
    console.log(`OKX API Response: ${response.status}, code: ${data.code}`);

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('OKX Proxy Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
