import { supabase } from "@/integrations/supabase/client";

/**
 * Log tool call to conversation history for debugging
 */
const logToolCall = async (
  toolName: string,
  parameters: any,
  result: string,
  error?: string
) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    await supabase.from("conversation_history").insert({
      user_id: session.user.id,
      conversation_id: crypto.randomUUID(),
      role: "tool",
      message: `Tool: ${toolName}`,
      metadata: {
        tool: toolName,
        parameters,
        result,
        error: error || null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Failed to log tool call:", err);
  }
};

/**
 * Check inventory for a specific item
 */
export const createCheckInventoryTool = () => {
  return async (parameters: { query: string }) => {
    const toolName = "check_inventory";
    console.log(`🔍 ${toolName}:`, parameters);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        await logToolCall(toolName, parameters, "ERROR: Not authenticated");
        return "I need you to be logged in to check inventory.";
      }

      const { data: items, error } = await supabase
        .from("inventory")
        .select("name, quantity, unit, status, expiry_date, category")
        .eq("user_id", session.user.id)
        .ilike("name", `%${parameters.query}%`)
        .limit(10);

      if (error) throw error;

      if (!items || items.length === 0) {
        const result = `No items found matching "${parameters.query}"`;
        await logToolCall(toolName, parameters, result);
        return result;
      }

      const itemList = items
        .map((i) => {
          const qty = `${i.quantity || 0}${i.unit ? " " + i.unit : ""}`;
          const status = i.status === "low" ? " (LOW STOCK)" : "";
          const expiry = i.expiry_date
            ? ` - expires ${new Date(i.expiry_date).toLocaleDateString()}`
            : "";
          return `${i.name}: ${qty}${status}${expiry}`;
        })
        .join(", ");

      const result = `Found ${items.length} items: ${itemList}`;
      await logToolCall(toolName, parameters, result);
      return result;
    } catch (error) {
      console.error(`${toolName} error:`, error);
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";
      await logToolCall(toolName, parameters, "ERROR", errorMsg);
      return "I tried to check your inventory, but my connection blinked. Please try again.";
    }
  };
};

/**
 * Add item to shopping cart
 */
export const createAddToCartTool = () => {
  return async (parameters: { item_name: string; reason: string }) => {
    const toolName = "add_to_cart";
    console.log(`🛒 ${toolName}:`, parameters);

    if (!parameters.reason) {
      const result = "ERROR: Reason is required";
      await logToolCall(toolName, parameters, result);
      return "I need a reason why you want to add this item. For example: 'running low' or 'for tonight's dinner'";
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        await logToolCall(toolName, parameters, "ERROR: Not authenticated");
        return "I need you to be logged in to add items to your cart.";
      }

      const { error } = await supabase.from("shopping_list").insert({
        user_id: session.user.id,
        item_name: parameters.item_name,
        source: "voice",
        status: "pending",
        quantity: 1,
      });

      if (error) throw error;

      const result = `Added ${parameters.item_name} to cart (reason: ${parameters.reason})`;
      await logToolCall(toolName, parameters, result);
      return result;
    } catch (error) {
      console.error(`${toolName} error:`, error);
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";
      await logToolCall(toolName, parameters, "ERROR", errorMsg);
      return "I tried to add that to your cart, but my connection blinked. Please try again.";
    }
  };
};

/**
 * Log a meal
 */
export const createLogMealTool = () => {
  return async (parameters: { description: string }) => {
    const toolName = "log_meal";
    console.log(`🍽️ ${toolName}:`, parameters);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        await logToolCall(toolName, parameters, "ERROR: Not authenticated");
        return "I need you to be logged in to log meals.";
      }

      // Call analyze-meal edge function
      const { data, error } = await supabase.functions.invoke("analyze-meal", {
        body: {
          description: parameters.description,
          meal_type: "snack", // Default, can be enhanced
        },
      });

      if (error) throw error;

      const nutrition = data?.nutrition || {};
      const result = `Logged: ${parameters.description} (${nutrition.calories || "?"} cal, ${nutrition.protein || "?"}g protein)`;
      await logToolCall(toolName, parameters, result);
      return result;
    } catch (error) {
      console.error(`${toolName} error:`, error);
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";
      await logToolCall(toolName, parameters, "ERROR", errorMsg);
      return "I tried to log that meal, but my connection blinked. Please try again.";
    }
  };
};

