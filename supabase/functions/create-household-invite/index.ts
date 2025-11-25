import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const jwtSecret = Deno.env.get('INVITE_JWT_SECRET')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { household_id, expires_in_hours = 24, max_uses = 1 }: InviteRequest = await req.json();

    // Verify user is owner of the household
    const { data: household, error: householdError } = await supabase
      .from('households')
      .select('owner_id, name')
      .eq('id', household_id)
      .single();

    if (householdError || !household) {
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
    expiresAt.setHours(expiresAt.getHours() + expires_in_hours);

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
    const { data: invite, error: insertError } = await supabase
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
