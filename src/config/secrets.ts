/**
 * Centralized Configuration for Secrets and Environment Variables
 * 
 * This file serves as the single source of truth for all API keys, secrets,
 * and environment variables used across KAEVA.
 * 
 * CLIENT-SIDE: Direct access to environment variables
 * SERVER-SIDE: Documentation reference for edge function secrets
 */

// ============================================================================
// CLIENT-SIDE ENVIRONMENT VARIABLES
// ============================================================================

/**
 * Client-side environment variables from .env file
 * These are safe to use in the browser (prefixed with VITE_)
 */
export const ENV = {
  /** Supabase project URL */
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
  
  /** Supabase anonymous/public key (safe for client-side use) */
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
  
  /** Supabase project ID */
  SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID as string,
  
  /** Development mode flag */
  IS_DEV: import.meta.env.DEV as boolean,
  
  /** Production mode flag */
  IS_PROD: import.meta.env.PROD as boolean,
} as const;

// ============================================================================
// SERVER-SIDE SECRETS REGISTRY (Documentation Only)
// ============================================================================

/**
 * Server-side secrets stored in Supabase
 * These are only accessible from edge functions via Deno.env.get()
 * 
 * NOTE: This is for DOCUMENTATION purposes only. Client-side code
 * cannot access these secrets. Use supabase/functions/_shared/secrets.ts
 * in edge functions for type-safe access.
 */
export const SERVER_SECRETS_REGISTRY = {
  // Voice & Conversation
  ELEVENLABS_API_KEY: {
    description: 'ElevenLabs API key for voice agent conversations',
    required: true,
    usedBy: ['generate-signed-url', 'provision-agents'],
    externalService: 'https://elevenlabs.io',
  },
  ELEVENLABS_WEBHOOK_SECRET: {
    description: 'ElevenLabs webhook signature verification secret',
    required: true,
    usedBy: ['provision-agents'],
    externalService: 'https://elevenlabs.io',
  },

  // AI & Vision
  GOOGLE_GEMINI_API_KEY: {
    description: 'Google Gemini API key for vision analysis and AI generation',
    required: true,
    usedBy: [
      'analyze-vision',
      'analyze-meal',
      'suggest-recipes',
      'generate-meal-plan',
      'daily-ai-digest',
      'enrich-product',
      'generate-beauty-inspiration',
      'cook-recipe',
    ],
    externalService: 'https://ai.google.dev',
  },
  LOVABLE_API_KEY: {
    description: 'Lovable AI Gateway key for image generation',
    required: true,
    usedBy: ['generate-app-icons'],
    externalService: 'Lovable AI Gateway',
  },
  OPENAI_API_KEY: {
    description: 'OpenAI API key (currently unused, reserved for future features)',
    required: false,
    usedBy: [],
    externalService: 'https://platform.openai.com',
  },

  // Nutrition APIs
  FATSECRET_CLIENT_ID: {
    description: 'FatSecret API client ID for nutrition data (primary source)',
    required: true,
    usedBy: ['enrich-product', 'analyze-meal', 'identify-product'],
    externalService: 'https://platform.fatsecret.com',
  },
  FATSECRET_CLIENT_SECRET: {
    description: 'FatSecret API client secret for OAuth authentication',
    required: true,
    usedBy: ['enrich-product', 'analyze-meal', 'identify-product'],
    externalService: 'https://platform.fatsecret.com',
  },
  USDA_API_KEY: {
    description: 'USDA FoodData Central API key for nutrition fallback',
    required: true,
    usedBy: ['enrich-product', 'analyze-meal'],
    externalService: 'https://fdc.nal.usda.gov',
  },

  // Video & Content
  YOUTUBE_API_KEY: {
    description: 'YouTube Data API v3 key for recipe tutorial videos',
    required: true,
    usedBy: ['search-recipe-videos'],
    externalService: 'https://developers.google.com/youtube/v3',
  },

  // Shopping & Location
  INSTACART_ENVIRONMENT: {
    description: 'Instacart API environment (sandbox or production)',
    required: false,
    usedBy: ['instacart-service', 'instacart-create-cart'],
    externalService: 'https://www.instacart.com/developers',
  },
  GOOGLE_PLACES_API_KEY: {
    description: 'Google Places API key for store location and hours',
    required: false,
    usedBy: ['get-place-hours'],
    externalService: 'https://developers.google.com/maps/documentation/places',
  },

  // Internal/System
  SUPABASE_URL: {
    description: 'Supabase project URL (server-side access)',
    required: true,
    usedBy: ['All edge functions'],
    externalService: 'Supabase',
  },
  SUPABASE_ANON_KEY: {
    description: 'Supabase anonymous key (server-side access)',
    required: true,
    usedBy: ['All edge functions'],
    externalService: 'Supabase',
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    description: 'Supabase service role key for admin operations',
    required: true,
    usedBy: ['All edge functions requiring elevated permissions'],
    externalService: 'Supabase',
  },
  SUPABASE_DB_URL: {
    description: 'Supabase database connection URL',
    required: false,
    usedBy: ['Database migrations and direct DB access'],
    externalService: 'Supabase',
  },
  INVITE_JWT_SECRET: {
    description: 'JWT secret for signing household invite codes',
    required: true,
    usedBy: ['create-household-invite', 'accept-household-invite'],
    externalService: 'Internal',
  },
} as const;

// ============================================================================
// EXTERNAL API ENDPOINTS
// ============================================================================

/**
 * Base URLs for external API services
 */
export const API_ENDPOINTS = {
  // Nutrition APIs
  FATSECRET: 'https://platform.fatsecret.com/rest/server.api',
  USDA: 'https://api.nal.usda.gov/fdc/v1',
  
  // AI Services
  GEMINI: 'https://generativelanguage.googleapis.com/v1beta',
  OPENAI: 'https://api.openai.com/v1',
  ELEVENLABS: 'https://api.elevenlabs.io/v1',
  
  // Video & Content
  YOUTUBE: 'https://www.googleapis.com/youtube/v3',
  
  // Shopping
  INSTACART: 'https://connect.instacart.com/v1',
  
  // Location
  GOOGLE_PLACES: 'https://places.googleapis.com/v1',
  NOMINATIM: 'https://nominatim.openstreetmap.org',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all required server-side secrets
 */
export function getRequiredSecrets(): string[] {
  return Object.entries(SERVER_SECRETS_REGISTRY)
    .filter(([_, config]) => config.required)
    .map(([name]) => name);
}

/**
 * Get secrets required by a specific edge function
 */
export function getSecretsForFunction(functionName: string): string[] {
  return Object.entries(SERVER_SECRETS_REGISTRY)
    .filter(([_, config]) => (config.usedBy as readonly string[]).includes(functionName))
    .map(([name]) => name);
}

/**
 * Get all edge functions that use a specific secret
 */
export function getFunctionsUsingSecret(secretName: keyof typeof SERVER_SECRETS_REGISTRY): readonly string[] {
  return SERVER_SECRETS_REGISTRY[secretName]?.usedBy || [];
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SecretName = keyof typeof SERVER_SECRETS_REGISTRY;
export type ApiEndpoint = keyof typeof API_ENDPOINTS;
