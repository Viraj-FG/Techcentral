import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";
import { checkRateLimit } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limiting for scheduled job
    const { allowed, retryAfter } = await checkRateLimit('system-cron', 'notify-spoilage');

    if (!allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
          retryAfter 
        }), 
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Checking for spoiled items...');

    // Call the check_spoilage function
    const { data: spoiledItems, error: spoilageError } = await supabase
      .rpc('check_spoilage');

    if (spoilageError) {
      console.error('Error checking spoilage:', spoilageError);
      throw spoilageError;
    }

    if (!spoiledItems || spoiledItems.length === 0) {
      console.log('No spoiled items found');
      return new Response(JSON.stringify({
        success: true,
        count: 0,
        message: 'No spoiled items found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Found', spoiledItems.length, 'potentially spoiled items');

    // Group by user_id
    const itemsByUser = new Map();
    
    for (const item of spoiledItems) {
      // Get user_id for this inventory item
      const { data: invItem } = await supabase
        .from('inventory')
        .select('user_id')
        .eq('id', item.inventory_id)
        .single();

      if (invItem?.user_id) {
        if (!itemsByUser.has(invItem.user_id)) {
          itemsByUser.set(invItem.user_id, []);
        }
        itemsByUser.get(invItem.user_id).push(item);
      }
    }

    // Create notifications for each user
    const notifications = [];
    for (const [userId, items] of itemsByUser) {
      const itemNames = items.map((i: any) => i.item_name).join(', ');
      
      const notification = {
        user_id: userId,
        type: 'spoilage_warning',
        title: `${items.length} item${items.length > 1 ? 's' : ''} may be spoiled`,
        message: `Check these items: ${itemNames}`,
        metadata: {
          items: items.map((i: any) => ({
            id: i.inventory_id,
            name: i.item_name,
            days_old: i.days_old,
            category: i.category
          }))
        }
      };

      notifications.push(notification);
    }

    // Insert all notifications
    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Error creating notifications:', notifError);
      throw notifError;
    }

    console.log('Created', notifications.length, 'notifications');

    return new Response(JSON.stringify({
      success: true,
      count: spoiledItems.length,
      notifications: notifications.length,
      message: `Found ${spoiledItems.length} potentially spoiled items, notified ${notifications.length} users`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in notify-spoilage:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});