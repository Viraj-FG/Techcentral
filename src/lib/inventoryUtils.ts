/**
 * Utility functions for inventory data transformation
 */

interface InventoryItem {
  name: string;
  fillLevel: number;
  unit: string;
  status: string;
  autoOrdering: boolean;
}

/**
 * Transform raw inventory database items into UI format
 */
export const transformInventoryItem = (item: any): InventoryItem => {
  const fillLevel = item.fill_level || 50;
  let status = 'sufficient';
  
  if (fillLevel <= 20) {
    status = 'low';
  } else if (fillLevel <= 50) {
    status = 'medium';
  } else {
    status = 'good';
  }

  return {
    name: item.name,
    fillLevel,
    unit: item.unit || '',
    status: item.status || status,
    autoOrdering: item.auto_order_enabled
  };
};

/**
 * Group inventory items by category
 */
export const groupInventoryByCategory = (inventory: any[]) => {
  return {
    fridge: inventory
      .filter(i => i.category === 'fridge')
      .map(transformInventoryItem),
    pantry: inventory
      .filter(i => i.category === 'pantry')
      .map(transformInventoryItem),
    beauty: inventory
      .filter(i => i.category === 'beauty')
      .map(transformInventoryItem),
    pets: inventory
      .filter(i => i.category === 'pets')
      .map(transformInventoryItem)
  };
};

/**
 * Get inventory status for a category
 */
export const getInventoryStatus = (items: InventoryItem[]): 'good' | 'warning' | 'normal' => {
  if (items.length === 0) return 'normal';
  
  const avgFill = items.reduce((acc, item) => acc + item.fillLevel, 0) / items.length;
  
  if (avgFill >= 60) return 'good';
  if (avgFill <= 30) return 'warning';
  return 'normal';
};
