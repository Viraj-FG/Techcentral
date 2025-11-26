interface IngredientWarning {
  ingredient: string;
  category: 'harmful' | 'irritant' | 'comedogenic' | 'allergen';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface SkinCompatibility {
  score: number; // 0-100
  warnings: string[];
  recommendations: string[];
}

// Harmful ingredients database
const HARMFUL_INGREDIENTS = {
  parabens: {
    keywords: ['paraben', 'methylparaben', 'propylparaben', 'butylparaben', 'ethylparaben'],
    severity: 'high' as const,
    description: 'Potential hormone disruptor. May cause allergic reactions.'
  },
  sulfates: {
    keywords: ['sulfate', 'sls', 'sles', 'sodium lauryl sulfate', 'sodium laureth sulfate'],
    severity: 'medium' as const,
    description: 'Harsh surfactant. Can strip natural oils and cause irritation.'
  },
  phthalates: {
    keywords: ['phthalate', 'dbp', 'dehp', 'dep'],
    severity: 'high' as const,
    description: 'Potential endocrine disruptor. Linked to reproductive issues.'
  },
  formaldehyde: {
    keywords: ['formaldehyde', 'formalin', 'methanal', 'quaternium-15', 'dmdm hydantoin'],
    severity: 'high' as const,
    description: 'Known carcinogen. Can cause allergic reactions and skin irritation.'
  },
  synthetic_fragrance: {
    keywords: ['fragrance', 'parfum', 'perfume'],
    severity: 'medium' as const,
    description: 'May contain allergens. Common cause of skin irritation.'
  },
  mineral_oil: {
    keywords: ['mineral oil', 'petrolatum', 'paraffin'],
    severity: 'low' as const,
    description: 'Can clog pores. May prevent skin from breathing.'
  }
};

// Comedogenic ingredients (pore-clogging)
const COMEDOGENIC_INGREDIENTS = [
  'coconut oil', 'cocoa butter', 'isopropyl myristate', 'isopropyl palmitate',
  'acetylated lanolin', 'wheat germ oil'
];

// Irritants for sensitive skin
const SENSITIVE_SKIN_IRRITANTS = [
  'alcohol', 'denatured alcohol', 'sd alcohol', 'fragrance', 'parfum',
  'essential oil', 'retinol', 'tretinoin', 'benzoyl peroxide'
];

// Drying ingredients (bad for dry skin)
const DRYING_INGREDIENTS = [
  'alcohol', 'witch hazel', 'sodium lauryl sulfate', 'sodium laureth sulfate'
];

export function analyzeBeautyIngredients(ingredientsList: string): IngredientWarning[] {
  const warnings: IngredientWarning[] = [];
  const ingredientsLower = ingredientsList.toLowerCase();

  // Check for harmful ingredients
  for (const [category, data] of Object.entries(HARMFUL_INGREDIENTS)) {
    for (const keyword of data.keywords) {
      if (ingredientsLower.includes(keyword)) {
        warnings.push({
          ingredient: keyword,
          category: 'harmful',
          severity: data.severity,
          description: data.description
        });
        break; // Only warn once per category
      }
    }
  }

  // Check for comedogenic ingredients
  for (const ingredient of COMEDOGENIC_INGREDIENTS) {
    if (ingredientsLower.includes(ingredient)) {
      warnings.push({
        ingredient,
        category: 'comedogenic',
        severity: 'medium',
        description: 'May clog pores and cause breakouts.'
      });
    }
  }

  return warnings;
}

export function analyzeSkinCompatibility(
  ingredientsList: string,
  skinType: string
): SkinCompatibility {
  const ingredientsLower = ingredientsList.toLowerCase();
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  switch (skinType.toLowerCase()) {
    case 'oily':
      // Check for comedogenic ingredients
      for (const ingredient of COMEDOGENIC_INGREDIENTS) {
        if (ingredientsLower.includes(ingredient)) {
          warnings.push(`Contains ${ingredient} which may clog pores`);
          score -= 15;
        }
      }
      
      // Check for heavy oils
      if (ingredientsLower.includes('oil') && !ingredientsLower.includes('jojoba')) {
        warnings.push('Heavy oils may worsen oiliness');
        score -= 10;
      }
      
      recommendations.push('Look for oil-free, non-comedogenic formulas');
      recommendations.push('Ingredients like salicylic acid and niacinamide are beneficial');
      break;

    case 'dry':
      // Check for drying ingredients
      for (const ingredient of DRYING_INGREDIENTS) {
        if (ingredientsLower.includes(ingredient)) {
          warnings.push(`Contains ${ingredient} which may dry skin`);
          score -= 15;
        }
      }
      
      recommendations.push('Look for hydrating ingredients like hyaluronic acid');
      recommendations.push('Avoid alcohol-based products');
      break;

    case 'sensitive':
      // Check for irritants
      for (const irritant of SENSITIVE_SKIN_IRRITANTS) {
        if (ingredientsLower.includes(irritant)) {
          warnings.push(`Contains ${irritant} which may irritate sensitive skin`);
          score -= 20;
        }
      }
      
      recommendations.push('Look for fragrance-free, hypoallergenic formulas');
      recommendations.push('Patch test before full application');
      break;

    case 'combination':
      // Moderate checks
      if (ingredientsLower.includes('alcohol')) {
        warnings.push('Alcohol may dry out already-dry areas');
        score -= 10;
      }
      
      recommendations.push('Use different products for different zones');
      recommendations.push('Look for balanced, gentle formulas');
      break;

    default:
      recommendations.push('Patch test new products before use');
  }

  return {
    score: Math.max(0, score),
    warnings,
    recommendations
  };
}
