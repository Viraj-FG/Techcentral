import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { getSupabaseSecrets } from "../_shared/secrets.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CookRecipeRequest {
  recipe: {
    name: string;
    ingredients: Array<{
      name: string;
      quantity: number;
      unit?: string;
    }>;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url: supabaseUrl, serviceRoleKey } = getSupabaseSecrets();
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
    }
    const authHeader = req.headers.get('Authorization')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(user.id, 'cook-recipe');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter!);
    }

    const { recipe }: CookRecipeRequest = await req.json();
    
    if (!recipe || !recipe.name || !recipe.ingredients || recipe.ingredients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Recipe with ingredients required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Processing recipe:', recipe.name, 'with', recipe.ingredients.length, 'ingredients');

    // Fetch user's inventory
    const { data: inventory, error: invError } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', user.id);

    if (invError) throw invError;

    const deductions = [];
    const outOfStock = [];
    const notFound = [];

    // Process each ingredient
    for (const ingredient of recipe.ingredients) {
      const ingredientNameLower = ingredient.name.toLowerCase();
      
      // Fuzzy match: check if inventory item name contains ingredient name or vice versa
      const matchedItem = inventory?.find(item => {
        const itemNameLower = item.name.toLowerCase();
        return itemNameLower.includes(ingredientNameLower) || 
               ingredientNameLower.includes(itemNameLower);
      });

      if (matchedItem) {
        const newQuantity = Math.max(0, (matchedItem.quantity || 0) - ingredient.quantity);
        const isOutOfStock = newQuantity === 0;

        // Update inventory
        const { error: updateError } = await supabase
          .from('inventory')
          .update({
            quantity: newQuantity,
            status: isOutOfStock ? 'out_of_stock' : matchedItem.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', matchedItem.id);

        if (updateError) {
          console.error('Error updating inventory:', updateError);
          continue;
        }

        deductions.push({
          item: matchedItem.name,
          deducted: ingredient.quantity,
          remaining: newQuantity
        });

        // If out of stock, add to shopping list
        if (isOutOfStock) {
          outOfStock.push(matchedItem.name);
          
          await supabase
            .from('shopping_list')
            .insert({
              user_id: user.id,
              item_name: matchedItem.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit || matchedItem.unit,
              source: 'replenishment',
              priority: 'high',
              inventory_id: matchedItem.id
            });
        }
      } else {
        notFound.push(ingredient.name);
      }
    }

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'recipe_cooked',
        title: `Cooked ${recipe.name}`,
        message: `Deducted ${deductions.length} ingredients from inventory`,
        metadata: {
          recipe_name: recipe.name,
          deductions,
          out_of_stock: outOfStock,
          not_found: notFound
        }
      });

    console.log('Recipe processed:', {
      deductions: deductions.length,
      outOfStock: outOfStock.length,
      notFound: notFound.length
    });

    return new Response(JSON.stringify({
      success: true,
      deductions,
      out_of_stock: outOfStock,
      not_found: notFound,
      message: `Deducted ${deductions.length} ingredients. ${outOfStock.length} items added to shopping list.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in cook-recipe:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});