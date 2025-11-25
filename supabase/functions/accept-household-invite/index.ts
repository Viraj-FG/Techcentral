import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { decodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AcceptInviteRequest {
  invite_code: string;
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

    const { invite_code }: AcceptInviteRequest = await req.json();

    // Verify JWT signature
    const parts = invite_code.split('.');
    if (parts.length !== 3) {
      return new Response(
        JSON.stringify({ error: 'Invalid invite code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    // Verify signature
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureValid = await crypto.subtle.verify(
      'HMAC',
      key,
      new Uint8Array(decodeBase64(encodedSignature)),
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    );

    if (!signatureValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid invite signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode payload
    const payloadStr = new TextDecoder().decode(decodeBase64(encodedPayload));
    const payload = JSON.parse(payloadStr);

    // Check if expired
    if (payload.expires_at < Date.now()) {
      return new Response(
        JSON.stringify({ error: 'Invite code has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch invite from database
    const { data: invite, error: inviteError } = await supabase
      .from('household_invites')
      .select('*, households(name, owner_id)')
      .eq('invite_code', invite_code)
      .single();

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ error: 'Invite not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check max uses
    if (invite.max_uses && invite.times_used >= invite.max_uses) {
      return new Response(
        JSON.stringify({ error: 'Invite has reached maximum uses' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('household_memberships')
      .select('id')
      .eq('household_id', payload.household_id)
      .eq('user_id', user.id)
      .single();

    if (existingMembership) {
      return new Response(
        JSON.stringify({ error: 'You are already a member of this household' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add user to household_memberships
    const { error: membershipError } = await supabase
      .from('household_memberships')
      .insert({
        household_id: payload.household_id,
        user_id: user.id,
        role: 'member',
      });

    if (membershipError) {
      console.error('Error creating membership:', membershipError);
      return new Response(
        JSON.stringify({ error: 'Failed to join household' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user's current_household_id if they don't have one
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_household_id')
      .eq('id', user.id)
      .single();

    if (!profile?.current_household_id) {
      await supabase
        .from('profiles')
        .update({ current_household_id: payload.household_id })
        .eq('id', user.id);
    }

    // Increment times_used
    await supabase
      .from('household_invites')
      .update({ times_used: invite.times_used + 1 })
      .eq('id', invite.id);

    return new Response(
      JSON.stringify({
        success: true,
        household_id: payload.household_id,
        household_name: invite.households.name,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in accept-household-invite:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
