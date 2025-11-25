import { supabase } from "@/integrations/supabase/client";

export interface HouseholdContext {
  inventory: any[];
  members: any[];
  pets: any[];
  shoppingList: any[];
  profile: any;
}

/**
 * Fetch complete household context for contextual updates
 */
export async function fetchHouseholdContext(userId: string): Promise<HouseholdContext | null> {
  try {
    // Get profile with household ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile?.current_household_id) return null;

    // Fetch all household data in parallel
    const [inventoryRes, membersRes, petsRes, cartRes] = await Promise.all([
      supabase
        .from('inventory')
        .select('*')
        .eq('household_id', profile.current_household_id),
      supabase
        .from('household_members')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('pets')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('shopping_list')
        .select('*')
        .eq('household_id', profile.current_household_id)
        .eq('status', 'pending')
    ]);

    return {
      inventory: inventoryRes.data || [],
      members: membersRes.data || [],
      pets: petsRes.data || [],
      shoppingList: cartRes.data || [],
      profile
    };
  } catch (error) {
    console.error('Error fetching household context:', error);
    return null;
  }
}

/**
 * Build comprehensive initial context string
 */
export function buildInitialContext(data: HouseholdContext): string {
  const lines: string[] = ['HOUSEHOLD CONTEXT:'];

  // User info
  if (data.profile.user_name) {
    lines.push(`- User: ${data.profile.user_name}`);
    if (data.profile.calculated_tdee) {
      lines.push(`  TDEE: ${data.profile.calculated_tdee} calories/day`);
    }
  }

  // Household members
  if (data.members.length > 0) {
    lines.push(`- Members (${data.members.length}):`);
    data.members.forEach(m => {
      let memberLine = `  ${m.name || 'Unnamed'} (${m.age || '?'}yo)`;
      if (m.allergies?.length > 0) {
        memberLine += ` - allergies: ${m.allergies.join(', ')}`;
      }
      lines.push(memberLine);
    });
  }

  // Pets
  if (data.pets.length > 0) {
    lines.push(`- Pets (${data.pets.length}):`);
    data.pets.forEach(p => {
      lines.push(`  ${p.name} (${p.species}, ${p.age || '?'}yo)`);
      if (p.toxic_flags_enabled) {
        lines.push(`    ⚠️ Toxic food alerts enabled`);
      }
    });
  }

  // Inventory summary
  lines.push(`\nINVENTORY (${data.inventory.length} items):`);
  
  const lowStock = data.inventory.filter(i => 
    i.status === 'low' || i.status === 'critical' || (i.fill_level && i.fill_level < 30)
  );
  const expiringSoon = data.inventory.filter(i => {
    if (!i.expiry_date) return false;
    const daysUntilExpiry = Math.ceil((new Date(i.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 3 && daysUntilExpiry > 0;
  });

  if (lowStock.length > 0) {
    lines.push(`⚠️ LOW STOCK: ${lowStock.map(i => `${i.name} (${i.quantity || i.fill_level})`).join(', ')}`);
  }
  if (expiringSoon.length > 0) {
    lines.push(`⚠️ EXPIRING SOON: ${expiringSoon.map(i => {
      const days = Math.ceil((new Date(i.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return `${i.name} (${days}d)`;
    }).join(', ')}`);
  }

  const wellStocked = data.inventory.filter(i => 
    i.status === 'sufficient' || (i.fill_level && i.fill_level >= 60)
  ).slice(0, 10); // Limit to 10 items
  if (wellStocked.length > 0) {
    lines.push(`✓ Well stocked: ${wellStocked.map(i => i.name).join(', ')}`);
  }

  // Shopping cart
  if (data.shoppingList.length > 0) {
    lines.push(`\nSHOPPING CART (${data.shoppingList.length} items): ${data.shoppingList.map(i => i.item_name).join(', ')}`);
  }

  // Allergies summary
  const allAllergies = [
    ...(data.profile.allergies || []),
    ...data.members.flatMap(m => m.allergies || [])
  ];
  if (allAllergies.length > 0) {
    lines.push(`\nALLERGIES TO AVOID: ${[...new Set(allAllergies)].join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Build inventory-specific update string
 */
export function buildInventoryUpdate(change: { type: 'INSERT' | 'UPDATE' | 'DELETE'; item: any }): string {
  const { type, item } = change;
  
  if (type === 'INSERT') {
    return `INVENTORY UPDATE: New item added - "${item.name}" (${item.category}, ${item.quantity || item.fill_level || 'unknown qty'})`;
  }
  
  if (type === 'UPDATE') {
    let status = '';
    if (item.status === 'low' || item.status === 'critical') {
      status = ' (⚠️ LOW STOCK)';
    }
    return `INVENTORY UPDATE: "${item.name}" status changed${status}`;
  }
  
  if (type === 'DELETE') {
    return `INVENTORY UPDATE: Item removed - "${item.name}"`;
  }
  
  return '';
}

/**
 * Build shopping list update string
 */
export function buildCartUpdate(items: any[]): string {
  if (items.length === 0) {
    return 'SHOPPING CART: Empty';
  }
  return `SHOPPING CART UPDATE: Now has ${items.length} items (${items.map(i => i.item_name).slice(0, 5).join(', ')}${items.length > 5 ? '...' : ''})`;
}
