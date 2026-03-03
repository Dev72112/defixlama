import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

const DEFILLAMA_BASE = "https://api.llama.fi";

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing API key" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Validate API key
  const keyHash = await sha256(apiKey);
  const { data: keyRecord, error: keyError } = await supabase
    .from("api_keys")
    .select("id, user_id, daily_limit, revoked_at, permissions")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (keyError || !keyRecord) {
    return new Response(JSON.stringify({ error: "Invalid API key" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (keyRecord.revoked_at) {
    return new Response(JSON.stringify({ error: "API key revoked" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check daily usage
  const today = new Date().toISOString().slice(0, 10);
  const { data: usageRecord } = await supabase
    .from("api_usage")
    .select("id, request_count")
    .eq("key_id", keyRecord.id)
    .eq("date", today)
    .maybeSingle();

  const currentCount = usageRecord?.request_count || 0;
  if (currentCount >= keyRecord.daily_limit) {
    return new Response(JSON.stringify({ error: "Daily rate limit exceeded" }), {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-RateLimit-Limit": String(keyRecord.daily_limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
      },
    });
  }

  // Increment usage
  if (usageRecord) {
    await supabase
      .from("api_usage")
      .update({ request_count: currentCount + 1 })
      .eq("id", usageRecord.id);
  } else {
    await supabase
      .from("api_usage")
      .insert({ key_id: keyRecord.id, date: today, request_count: 1 });
  }

  // Parse the requested path
  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "/protocols";
  const targetUrl = `${DEFILLAMA_BASE}${path}`;

  try {
    const response = await fetch(targetUrl);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-RateLimit-Limit": String(keyRecord.daily_limit),
        "X-RateLimit-Remaining": String(keyRecord.daily_limit - currentCount - 1),
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Upstream request failed" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
