import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting (protect upstream API key)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
// This is per edge instance; keep it generous and rely on caching to reduce upstream calls.
const RATE_LIMIT_MAX_REQUESTS = 120;

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

// Simple in-memory response cache + request de-dupe (reduces upstream 429s)
type CacheEntry = { data: unknown; freshUntil: number; staleUntil: number };
const responseCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<Response>>();

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

// Allowed endpoints - OKX Web3 API v5 + v6
const ALLOWED_ENDPOINTS = [
  // v5 Legacy endpoints
  '/api/v5/dex/aggregator/all-tokens',
  '/api/v5/dex/aggregator/quote',
  '/api/v5/dex/market/price',
  '/api/v5/market/ticker',
  '/api/v5/market/tickers',
  '/api/v5/market/index-tickers',
  '/api/v5/public/mark-price',
  // v6 Market Price API
  '/api/v6/dex/market/candles',
  '/api/v6/dex/market/historical-candles',
  '/api/v6/dex/market/trades',
  '/api/v6/dex/market/price',
  '/api/v6/dex/market/supported-chains',
  // v6 Market Token API (ranking)
  '/api/v6/dex/market/token/toplist',
  // v6 Token API
  '/api/v6/dex/token/search',
  '/api/v6/dex/token/basic-info',
  '/api/v6/dex/token/price-info',
  '/api/v6/dex/token/top-holders',
  // v6 Index Price API
  '/api/v6/dex/index/price',
  // v6 Transaction API
  '/api/v6/dex/tx/history',
  '/api/v6/dex/tx/detail',
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateCheck = checkRateLimit(clientIp);

    // IMPORTANT: avoid returning HTTP 429 because supabase-js treats non-2xx as an error and discards JSON.
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ code: '50011', msg: 'Too Many Requests', retryAfter: rateCheck.retryAfter, source: 'proxy' }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            ...(rateCheck.retryAfter ? { 'Retry-After': String(rateCheck.retryAfter) } : {}),
          },
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
    const isV6 = endpoint.startsWith('/api/v6/');
    const baseUrls = isV6
      ? ['https://www.okx.com', 'https://web3.okx.com']
      : ['https://www.okx.com'];

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

    // OKX docs use ISO8601 without milliseconds
    const timestamp = new Date().toISOString().slice(0, -5) + 'Z';
    const bodyStr = method === 'GET' ? '' : JSON.stringify(requestBody || {});

    const cacheKey = `${method}:${requestPath}:${bodyStr}`;
    const now = Date.now();

    // Serve fresh cache immediately
    const cached = responseCache.get(cacheKey);
    if (cached && now < cached.freshUntil) {
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
      });
    }

    // De-dupe concurrent identical requests
    const existing = inflight.get(cacheKey);
    if (existing) return await existing;

    const ttlFor = (ep: string) => {
      // freshMs + staleMs
      if (ep.startsWith('/api/v6/dex/token/price-info')) return { freshMs: 30_000, staleMs: 5 * 60_000 };
      if (ep.startsWith('/api/v6/dex/market/price')) return { freshMs: 10_000, staleMs: 60_000 };
      if (ep.startsWith('/api/v6/dex/market/token/toplist')) return { freshMs: 60_000, staleMs: 10 * 60_000 };
      if (ep.startsWith('/api/v6/dex/market/supported-chains')) return { freshMs: 24 * 60_000, staleMs: 7 * 24 * 60_000 };
      if (ep.startsWith('/api/v6/dex/market/trades')) return { freshMs: 10_000, staleMs: 60_000 };
      if (ep.startsWith('/api/v6/dex/market/candles') || ep.startsWith('/api/v6/dex/market/historical-candles')) return { freshMs: 60_000, staleMs: 10 * 60_000 };
      return { freshMs: 15_000, staleMs: 60_000 };
    };

    const promise = (async (): Promise<Response> => {
      try {
        // Compute signature (sign the path + query for GET)
        const signPath = method === 'GET' ? requestPath : endpoint;
        const signature = await computeSignature(
          timestamp,
          method,
          signPath,
          bodyStr,
          secretKey
        );

        const headers: Record<string, string> = {
          'OK-ACCESS-KEY': apiKey,
          'OK-ACCESS-SIGN': signature,
          'OK-ACCESS-TIMESTAMP': timestamp,
          'OK-ACCESS-PASSPHRASE': passphrase,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'defixlama/1.0',
        };

        // OKX Web3/WaaS APIs use project header in some cases; safe to include when available
        if (isV6) {
          const projectId = Deno.env.get('OKX_PROJECT_ID');
          if (projectId) headers['OK-ACCESS-PROJECT'] = projectId;
        }

        let lastNonJson: { status: number; contentType: string; preview: string; url: string } | null = null;
        let lastError: { status: number; code: string; msg: string } | null = null;

        for (const baseUrl of baseUrls) {
          const url = baseUrl + requestPath;
          console.log(`OKX API Request: ${method} ${url}`);

          try {
            const response = await fetch(url, {
              method,
              headers,
              body: method === 'GET' ? undefined : bodyStr,
            });

            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const data = await response.json();
              const upstreamStatus = response.status;
              console.log(`OKX API Response: ${upstreamStatus}, code: ${data?.code}`);

              // Handle geo-restriction (53015) or auth errors (401) - try next base URL
              if (upstreamStatus === 401 || data?.code === '53015') {
                console.log(`Geo-restriction or auth error from ${baseUrl}, trying next...`);
                lastError = { status: upstreamStatus, code: data?.code || 'unknown', msg: data?.msg || 'Geo-restricted' };
                continue; // Try next base URL
              }

              // If upstream is rate-limiting, serve stale cache if we have it, otherwise return 200 with the error payload.
              if (upstreamStatus === 429 || data?.code === '50011') {
                const stale = responseCache.get(cacheKey);
                if (stale && now < stale.staleUntil) {
                  return new Response(JSON.stringify(stale.data), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'STALE', 'X-Upstream-Status': String(upstreamStatus) },
                  });
                }

                return new Response(JSON.stringify({ ...data, upstreamStatus }), {
                  status: 200,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Upstream-Status': String(upstreamStatus) },
                });
              }

              // Cache successful responses
              if (data?.code === '0') {
                const { freshMs, staleMs } = ttlFor(endpoint);
                responseCache.set(cacheKey, {
                  data,
                  freshUntil: now + freshMs,
                  staleUntil: now + staleMs,
                });
              }

              return new Response(JSON.stringify(data), {
                status: upstreamStatus,
                headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': cached ? 'REFRESH' : 'MISS' },
              });
            }

            const text = await response.text();
            const preview = text.substring(0, 200);
            console.error(`OKX API returned non-JSON response (${response.status}) from ${url}: ${preview}`);
            lastNonJson = { status: response.status, contentType, preview, url };
          } catch (fetchErr) {
            console.error(`Fetch error for ${url}:`, fetchErr);
            continue; // Try next base URL
          }
        }

        // All base URLs failed - check for stale cache before returning error
        const stale = responseCache.get(cacheKey);
        if (stale && now < stale.staleUntil) {
          console.log('All OKX endpoints failed, serving stale cache');
          return new Response(JSON.stringify(stale.data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'STALE-FALLBACK' },
          });
        }

        // Return appropriate error
        if (lastError) {
          return new Response(
            JSON.stringify({
              error: 'OKX API geo-restricted',
              code: lastError.code,
              msg: lastError.msg,
              data: [],
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            error: 'OKX API returned non-JSON response',
            code: '50000',
            data: [],
            msg: 'API temporarily unavailable',
            details: lastNonJson,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error: unknown) {
        console.error('OKX Proxy Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
          JSON.stringify({ error: 'Internal server error', details: errorMessage }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } finally {
        inflight.delete(cacheKey);
      }
    })();

    inflight.set(cacheKey, promise);
    return await promise;

  } catch (error: unknown) {
    console.error('OKX Proxy Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
