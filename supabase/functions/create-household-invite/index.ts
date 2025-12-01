import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { householdInviteSchema, validateRequest } from "../_shared/schemas.ts";
import { getSecret, getSupabaseSecrets, validateRequiredSecrets } from "../_shared/secrets.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  household_id: string;
  expires_in_hours?: number;
  max_uses?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate required secrets early
    validateRequiredSecrets(['INVITE_JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_ANON_KEY']);
    const { url: supabaseUrl, anonKey: supabaseAnonKey, serviceRoleKey: supabaseServiceKey } = getSupabaseSecrets();
    const jwtSecret = getSecret('INVITE_JWT_SECRET');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use ANON key for user authentication
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      console.error('User auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(user.id, 'create-household-invite');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter!);
    }

    const requestBody = await req.json();
    
    // Validate request
    const validation = validateRequest(householdInviteSchema, {
      householdId: requestBody.household_id,
      expiresInHours: requestBody.expires_in_hours,
      maxUses: requestBody.max_uses
    });

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { householdId: household_id, expiresInHours: expires_in_hours, maxUses: max_uses } = validation.data;

    // Use SERVICE ROLE key for database operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey!);

    // Verify user is owner of the household
    const { data: household, error: householdError } = await adminClient
      .from('households')
      .select('owner_id, name')
      .eq('id', household_id)
      .single();

    if (householdError || !household) {
      console.error('Household fetch error:', householdError);
      return new Response(
        JSON.stringify({ error: 'Household not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (household.owner_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Only household owners can create invites' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create expiration timestamp
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (expires_in_hours ?? 24));

    // Create JWT payload
    const payload = {
      household_id,
      created_by: user.id,
      expires_at: expiresAt.getTime(),
    };

    // Simple JWT creation (header.payload.signature)
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = encodeBase64(JSON.stringify(header));
    const encodedPayload = encodeBase64(JSON.stringify(payload));

    // Create signature using HMAC-SHA256
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    );

    const encodedSignature = encodeBase64(signature);
    const inviteCode = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;

    // Store invite in database
    const { data: invite, error: insertError } = await adminClient
      .from('household_invites')
      .insert({
        household_id,
        invite_code: inviteCode,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        max_uses,
        times_used: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating invite:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create invite' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create shareable URL
    const inviteUrl = `${req.headers.get('origin') || 'https://app.com'}/household/join?code=${encodeURIComponent(inviteCode)}`;

    return new Response(
      JSON.stringify({
        success: true,
        invite_code: inviteCode,
        invite_url: inviteUrl,
        expires_at: expiresAt.toISOString(),
        max_uses,
        household_name: household.name,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-household-invite:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
