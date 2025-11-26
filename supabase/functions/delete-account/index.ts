import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    console.log(`Starting account deletion for user: ${userId}`);

    // Delete user data in order (respecting foreign keys)
    // 1. Conversation data
    await supabase.from('conversation_history').delete().eq('user_id', userId);
    await supabase.from('conversation_events').delete().eq('user_id', userId);

    // 2. Meal and nutrition data
    await supabase.from('meal_logs').delete().eq('user_id', userId);
    await supabase.from('meal_templates').delete().eq('user_id', userId);
    await supabase.from('water_logs').delete().eq('user_id', userId);
    await supabase.from('saved_foods').delete().eq('user_id', userId);

    // 3. Household member data
    await supabase.from('household_members').delete().eq('user_id', userId);
    await supabase.from('pets').delete().eq('user_id', userId);

    // 4. Bookmarks and notifications
    await supabase.from('bookmarks').delete().eq('user_id', userId);
    await supabase.from('notifications').delete().eq('user_id', userId);

    // 5. Remove from household memberships
    await supabase.from('household_memberships').delete().eq('user_id', userId);

    // 6. Delete households they own (will cascade to related data)
    await supabase.from('households').delete().eq('owner_id', userId);

    // 7. Delete user roles
    await supabase.from('user_roles').delete().eq('user_id', userId);

    // 8. Delete profile
    await supabase.from('profiles').delete().eq('id', userId);

    // 9. Finally, delete auth user (must use admin API)
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error('Failed to delete auth user:', deleteAuthError);
      return new Response(JSON.stringify({ 
        error: 'Failed to delete account',
        details: deleteAuthError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Successfully deleted account for user: ${userId}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Account deleted successfully' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
