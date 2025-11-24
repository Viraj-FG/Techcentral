import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin status
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token for auth check
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdminData, error: adminError } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (adminError || !isAdminData) {
      console.error('Admin check failed:', adminError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Admin verified:', user.email);

    // Create admin client for deletion
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get all user IDs that are NOT admins
    const { data: adminUsers, error: adminUsersError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminUsersError) {
      console.error('Error fetching admin users:', adminUsersError);
      throw adminUsersError;
    }

    const adminUserIds = new Set((adminUsers || []).map(r => r.user_id));
    console.log('Admin user IDs:', Array.from(adminUserIds));

    // Get all users
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      console.error('Error listing users:', usersError);
      throw usersError;
    }

    // Filter to non-admin users
    const nonAdminUsers = users.filter(u => !adminUserIds.has(u.id));
    console.log(`Found ${nonAdminUsers.length} non-admin users to delete`);

    const deletedUsers: string[] = [];
    const failedDeletions: Array<{ id: string; email: string; error: string }> = [];

    // Delete each non-admin user
    for (const user of nonAdminUsers) {
      try {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.error(`Failed to delete user ${user.email}:`, deleteError);
          failedDeletions.push({
            id: user.id,
            email: user.email || 'unknown',
            error: deleteError.message
          });
        } else {
          console.log(`✅ Deleted user: ${user.email} (${user.id})`);
          deletedUsers.push(user.email || user.id);
        }
      } catch (err) {
        console.error(`Exception deleting user ${user.email}:`, err);
        failedDeletions.push({
          id: user.id,
          email: user.email || 'unknown',
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: deletedUsers.length,
        deletedUsers,
        failedCount: failedDeletions.length,
        failedDeletions,
        message: `Deleted ${deletedUsers.length} non-admin users. ${failedDeletions.length} failed.`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
