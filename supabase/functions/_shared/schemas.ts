import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Vision Analysis Schema
export const visionAnalysisSchema = z.object({
  imageBase64: z.string().min(100, "Image data required"),
  intent: z.enum(['identify', 'analyze', 'scan_inventory', 'pet_id']).optional(),
});

// Meal Analysis Schema
export const mealAnalysisSchema = z.object({
  imageBase64: z.string().min(100).optional(),
  textDescription: z.string().min(3).optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
}).refine(data => data.imageBase64 || data.textDescription, {
  message: "Either image or text description required"
});

// Product Enrichment Schema
export const productEnrichmentSchema = z.object({
  productName: z.string().min(2).max(200),
  category: z.enum(['fridge', 'pantry', 'beauty', 'pets']),
  barcode: z.string().optional(),
});

// Recipe Suggestion Schema
export const recipeSuggestionSchema = z.object({
  availableIngredients: z.array(z.string()).min(1).max(100),
  dietaryPreferences: z.array(z.string()).optional(),
  appliances: z.array(z.string()).optional(),
  servings: z.number().int().min(1).max(20).optional(),
});

// Household Invite Schema
export const householdInviteSchema = z.object({
  householdId: z.string().uuid(),
  expiresInHours: z.number().int().min(1).max(168).default(24),
  maxUses: z.number().int().min(1).max(100).default(10),
});

// Accept Invite Schema
export const acceptInviteSchema = z.object({
  inviteCode: z.string().min(10).max(500),
});

// Instacart Cart Schema
export const instacartCartSchema = z.object({
  items: z.array(z.object({
    name: z.string().min(1).max(200),
    quantity: z.number().int().min(1).max(99),
  })).min(1).max(100),
  retailerId: z.string().optional(),
});

// Social Recipe Extract Schema
export const socialRecipeSchema = z.object({
  url: z.string().url(),
});

// Detect Intent Schema
export const detectIntentSchema = z.object({
  image: z.string().min(100, "Image data required"),
});

// Social Recipe Extract Schema (already exists, enhanced)
export const socialRecipeEnhancedSchema = z.object({
  url: z.string().url().optional(),
  image: z.string().optional(),
  user_id: z.string().uuid(),
}).refine(data => data.url || data.image, {
  message: "Either url or image is required"
}).refine(data => !(data.url && data.image), {
  message: "Provide either url OR image, not both"
});

// Signed URL Schema
export const signedUrlSchema = z.object({
  agentId: z.string().min(1, "Agent ID required"),
});

// Place Hours Schema
export const placeHoursSchema = z.object({
  name: z.string().min(1, "Place name required"),
  address: z.string().min(1, "Address required"),
  city: z.string().min(1, "City required"),
  state: z.string().length(2, "State must be 2 characters"),
});

// Instacart Service Schema
export const instacartServiceSchema = z.object({
  action: z.enum(['create_cart', 'create_recipe', 'swap_product', 'get_nearby_retailers']),
  userId: z.string().uuid().optional(),
  items: z.array(z.object({
    name: z.string(),
    brand: z.string().optional(),
    quantity: z.number().positive(),
    unit: z.string(),
  })).optional(),
  recipeData: z.object({
    name: z.string(),
    ingredients: z.array(z.any()),
    servings: z.number().optional(),
    image_url: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
  swapData: z.object({
    productName: z.string(),
    brand: z.string().optional(),
  }).optional(),
  zipCode: z.string().optional(),
  retailerId: z.string().optional(),
});

// Cook Recipe Schema
export const cookRecipeSchema = z.object({
  recipe: z.object({
    name: z.string().min(1, "Recipe name required"),
    ingredients: z.array(z.object({
      name: z.string().min(1),
      quantity: z.number().positive(),
      unit: z.string().optional(),
    })).min(1, "At least one ingredient required"),
  }),
});

// Generic validation helper
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return { success: false, error: messages.join(', ') };
    }
    return { success: false, error: 'Validation failed' };
  }
}
