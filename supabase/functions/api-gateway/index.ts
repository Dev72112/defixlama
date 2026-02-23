/**
 * Supabase Edge Function for API Rate Limiting
 *
 * Deploy this to Supabase using:
 * supabase functions deploy api-gateway
 *
 * This function provides:
 * - API key validation
 * - Rate limiting (daily quota)
 * - Usage tracking
 * - Request proxying
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

// Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Hash API key for security
 */
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Get API key and validate
 */
async function validateApiKey(
  request: Request
): Promise<{ apiKeyId?: string; error?: string }> {
  const authHeader = request.headers.get('x-api-key')

  if (!authHeader) {
    return { error: 'Missing x-api-key header' }
  }

  const keyHash = await hashApiKey(authHeader)

  const { data: apiKey, error } = await supabase
    .from('api_keys')
    .select('id, user_id, quota_daily, enabled')
    .eq('key_hash', keyHash)
    .single()

  if (error || !apiKey) {
    return { error: 'Invalid API key' }
  }

  if (!apiKey.enabled) {
    return { error: 'API key is disabled' }
  }

  return { apiKeyId: apiKey.id }
}

/**
 * Check rate limit for API key
 */
async function checkRateLimit(apiKeyId: string): Promise<{
  allowed: boolean
  remaining: number
  error?: string
}> {
  // Get quota for key
  const { data: apiKey, error: keyError } = await supabase
    .from('api_keys')
    .select('quota_daily')
    .eq('id', apiKeyId)
    .single()

  if (keyError || !apiKey) {
    return { allowed: false, remaining: 0, error: 'Key not found' }
  }

  // Count usage today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count, error: countError } = await supabase
    .from('api_usage')
    .select('id', { count: 'exact' })
    .eq('api_key_id', apiKeyId)
    .gte('created_at', today.toISOString())

  if (countError) {
    return { allowed: false, remaining: 0, error: countError.message }
  }

  const usage = count || 0
  const remaining = Math.max(0, apiKey.quota_daily - usage)
  const allowed = remaining > 0

  return { allowed, remaining }
}

/**
 * Log API usage
 */
async function logUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number
): Promise<void> {
  await supabase.from('api_usage').insert({
    api_key_id: apiKeyId,
    endpoint,
    method,
    status_code: statusCode,
    response_time_ms: responseTimeMs,
  })
}

/**
 * Main handler
 */
serve(async (req: Request) => {
  const startTime = Date.now()
  const endpoint = new URL(req.url).pathname
  const method = req.method

  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'x-api-key, content-type',
      },
    })
  }

  // Validate API key
  const keyValidation = await validateApiKey(req)
  if (keyValidation.error) {
    const responseTime = Date.now() - startTime
    return new Response(
      JSON.stringify({
        success: false,
        error: keyValidation.error,
      }),
      {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }
    )
  }

  const apiKeyId = keyValidation.apiKeyId!

  // Check rate limit
  const rateLimit = await checkRateLimit(apiKeyId)
  if (!rateLimit.allowed) {
    const responseTime = Date.now() - startTime
    await logUsage(apiKeyId, endpoint, method, 429, responseTime)

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Rate limit exceeded',
        remaining: 0,
      }),
      {
        status: 429,
        headers: {
          'content-type': 'application/json',
          'x-ratelimit-remaining': '0',
        },
      }
    )
  }

  // Proxy the request to actual API endpoint
  // Example: forward to a backend service
  const targetUrl = `https://api.example.com${endpoint}`

  try {
    const apiResponse = await fetch(targetUrl, {
      method,
      headers: new Headers(req.headers),
      body: method !== 'GET' && method !== 'HEAD' ? await req.text() : undefined,
    })

    const responseTime = Date.now() - startTime

    // Log usage
    await logUsage(
      apiKeyId,
      endpoint,
      method,
      apiResponse.status,
      responseTime
    )

    // Update last used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used: new Date().toISOString() })
      .eq('id', apiKeyId)

    // Return response with rate limit headers
    const responseBody = await apiResponse.text()

    return new Response(responseBody, {
      status: apiResponse.status,
      headers: {
        ...Object.fromEntries(apiResponse.headers.entries()),
        'x-ratelimit-remaining': rateLimit.remaining - 1,
        'x-ratelimit-limit': '10000', // Daily limit
        'x-response-time-ms': responseTime.toString(),
      },
    })
  } catch (error) {
    const responseTime = Date.now() - startTime

    await logUsage(apiKeyId, endpoint, method, 500, responseTime)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    )
  }
})
