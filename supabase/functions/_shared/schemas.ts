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
