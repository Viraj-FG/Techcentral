import { extractAllergens, extractDietaryFlags, extractAllergensFromOFF, extractDietaryFlagsFromOFF } from './allergenDetection.ts';

/**
 * Process FatSecret food data into standard format
 */
export function processFood(food: any) {
  const serving = Array.isArray(food.servings?.serving) 
    ? food.servings.serving[0] 
    : food.servings?.serving;

  const imageUrl = food.food_images?.food_image?.[0]?.image_url || 
                   food.food_images?.food_image?.image_url || null;

  return {
    fatsecret_id: food.food_id,
    name: food.food_name,
    brand: food.brand_name || null,
    image_url: imageUrl,
    nutrition: {
      calories: parseFloat(serving?.calories || '0'),
      protein: parseFloat(serving?.protein || '0'),
      carbs: parseFloat(serving?.carbohydrate || '0'),
      fat: parseFloat(serving?.fat || '0'),
      saturated_fat: parseFloat(serving?.saturated_fat || '0'),
      sodium: parseFloat(serving?.sodium || '0'),
      sugar: parseFloat(serving?.sugar || '0'),
      fiber: parseFloat(serving?.fiber || '0')
    },
    allergens: extractAllergens(food),
    dietary_flags: extractDietaryFlags(food),
    serving_size: serving?.serving_description || null
  };
}

/**
 * Process Open Food Facts data into standard format
 */
export function processOpenFoodFactsProduct(product: any) {
  const nutriments = product.nutriments || {};
  
  let calories = parseFloat(nutriments['energy-kcal'] || nutriments.energy_value || '0');
  if (calories === 0 && nutriments.energy) {
    calories = parseFloat(nutriments.energy) / 4.184;
  }
  
  return {
    fatsecret_id: null,
    name: product.product_name || product.product_name_en || 'Unknown Product',
    brand: product.brands?.split(',')[0]?.trim() || null,
    image_url: product.image_url || product.image_front_url || product.image_small_url || null,
    nutrition: {
      calories: Math.round(calories),
      protein: parseFloat(nutriments.proteins || nutriments.proteins_100g || '0'),
      carbs: parseFloat(nutriments.carbohydrates || nutriments.carbohydrates_100g || '0'),
      fat: parseFloat(nutriments.fat || nutriments.fat_100g || '0'),
      saturated_fat: parseFloat(nutriments['saturated-fat'] || nutriments['saturated-fat_100g'] || '0'),
      sodium: parseFloat(nutriments.sodium || nutriments.sodium_100g || '0') * 1000,
      sugar: parseFloat(nutriments.sugars || nutriments.sugars_100g || '0'),
      fiber: parseFloat(nutriments.fiber || nutriments.fiber_100g || '0')
    },
    allergens: extractAllergensFromOFF(product),
    dietary_flags: extractDietaryFlagsFromOFF(product),
    serving_size: product.serving_size || product.serving_quantity || '100g',
    source: 'openfoodfacts'
  };
}

/**
 * Process Makeup API data into standard format
 */
export function processMakeupProduct(product: any) {
  return {
    fatsecret_id: null,
    name: product.name,
    brand: product.brand || null,
    image_url: product.image_link || null,
    product_type: product.product_type,
    price: product.price ? `$${product.price}` : null,
    category: product.category || null,
    tags: product.tag_list || [],
    nutrition: null,
    allergens: [],
    dietary_flags: product.tag_list || [],
    description: product.description || null,
    source: 'makeup-api'
  };
}

/**
 * Process Open Pet Food Facts data into standard format
 */
export function processOpenPetFoodFactsProduct(product: any) {
  const nutriments = product.nutriments || {};
  
  return {
    fatsecret_id: null,
    name: product.product_name || 'Unknown Pet Product',
    brand: product.brands?.split(',')[0]?.trim() || null,
    image_url: product.image_url || product.image_front_url || null,
    nutrition: {
      calories: parseFloat(nutriments['energy-kcal'] || '0'),
      protein: parseFloat(nutriments.proteins || '0'),
      carbs: parseFloat(nutriments.carbohydrates || '0'),
      fat: parseFloat(nutriments.fat || '0'),
      fiber: parseFloat(nutriments.fiber || '0')
    },
    allergens: [],
    dietary_flags: product.labels_tags || [],
    serving_size: product.serving_size || '100g',
    source: 'openpetfoodfacts'
  };
}
