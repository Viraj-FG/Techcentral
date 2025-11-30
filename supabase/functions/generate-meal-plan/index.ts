import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getSecret, getSupabaseSecrets } from "../_shared/secrets.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateMealPlanRequest {
  week_start_date: string; // ISO date string
  preferences?: {
    cuisines?: string[];
    avoid_ingredients?: string[];
    cooking_time_max?: number;
    dietary_preferences?: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, anonKey } = getSupabaseSecrets();
    const supabaseClient = createClient(
      url,
      anonKey,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('current_household_id, dietary_preferences, allergies, daily_calorie_goal, daily_protein_goal, daily_carbs_goal, daily_fat_goal')
      .eq('id', user.id)
      .single();

    if (!profile?.current_household_id) {
      return new Response(JSON.stringify({ error: 'No household found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { week_start_date, preferences } = await req.json() as GenerateMealPlanRequest;

    // Fetch expiring inventory
    const weekEndDate = new Date(week_start_date);
    weekEndDate.setDate(weekEndDate.getDate() + 14); // Look 2 weeks ahead for expiring items

    const { data: expiringInventory } = await supabaseClient
      .from('inventory')
      .select('name, expiry_date, category, quantity, unit')
      .eq('household_id', profile.current_household_id)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', weekEndDate.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true })
      .limit(20);

    // Fetch household members for dietary restrictions
    const { data: householdMembers } = await supabaseClient
      .from('household_members')
      .select('name, allergies, dietary_restrictions, health_conditions')
      .eq('user_id', user.id);

    // Fetch pets for toxic food awareness
    const { data: pets } = await supabaseClient
      .from('pets')
      .select('name, species, toxic_flags_enabled')
      .eq('user_id', user.id)
      .eq('toxic_flags_enabled', true);

    // Build AI prompt
    const systemPrompt = `You are a meal planning assistant. Generate a weekly meal plan with breakfast, lunch, and dinner for 7 days.
Consider:
- Expiring ingredients to reduce food waste
- Household dietary restrictions and allergies
- Nutritional goals
- Pet safety (avoid toxic foods)
- Cooking time preferences

Return a JSON object with this structure:
{
  "meal_plan": [
    {
      "date": "YYYY-MM-DD",
      "meal_type": "breakfast|lunch|dinner",
      "recipe": {
        "name": "Recipe Name",
        "ingredients": [{"name": "ingredient", "quantity": 1, "unit": "cup"}],
        "instructions": ["step 1", "step 2"],
        "cooking_time": 30,
        "estimated_calories": 500,
        "servings": 2,
        "explanation": "Why this recipe fits the plan"
      }
    }
  ],
  "shopping_list": [
    {"item_name": "ingredient", "quantity": 2, "unit": "lbs", "priority": "high"}
  ]
}`;

    const userPrompt = `Generate a weekly meal plan starting ${week_start_date}.

Nutritional Goals:
- Calories: ${profile.daily_calorie_goal || 2000}/day
- Protein: ${profile.daily_protein_goal || 150}g/day
- Carbs: ${profile.daily_carbs_goal || 200}g/day
- Fat: ${profile.daily_fat_goal || 65}g/day

Dietary Preferences: ${JSON.stringify(profile.dietary_preferences || [])}
Allergies to Avoid: ${JSON.stringify(profile.allergies || [])}

Household Members Restrictions:
${householdMembers?.map(m => `- ${m.name}: Allergies: ${JSON.stringify(m.allergies)}, Dietary: ${JSON.stringify(m.dietary_restrictions)}`).join('\n')}

Pets in Household (avoid toxic foods):
${pets?.map(p => `- ${p.name} (${p.species})`).join('\n') || 'None'}

Expiring Inventory (use these first):
${expiringInventory?.map(i => `- ${i.name} (expires: ${i.expiry_date}, qty: ${i.quantity} ${i.unit})`).join('\n') || 'None'}

${preferences?.cuisines ? `Preferred Cuisines: ${preferences.cuisines.join(', ')}` : ''}
${preferences?.avoid_ingredients ? `Avoid Ingredients: ${preferences.avoid_ingredients.join(', ')}` : ''}
${preferences?.cooking_time_max ? `Max Cooking Time: ${preferences.cooking_time_max} minutes` : ''}
${preferences?.dietary_preferences ? `Additional Dietary Preferences: ${preferences.dietary_preferences.join(', ')}` : ''}`;

    const GEMINI_API_KEY = getSecret('GOOGLE_GEMINI_API_KEY');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: systemPrompt },
              { text: userPrompt }
            ]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = rawText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || rawText.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', rawText);
      return new Response(JSON.stringify({ error: 'Invalid AI response format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = JSON.parse(jsonMatch[1]);

    // Insert recipes into database
    const recipeInserts = await Promise.all(
      aiResponse.meal_plan.map(async (plan: any) => {
        const { data: recipe, error: recipeError } = await supabaseClient
          .from('recipes')
          .insert({
            household_id: profile.current_household_id,
            user_id: user.id,
            name: plan.recipe.name,
            ingredients: plan.recipe.ingredients,
            instructions: plan.recipe.instructions,
            cooking_time: plan.recipe.cooking_time,
            estimated_calories: plan.recipe.estimated_calories,
            servings: plan.recipe.servings,
            match_score: 100,
          })
          .select()
          .single();

        if (recipeError) {
          console.error('Recipe insert error:', recipeError);
          return null;
        }

        return { ...plan, recipe_id: recipe.id };
      })
    );

    // Insert meal plans
    const mealPlanInserts = recipeInserts.filter(r => r !== null).map(plan => ({
      household_id: profile.current_household_id,
      user_id: user.id,
      recipe_id: plan.recipe_id,
      planned_date: plan.date,
      meal_type: plan.meal_type,
      notes: plan.recipe.explanation,
    }));

    const { error: mealPlanError } = await supabaseClient
      .from('meal_plans')
      .insert(mealPlanInserts);

    if (mealPlanError) {
      console.error('Meal plan insert error:', mealPlanError);
      return new Response(JSON.stringify({ error: 'Failed to save meal plans' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert shopping list items
    if (aiResponse.shopping_list && aiResponse.shopping_list.length > 0) {
      const shoppingListInserts = aiResponse.shopping_list.map((item: any) => ({
        household_id: profile.current_household_id,
        item_name: item.item_name,
        quantity: item.quantity || 1,
        unit: item.unit || '',
        priority: item.priority || 'normal',
        source: 'meal_plan_generator',
        status: 'pending',
      }));

      await supabaseClient
        .from('shopping_list')
        .insert(shoppingListInserts);
    }

    return new Response(
      JSON.stringify({
        success: true,
        meals_created: mealPlanInserts.length,
        shopping_items_added: aiResponse.shopping_list?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error generating meal plan:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
