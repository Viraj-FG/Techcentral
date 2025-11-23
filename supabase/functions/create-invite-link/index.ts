import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";
import { create } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authentication required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    console.log('Creating invite link for user:', user.id);

    // Get user's household
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_household_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.current_household_id) {
      throw new Error('User is not part of a household');
    }

    // Get household name
    const { data: household, error: householdError } = await supabase
      .from('households')
      .select('name')
      .eq('id', profile.current_household_id)
      .single();

    if (householdError || !household) {
      throw new Error('Household not found');
    }

    // Generate JWT token
    const jwtSecret = Deno.env.get('INVITE_JWT_SECRET')!;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(jwtSecret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const payload = {
      household_id: profile.current_household_id,
      household_name: household.name,
      inviter_id: user.id,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
    };

    const token = await create({ alg: "HS256", typ: "JWT" }, payload, key);

    // Construct invite link
    const inviteLink = `${req.headers.get('origin') || 'https://kaeva.app'}/join?token=${token}`;

    console.log('Invite link created successfully');

    return new Response(JSON.stringify({ inviteLink }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in create-invite-link:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
