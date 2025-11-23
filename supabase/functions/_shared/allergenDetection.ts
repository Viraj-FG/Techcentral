/**
 * Allergen and dietary flag detection utilities
 */

const ALLERGEN_MAP: Record<string, string[]> = {
  dairy: ['milk', 'dairy', 'cheese', 'butter', 'cream', 'whey', 'lactose'],
  eggs: ['egg', 'eggs'],
  soy: ['soy', 'soya'],
  wheat: ['wheat', 'gluten'],
  nuts: ['almond', 'cashew', 'walnut', 'pecan', 'pistachio'],
  peanuts: ['peanut'],
  fish: ['fish', 'salmon', 'tuna'],
  shellfish: ['shrimp', 'crab', 'lobster']
};

/**
 * Extract allergens from FatSecret food data
 */
export function extractAllergens(food: any): string[] {
  const allergens: string[] = [];
  const description = food.food_description?.toLowerCase() || '';

  for (const [allergen, keywords] of Object.entries(ALLERGEN_MAP)) {
    if (keywords.some(kw => description.includes(kw))) {
      allergens.push(allergen);
    }
  }

  return allergens;
}

/**
 * Extract allergens from Open Food Facts data
 */
export function extractAllergensFromOFF(product: any): string[] {
  const allergens: string[] = [];
  const allergenTags = product.allergens_tags || [];
  const ingredients = (product.ingredients_text || '').toLowerCase();
  
  const allergenTagMap: Record<string, string[]> = {
    dairy: ['en:milk', 'en:dairy'],
    eggs: ['en:eggs'],
    soy: ['en:soybeans'],
    wheat: ['en:gluten'],
    nuts: ['en:nuts'],
    peanuts: ['en:peanuts'],
    fish: ['en:fish'],
    shellfish: ['en:crustaceans', 'en:molluscs']
  };
  
  for (const [allergen, tags] of Object.entries(allergenTagMap)) {
    if (tags.some(tag => allergenTags.includes(tag)) || 
        tags.some(tag => ingredients.includes(tag.replace('en:', '')))) {
      allergens.push(allergen);
    }
  }
  
  return allergens;
}

/**
 * Extract dietary flags from FatSecret food data
 */
export function extractDietaryFlags(food: any): string[] {
  const flags: string[] = [];
  const description = food.food_description?.toLowerCase() || '';
  
  if (description.includes('organic')) flags.push('organic');
  if (description.includes('vegan') || description.includes('plant-based')) flags.push('vegan');
  if (description.includes('gluten-free') || description.includes('gluten free')) flags.push('gluten_free');
  if (description.includes('kosher')) flags.push('kosher');
  if (description.includes('halal')) flags.push('halal');
  if (description.includes('low sodium') || description.includes('low-sodium')) flags.push('low_sodium');
  
  return flags;
}

/**
 * Extract dietary flags from Open Food Facts data
 */
export function extractDietaryFlagsFromOFF(product: any): string[] {
  const flags: string[] = [];
  const labels = product.labels_tags || [];
  
  if (labels.includes('en:organic')) flags.push('organic');
  if (labels.includes('en:vegan')) flags.push('vegan');
  if (labels.includes('en:gluten-free')) flags.push('gluten_free');
  if (labels.includes('en:kosher')) flags.push('kosher');
  if (labels.includes('en:halal')) flags.push('halal');
  
  return flags;
}