/**
 * Search for recipes
 */
export const createSearchRecipesTool = () => {
  return async (parameters: { constraints?: any }) => {
    const toolName = "search_recipes";
    console.log(`📖 ${toolName}:`, parameters);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        await logToolCall(toolName, parameters, "ERROR: Not authenticated");
        return "I need you to be logged in to search recipes.";
      }

      // Fetch user allergies to auto-filter
      const { data: profile } = await supabase
        .from("profiles")
        .select("allergies")
        .eq("id", session.user.id)
        .single();

      const allergies = (profile?.allergies as string[]) || [];

      // Call suggest-recipes edge function
      const { data, error } = await supabase.functions.invoke(
        "suggest-recipes",
        {
          body: {
            constraints: {
              ...parameters.constraints,
              excludeAllergens: allergies,
            },
          },
        }
      );

      if (error) throw error;

      const recipes = data?.recipes || [];
      if (recipes.length === 0) {
        const result = "No recipes found matching your criteria";
        await logToolCall(toolName, parameters, result);
        return result;
      }

      const recipeList = recipes
        .slice(0, 5)
        .map((r: any) => `${r.name} (${r.cooking_time || "?"}min)`)
        .join(", ");
      const result = `Found ${recipes.length} recipes: ${recipeList}`;
      await logToolCall(toolName, parameters, result);
      return result;
    } catch (error) {
      console.error(`${toolName} error:`, error);
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";
      await logToolCall(toolName, parameters, "ERROR", errorMsg);
      return "I tried to search recipes, but my connection blinked. Please try again.";
    }
  };
};

/**
 * Check if an ingredient is safe for the household
 */
export const createCheckAllergensTool = () => {
  return async (parameters: { ingredient: string }) => {
    const toolName = "check_allergens";
    console.log(`🛡️ ${toolName}:`, parameters);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        await logToolCall(toolName, parameters, "ERROR: Not authenticated");
        return "I need you to be logged in to check allergens.";
      }

      const warnings: string[] = [];

      // Check user allergies
      const { data: profile } = await supabase
        .from("profiles")
        .select("allergies")
        .eq("id", session.user.id)
        .single();

      const userAllergies = (profile?.allergies as string[]) || [];
      const ingredient = parameters.ingredient.toLowerCase();

      userAllergies.forEach((allergen) => {
        if (ingredient.includes(allergen.toLowerCase())) {
          warnings.push(
            `⚠️ WARNING: ${parameters.ingredient} contains ${allergen} (YOU are allergic)`
          );
        }
      });

      // Check household member allergies
      const { data: householdMembers } = await supabase
        .from("household_members")
        .select("name, member_type, allergies")
        .eq("user_id", session.user.id);

      householdMembers?.forEach((member) => {
        const allergies = (member.allergies as string[]) || [];
        allergies.forEach((allergen) => {
          if (ingredient.includes(allergen.toLowerCase())) {
            warnings.push(
              `⚠️ WARNING: ${parameters.ingredient} contains ${allergen} (${member.name || member.member_type} is allergic)`
            );
          }
        });
      });

      // Check pet toxic foods
      const { data: pets } = await supabase
        .from("pets")
        .select("name, species")
        .eq("user_id", session.user.id)
        .eq("toxic_flags_enabled", true);

      if (pets && pets.length > 0) {
        const toxicFoods = [
          "chocolate",
          "xylitol",
          "grapes",
          "raisins",
          "onion",
          "garlic",
          "avocado",
          "macadamia",
        ];
        toxicFoods.forEach((toxic) => {
          if (ingredient.includes(toxic)) {
            pets.forEach((pet) => {
              warnings.push(
                `🚨 TOXIC WARNING: ${parameters.ingredient} contains ${toxic} - TOXIC to ${pet.name} (${pet.species})`
              );
            });
          }
        });
      }

      const result =
        warnings.length > 0
          ? warnings.join("\n")
          : `✅ SAFE: ${parameters.ingredient} is safe for your household`;

      await logToolCall(toolName, parameters, result);
      return result;
    } catch (error) {
      console.error(`${toolName} error:`, error);
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";
      await logToolCall(toolName, parameters, "ERROR", errorMsg);
      return "I tried to check allergens, but my connection blinked. Please try again.";
    }
  };
};
