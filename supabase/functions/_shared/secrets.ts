/**
 * Server-Side Secrets Utility for Edge Functions
 * 
 * Provides type-safe access to Supabase secrets with validation and error handling.
 * Use this module in all edge functions instead of direct Deno.env.get() calls.
 * 
 * @example
 * ```typescript
 * import { getSecret, validateRequiredSecrets, SECRET_GROUPS } from '../_shared/secrets.ts';
 * 
 * // Validate all required secrets at function start
 * validateRequiredSecrets(SECRET_GROUPS.nutrition);
 * 
 * // Get individual secrets with type safety
 * const apiKey = getSecret('GOOGLE_GEMINI_API_KEY');
 * const optionalKey = getOptionalSecret('OPENAI_API_KEY');
 * ```
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * All available secret names in Supabase
 */
export type SecretName =
  // Voice & Conversation
  | 'ELEVENLABS_API_KEY'
  | 'ELEVENLABS_WEBHOOK_SECRET'
  // AI & Vision
  | 'GOOGLE_GEMINI_API_KEY'
  | 'LOVABLE_API_KEY'
  | 'OPENAI_API_KEY'
  // Nutrition APIs
  | 'FATSECRET_CLIENT_ID'
  | 'FATSECRET_CLIENT_SECRET'
  | 'USDA_API_KEY'
  // Video & Content
  | 'YOUTUBE_API_KEY'
  // Shopping & Location
  | 'INSTACART_ENVIRONMENT'
  | 'GOOGLE_PLACES_API_KEY'
  // Internal/System
  | 'SUPABASE_URL'
  | 'SUPABASE_ANON_KEY'
  | 'SUPABASE_SERVICE_ROLE_KEY'
  | 'SUPABASE_DB_URL'
  | 'INVITE_JWT_SECRET';

// ============================================================================
// CORE SECRET ACCESS FUNCTIONS
// ============================================================================

/**
 * Get a required secret from environment variables
 * Throws an error if the secret is not found
 * 
 * @param name - The secret name
 * @returns The secret value
 * @throws Error if secret is missing
 */
export function getSecret(name: SecretName): string {
  const value = Deno.env.get(name);
  
  if (!value) {
    throw new Error(
      `Missing required secret: ${name}\n` +
      `Please ensure this secret is configured in Supabase.`
    );
  }
  
  return value;
}

/**
 * Get an optional secret from environment variables
 * Returns undefined if the secret is not found (no error)
 * 
 * @param name - The secret name
 * @returns The secret value or undefined
 */
export function getOptionalSecret(name: SecretName): string | undefined {
  return Deno.env.get(name);
}

/**
 * Check if a secret exists without throwing an error
 * 
 * @param name - The secret name
 * @returns True if the secret exists
 */
export function hasSecret(name: SecretName): boolean {
  return Deno.env.get(name) !== undefined;
}

// ============================================================================
// BULK VALIDATION
// ============================================================================

/**
 * Validate that all required secrets exist
 * Throws a single error listing all missing secrets
 * 
 * @param names - Array of secret names to validate
 * @throws Error if any secrets are missing
 */
export function validateRequiredSecrets(names: SecretName[]): void {
  const missing = names.filter(name => !Deno.env.get(name));
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required secrets (${missing.length}):\n` +
      missing.map(name => `  - ${name}`).join('\n') +
      `\n\nPlease ensure these secrets are configured in Supabase.`
    );
  }
}

/**
 * Get a report of which secrets are configured vs missing
 * Useful for debugging and health checks
 * 
 * @param names - Array of secret names to check
 * @returns Object with configured and missing secret lists
 */
export function getSecretStatus(names: SecretName[]): {
  configured: SecretName[];
  missing: SecretName[];
  total: number;
} {
  const configured: SecretName[] = [];
  const missing: SecretName[] = [];
  
  names.forEach(name => {
    if (Deno.env.get(name)) {
      configured.push(name);
    } else {
      missing.push(name);
    }
  });
  
  return {
    configured,
    missing,
    total: names.length,
  };
}

// ============================================================================
// PRE-CONFIGURED SECRET GROUPS
// ============================================================================

/**
 * Common groups of secrets used together by edge functions
 * Use these with validateRequiredSecrets() at function start
 */
export const SECRET_GROUPS = {
  /** Voice agent and conversation features */
  voice: [
    'ELEVENLABS_API_KEY',
    'ELEVENLABS_WEBHOOK_SECRET',
  ] as SecretName[],
  
  /** AI vision and generation features */
  vision: [
    'GOOGLE_GEMINI_API_KEY',
  ] as SecretName[],
  
  /** Nutrition data enrichment (primary + fallback) */
  nutrition: [
    'FATSECRET_CLIENT_ID',
    'FATSECRET_CLIENT_SECRET',
    'USDA_API_KEY',
    'GOOGLE_GEMINI_API_KEY', // For AI estimation fallback
  ] as SecretName[],
  
  /** Recipe video search */
  recipeVideos: [
    'YOUTUBE_API_KEY',
  ] as SecretName[],
  
  /** Shopping cart integration */
  shopping: [
    'INSTACART_ENVIRONMENT',
  ] as SecretName[],
  
  /** Location and store hours */
  location: [
    'GOOGLE_PLACES_API_KEY',
  ] as SecretName[],
  
  /** Image generation */
  imageGen: [
    'LOVABLE_API_KEY',
  ] as SecretName[],
  
  /** Supabase client essentials */
  supabase: [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ] as SecretName[],
  
  /** Supabase admin operations */
  supabaseAdmin: [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ] as SecretName[],
  
  /** Household invite system */
  invites: [
    'INVITE_JWT_SECRET',
  ] as SecretName[],
} as const;

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get all Supabase-related secrets at once
 * Commonly used at the start of most edge functions
 */
export function getSupabaseSecrets(): {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
} {
  return {
    url: getSecret('SUPABASE_URL'),
    anonKey: getSecret('SUPABASE_ANON_KEY'),
    serviceRoleKey: getOptionalSecret('SUPABASE_SERVICE_ROLE_KEY'),
  };
}

/**
 * Get FatSecret OAuth credentials
 */
export function getFatSecretCredentials(): {
  clientId: string;
  clientSecret: string;
} {
  return {
    clientId: getSecret('FATSECRET_CLIENT_ID'),
    clientSecret: getSecret('FATSECRET_CLIENT_SECRET'),
  };
}

/**
 * Get ElevenLabs credentials
 */
export function getElevenLabsCredentials(): {
  apiKey: string;
  webhookSecret: string;
} {
  return {
    apiKey: getSecret('ELEVENLABS_API_KEY'),
    webhookSecret: getSecret('ELEVENLABS_WEBHOOK_SECRET'),
  };
}
