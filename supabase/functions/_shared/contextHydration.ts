import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface UserContext {
  profile: {
    name: string;
    tdee: number | null;
    allergies: string[];
    dietaryPreferences: string[];
    healthGoals: string[];
    lifestyleGoals: string[];
  };
  household: {
    members: Array<{
      name: string | null;
      type: string;
      ageGroup: string | null;
      allergies: string[];
      dietaryRestrictions: string[];
    }>;
    summary: string;
  };
  pets: {
    list: Array<{
      name: string;
      species: string;
      breed: string | null;
    }>;
    summary: string;
    hasToxicSensitivity: boolean;
  };
  inventory: {
    topItems: Array<{
      name: string;
      quantity: number;
      unit: string | null;
      category: string;
      status: string;
    }>;
    lowStock: Array<{ name: string }>;
    expiringSoon: Array<{ name: string; expiryDate: string }>;
    summary: string;
  };
  shoppingList: {
    count: number;
    items: Array<{ name: string; reason: string }>;
  };
}

/**
 * Fetch comprehensive user context from database
 */
export async function fetchUserContext(
  supabase: SupabaseClient,
  userId: string
): Promise<UserContext> {
  console.log("📦 Fetching user context for:", userId);

  // Fetch profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // Fetch household members
  const { data: householdMembers } = await supabase
    .from("household_members")
    .select("*")
    .eq("user_id", userId);

  // Fetch pets
  const { data: pets } = await supabase
    .from("pets")
    .select("*")
    .eq("user_id", userId);

  // Fetch inventory (top 20 items + low stock)
  const { data: inventory } = await supabase
    .from("inventory")
    .select("name, quantity, unit, category, status, expiry_date")
    .eq("user_id", userId)
    .order("last_activity_at", { ascending: false })
    .limit(20);

  // Fetch shopping list
  const { data: shoppingList } = await supabase
    .from("shopping_list")
    .select("item_name, source, status")
    .eq("user_id", userId)
    .eq("status", "pending");

  // Calculate expiring soon items (within 3 days)
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const expiringSoon =
    inventory?.filter((item) => {
      if (!item.expiry_date) return false;
      const expiryDate = new Date(item.expiry_date);
      return expiryDate <= threeDaysFromNow && expiryDate >= now;
    }) || [];

  // Calculate low stock items
  const lowStock =
    inventory?.filter((item) => item.status === "low" || item.status === "critical") || [];

  // Build context object
  const context: UserContext = {
    profile: {
      name: profile?.user_name || "User",
      tdee: profile?.calculated_tdee || null,
      allergies: (profile?.allergies as string[]) || [],
      dietaryPreferences: (profile?.dietary_preferences as string[]) || [],
      healthGoals: (profile?.health_goals as string[]) || [],
      lifestyleGoals: (profile?.lifestyle_goals as string[]) || [],
    },
    household: {
      members:
        householdMembers?.map((m) => ({
          name: m.name,
          type: m.member_type,
          ageGroup: m.age_group,
          allergies: (m.allergies as string[]) || [],
          dietaryRestrictions: (m.dietary_restrictions as string[]) || [],
        })) || [],
      summary:
        householdMembers
          ?.map((m) => {
            const allergies = (m.allergies as string[]) || [];
            const allergyStr = allergies.length > 0 ? ` (Allergies: ${allergies.join(", ")})` : "";
            return `${m.name || m.member_type}${allergyStr}`;
          })
          .join(", ") || "No household members registered",
    },
    pets: {
      list:
        pets?.map((p) => ({
          name: p.name,
          species: p.species,
          breed: p.breed,
        })) || [],
      summary:
        pets?.map((p) => `${p.name} (${p.species}${p.breed ? `, ${p.breed}` : ""})`).join(", ") ||
        "No pets registered",
      hasToxicSensitivity: (pets?.length || 0) > 0,
    },
    inventory: {
      topItems:
        inventory?.slice(0, 10).map((i) => ({
          name: i.name,
          quantity: i.quantity || 0,
          unit: i.unit,
          category: i.category,
          status: i.status || "sufficient",
        })) || [],
      lowStock: lowStock.map((i) => ({ name: i.name })),
      expiringSoon: expiringSoon.map((i) => ({
        name: i.name,
        expiryDate: i.expiry_date!,
      })),
      summary:
        inventory && inventory.length > 0
          ? `${inventory.length} items tracked. ${lowStock.length} low stock. ${expiringSoon.length} expiring soon.`
          : "No inventory items tracked",
    },
    shoppingList: {
      count: shoppingList?.length || 0,
      items:
        shoppingList?.map((item) => ({
          name: item.item_name,
          reason: item.source || "manual",
        })) || [],
    },
  };

  console.log("✅ Context fetched successfully");
  return context;
}

/**
 * Build formatted context prompt for agent injection
 */
export function buildContextPrompt(context: UserContext): string {
  const { profile, household, pets, inventory, shoppingList } = context;

  // Build Shield line (allergies + dietary preferences)
  const shieldParts = [];
  if (profile.allergies.length > 0) {
    shieldParts.push(`Allergies: ${profile.allergies.join(", ")}`);
  }
  if (profile.dietaryPreferences.length > 0) {
    shieldParts.push(profile.dietaryPreferences.join(", "));
  }
  const shieldLine = shieldParts.length > 0 ? shieldParts.join(" | ") : "None";

  // Build inventory snapshot with warnings
  const inventoryLines = [];
  if (inventory.expiringSoon.length > 0) {
    inventoryLines.push(
      `⚠️ Expiring Soon: ${inventory.expiringSoon.map((i) => i.name).join(", ")}`
    );
  }
  if (inventory.lowStock.length > 0) {
    inventoryLines.push(
      `📉 Low Stock: ${inventory.lowStock.map((i) => i.name).join(", ")}`
    );
  }
  if (inventory.topItems.length > 0) {
    const topItems = inventory.topItems
      .slice(0, 5)
      .map((i) => `${i.name} (${i.quantity}${i.unit || ""})`)
      .join(", ");
    inventoryLines.push(`Recent: ${topItems}`);
  }
  const inventorySummary =
    inventoryLines.length > 0 ? inventoryLines.join("\n  ") : "No items tracked";

  // Build shopping cart summary
  const cartSummary =
    shoppingList.count > 0
      ? `${shoppingList.count} items pending: ${shoppingList.items.map((i) => i.name).slice(0, 5).join(", ")}`
      : "Cart empty";

  // Build TDEE line
  const tdeeLine = profile.tdee ? `${profile.tdee} calories/day` : "Not calculated";

  return `[USER CONTEXT]
Name: ${profile.name}
TDEE Baseline: ${tdeeLine}
Shield: ${shieldLine}
Tribe: ${household.summary} | Pets: ${pets.summary}
Inventory Snapshot:
  ${inventorySummary}
Cart Status: ${cartSummary}
[END CONTEXT]`;
}
