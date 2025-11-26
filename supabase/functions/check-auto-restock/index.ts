import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's household
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('current_household_id')
      .eq('id', user.id)
      .single();

    if (!profile?.current_household_id) {
      return new Response(
        JSON.stringify({ error: 'No household found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find items that need restocking: auto_order_enabled = true AND fill_level <= reorder_threshold
    const { data: itemsToRestock, error: queryError } = await supabaseClient
      .from('inventory')
      .select('*')
      .eq('household_id', profile.current_household_id)
      .eq('auto_order_enabled', true)
      .lte('fill_level', supabaseClient.rpc('coalesce', { column: 'reorder_threshold', default_value: 20 }));

    if (queryError) {
      console.error('Query error:', queryError);
      throw queryError;
    }

    if (!itemsToRestock || itemsToRestock.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No items need restocking', itemsChecked: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add items to shopping list
    const shoppingListInserts = itemsToRestock.map(item => ({
      household_id: profile.current_household_id,
      item_name: item.name,
      quantity: 1,
      unit: item.unit || 'units',
      source: 'auto_restock',
      priority: 'high',
      status: 'pending',
      inventory_id: item.id
    }));

    const { error: insertError } = await supabaseClient
      .from('shopping_list')
      .insert(shoppingListInserts);

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    // Create notification
    const { error: notifError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'auto_restock',
        title: 'Auto-Restock Ready',
        message: `${itemsToRestock.length} item${itemsToRestock.length !== 1 ? 's' : ''} added to your shopping list`,
        metadata: {
          items: itemsToRestock.map(i => i.name),
          count: itemsToRestock.length
        }
      });

    if (notifError) {
      console.error('Notification error:', notifError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        itemsAdded: itemsToRestock.length,
        items: itemsToRestock.map(i => ({ name: i.name, fill_level: i.fill_level }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-auto-restock:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});