# API Gateway Edge Function

This Supabase Edge Function provides API rate limiting and quota management for the DeFi Llama premium API tier.

## Features

- **API Key Validation**: Validates API keys against the `api_keys` table
- **Rate Limiting**: Enforces daily quota limits per API key
- **Usage Tracking**: Logs all API calls with status codes and response times
- **Request Proxying**: Forwards validated requests to backend services
- **Response Headers**: Includes rate limit info in response headers

## Setup

### 1. Deploy the Edge Function

```bash
cd /path/to/defixlama
supabase functions deploy api-gateway
```

### 2. Set Environment Variables

```bash
supabase secrets set SUPABASE_URL=<your-project-url>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
```

### 3. Update Target URL

In `supabase/functions/api-gateway/index.ts`, change the `targetUrl` to point to your actual API backend:

```typescript
const targetUrl = `https://your-api.example.com${endpoint}`
```

## Usage

### Making API Requests

Include your API key in the `x-api-key` header:

```bash
curl -X GET https://your-project.supabase.co/functions/v1/api-gateway/protocols \
  -H "x-api-key: your-api-key-here"
```

### Response Headers

```
x-ratelimit-limit: 10000      # Daily quota
x-ratelimit-remaining: 9999   # Remaining calls today
x-response-time-ms: 45        # Response time in milliseconds
```

### Error Responses

**Missing API Key:**
```json
{
  "success": false,
  "error": "Missing x-api-key header"
}
```

**Invalid API Key:**
```json
{
  "success": false,
  "error": "Invalid API key"
}
```

**Rate Limit Exceeded:**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "remaining": 0
}
```

## API Key Management

### Create API Key (User runs this)

```typescript
const { data: key } = await supabase
  .from('api_keys')
  .insert({
    user_id: 'user-id',
    key_prefix: keyHash.slice(0, 8), // Show first 8 chars
    key_hash: hashKey(apiKey), // Hash the full key
    name: 'Production API Key',
    quota_daily: 10000,
    enabled: true,
  })
  .select()
  .single()
```

### Check Usage

```typescript
const { data: usage } = await supabase
  .from('api_usage')
  .select('*')
  .eq('api_key_id', keyId)
  .gte('created_at', today.toISOString())
```

### Disable Key

```typescript
await supabase
  .from('api_keys')
  .update({ enabled: false })
  .eq('id', keyId)
```

## Response Time Monitoring

The function tracks response times to help you:
- Monitor API performance
- Identify slow endpoints
- Optimize backend services

```typescript
const { data: metrics } = await supabase
  .from('api_usage')
  .select('*')
  .eq('api_key_id', keyId)
  .order('response_time_ms', { ascending: false })
  .limit(10)
```

## Security Considerations

1. **API Key Hashing**: Keys are hashed using SHA-256 before storage
2. **Service Role**: Uses Supabase service role key (server-side only)
3. **CORS**: Currently allows all origins - restrict in production
4. **Rate Limits**: Prevent abuse through daily quotas

## Monitoring & Debugging

### View Recent Usage

```sql
SELECT
  api_key_id,
  endpoint,
  status_code,
  response_time_ms,
  created_at
FROM api_usage
ORDER BY created_at DESC
LIMIT 100;
```

### Find Heavy Users

```sql
SELECT
  api_key_id,
  COUNT(*) as usage_count,
  AVG(response_time_ms) as avg_response_time
FROM api_usage
WHERE created_at::date = CURRENT_DATE
GROUP BY api_key_id
ORDER BY usage_count DESC;
```

## Production Checklist

- [ ] Update `targetUrl` to point to real API
- [ ] Restrict CORS origins (not `*`)
- [ ] Set appropriate daily quotas per tier
- [ ] Monitor usage and adjust quotas as needed
- [ ] Set up alerting for quota abuse
- [ ] Implement additional security headers
- [ ] Add request/response logging for compliance
- [ ] Test with real API keys

## Testing

```bash
# Test with valid key
curl -X GET http://localhost:54321/functions/v1/api-gateway/protocols \
  -H "x-api-key: valid-key-hash"

# Test with invalid key
curl -X GET http://localhost:54321/functions/v1/api-gateway/protocols \
  -H "x-api-key: invalid-key"

# Test rate limiting
for i in {1..10001}; do
  curl -X GET http://localhost:54321/functions/v1/api-gateway/protocols \
    -H "x-api-key: valid-key-hash"
done
```

## Troubleshooting

**Function not found?**
- Make sure you ran `supabase functions deploy api-gateway`
- Check function name matches in your client code

**Rate limit not working?**
- Verify API key exists in database
- Check `quota_daily` is set correctly
- Look at `api_usage` table to see logged calls

**CORS errors?**
- Update the allowed origins in the response headers
- Test with `curl` first to rule out CORS
