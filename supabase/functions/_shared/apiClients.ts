/**
 * External API client utilities
 */

/**
 * Search Open Food Facts API
 */
export async function searchOpenFoodFacts(name: string, brand?: string) {
  try {
    const searchTerm = brand ? `${brand} ${name}` : name;
    console.log('Searching Open Food Facts for:', searchTerm);
    
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&action=process&json=1&page_size=10`,
      {
        headers: {
          'User-Agent': 'Kaeva-App/1.0'
        }
      }
    );
    
    if (!response.ok) {
      console.error('Open Food Facts search failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.products || data.products.length === 0) {
      console.log('No products found in Open Food Facts');
      return null;
    }
    
    console.log('Found products in Open Food Facts:', data.products.length);
    const validProduct = data.products.find((p: any) => 
      p.product_name && (p.nutriments?.energy || p.nutriments?.['energy-kcal'])
    );
    return validProduct || data.products[0];
  } catch (error) {
    console.error('Open Food Facts error:', error);
    return null;
  }
}

/**
 * Search Makeup API
 */
export async function searchMakeupAPI(name: string, brand?: string) {
  try {
    let url = 'http://makeup-api.herokuapp.com/api/v1/products.json?';
    
    if (brand) {
      url += `brand=${encodeURIComponent(brand.toLowerCase())}&`;
    }
    
    const productType = inferProductType(name);
    if (productType) {
      url += `product_type=${productType}`;
    }
    
    console.log('Searching Makeup API:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Makeup API search failed:', response.status);
      return null;
    }
    
    const products = await response.json();
    console.log('Makeup API found products:', products.length);
    
    if (!products || products.length === 0) {
      return null;
    }
    
    return findBestMatch(products, name, brand);
  } catch (error) {
    console.error('Makeup API error:', error);
    return null;
  }
}

/**
 * Search Open Pet Food Facts API
 */
export async function searchOpenPetFoodFacts(name: string, brand?: string) {
  try {
    const searchTerm = brand ? `${brand} ${name}` : name;
    console.log('Searching Open Pet Food Facts for:', searchTerm);
    
    const response = await fetch(
      `https://world.openpetfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&action=process&json=1&page_size=5`,
      {
        headers: {
          'User-Agent': 'Kaeva-App/1.0'
        }
      }
    );
    
    if (!response.ok) {
      console.error('Open Pet Food Facts search failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.products || data.products.length === 0) {
      console.log('No products found in Open Pet Food Facts');
      return null;
    }
    
    return data.products[0];
  } catch (error) {
    console.error('Open Pet Food Facts error:', error);
    return null;
  }
}

/**
 * Infer product type from product name
 */
export function inferProductType(name: string): string | null {
  const types: Record<string, string[]> = {
    'lipstick': ['lipstick', 'lip color', 'lip'],
    'eyeliner': ['eyeliner', 'eye liner'],
    'foundation': ['foundation', 'base'],
    'mascara': ['mascara'],
    'eyeshadow': ['eyeshadow', 'eye shadow'],
    'blush': ['blush'],
    'bronzer': ['bronzer'],
    'nail_polish': ['nail polish', 'nail color']
  };
  
  const nameLower = name.toLowerCase();
  for (const [type, keywords] of Object.entries(types)) {
    if (keywords.some(kw => nameLower.includes(kw))) return type;
  }
  return null;
}

/**
 * Find best matching product from search results
 */
export function findBestMatch(products: any[], name: string, brand?: string) {
  const nameLower = name.toLowerCase();
  return products
    .filter(p => !brand || p.brand?.toLowerCase() === brand.toLowerCase())
    .sort((a, b) => {
      const aScore = similarity(a.name.toLowerCase(), nameLower);
      const bScore = similarity(b.name.toLowerCase(), nameLower);
      return bScore - aScore;
    })[0];
}

/**
 * Calculate similarity between two strings
 */
export function similarity(str1: string, str2: string): number {
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  const overlap = words1.filter(w => words2.includes(w)).length;
  return overlap / Math.max(words1.length, words2.length);
}
