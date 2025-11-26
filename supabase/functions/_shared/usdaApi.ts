/**
 * USDA FoodData Central API integration
 * Provides nutrition data as fallback when FatSecret fails
 */

interface USDAFood {
  fdcId: number;
  description: string;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    nutrientNumber: string;
    unitName: string;
    value: number;
  }>;
  brandOwner?: string;
  brandName?: string;
  gtinUpc?: string;
}

export async function searchUSDA(foodName: string, apiKey: string): Promise<any | null> {
  try {
    console.log('Searching USDA FoodData Central for:', foodName);

    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: foodName,
          dataType: ['Survey (FNDDS)', 'SR Legacy', 'Branded'],
          pageSize: 5,
          sortBy: 'dataType.keyword',
          sortOrder: 'asc'
        })
      }
    );

    if (!response.ok) {
      console.error('USDA API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.foods || data.foods.length === 0) {
      console.log('No foods found in USDA');
      return null;
    }

    const food = data.foods[0];
    console.log('Found USDA food:', food.description);

    return food;
  } catch (error) {
    console.error('Error searching USDA:', error);
    return null;
  }
}

export function processUSDAFood(food: USDAFood): any {
  // Map common nutrient IDs to our nutrition structure
  const nutrientMap: Record<string, string> = {
    '1008': 'calories', // Energy (kcal)
    '1003': 'protein',  // Protein
    '1004': 'fat',      // Total lipid (fat)
    '1005': 'carbs',    // Carbohydrate, by difference
    '1079': 'fiber',    // Fiber, total dietary
    '1093': 'sodium',   // Sodium, Na
  };

  const nutrition: Record<string, number> = {};

  food.foodNutrients.forEach(nutrient => {
    const key = nutrientMap[nutrient.nutrientId.toString()];
    if (key) {
      nutrition[key] = Math.round(nutrient.value * 10) / 10;
    }
  });

  return {
    name: food.description,
    brand: food.brandOwner || food.brandName || null,
    barcode: food.gtinUpc || null,
    image_url: null, // USDA doesn't provide images
    nutrition: {
      calories: nutrition.calories || 0,
      protein: nutrition.protein || 0,
      fat: nutrition.fat || 0,
      carbs: nutrition.carbs || 0,
      fiber: nutrition.fiber || 0,
      sodium: nutrition.sodium || 0,
      serving_size: '100g', // USDA data is per 100g
      servings_per_container: 1
    },
    source: 'usda',
    fdc_id: food.fdcId,
    enriched: true
  };
}