import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
}

const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  'analyze-vision': { maxRequests: 100, windowMinutes: 1 },
  'identify-product': { maxRequests: 100, windowMinutes: 1 },
  'analyze-meal': { maxRequests: 50, windowMinutes: 1 },
  'enrich-product': { maxRequests: 200, windowMinutes: 1 },
  'suggest-recipes': { maxRequests: 20, windowMinutes: 1 },
  'provision-agents': { maxRequests: 5, windowMinutes: 5 },
  'default': { maxRequests: 60, windowMinutes: 1 },
};

export async function checkRateLimit(
  userId: string,
  endpoint: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const config = DEFAULT_LIMITS[endpoint] || DEFAULT_LIMITS.default;
  const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000);

  // Get current count for this user/endpoint/window
  const { data: existing, error: fetchError } = await supabase
    .from('rate_limits')
    .select('request_count, window_start')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('Rate limit check error:', fetchError);
    return { allowed: true }; // Fail open
  }

  if (!existing) {
    // First request in this window, create entry
    await supabase.from('rate_limits').insert({
      user_id: userId,
      endpoint,
      request_count: 1,
      window_start: new Date().toISOString(),
    });
    return { allowed: true };
  }

  if (existing.request_count >= config.maxRequests) {
    // Rate limit exceeded
    const windowEnd = new Date(new Date(existing.window_start).getTime() + config.windowMinutes * 60 * 1000);
    const retryAfter = Math.ceil((windowEnd.getTime() - Date.now()) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment count
  await supabase
    .from('rate_limits')
    .update({ request_count: existing.request_count + 1 })
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .eq('window_start', existing.window_start);

  return { allowed: true };
}

export function rateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}
