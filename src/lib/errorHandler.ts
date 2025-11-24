// Centralized error handling and logging utility

export type ErrorCategory = 
  | "network"
  | "auth"
  | "database"
  | "validation"
  | "voice"
  | "permissions"
  | "unknown";

export interface ErrorContext {
  userId?: string;
  route?: string;
  action?: string;
  component?: string;
  metadata?: Record<string, any>;
}

export interface CategorizedError {
  category: ErrorCategory;
  message: string;
  originalError: Error;
  context?: ErrorContext;
  timestamp: string;
  userMessage: string;
}

/**
 * Categorize an error based on its message and type
 */
export const categorizeError = (error: any): ErrorCategory => {
  const message = error?.message?.toLowerCase() || "";
  
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout") ||
    message.includes("cors")
  ) {
    return "network";
  }
  
  if (
    message.includes("auth") ||
    message.includes("unauthorized") ||
    message.includes("token") ||
    message.includes("session")
  ) {
    return "auth";
  }
  
  if (
    message.includes("database") ||
    message.includes("supabase") ||
    message.includes("query") ||
    message.includes("insert") ||
    message.includes("update")
  ) {
    return "database";
  }
  
  if (
    message.includes("validation") ||
    message.includes("invalid") ||
    message.includes("required")
  ) {
    return "validation";
  }
  
  if (
    message.includes("voice") ||
    message.includes("audio") ||
    message.includes("microphone") ||
    message.includes("elevenlabs")
  ) {
    return "voice";
  }
  
  if (
    message.includes("permission") ||
    message.includes("denied") ||
    message.includes("blocked")
  ) {
    return "permissions";
  }
  
  return "unknown";
};

/**
 * Get user-friendly error message based on category
 */
export const getUserFriendlyMessage = (category: ErrorCategory, originalMessage: string): string => {
  switch (category) {
    case "network":
      return "Unable to connect to the server. Please check your internet connection and try again.";
    case "auth":
      return "Authentication failed. Please log in again.";
    case "database":
      return "Unable to save your data. Please try again in a moment.";
    case "validation":
      return "Please check your input and try again.";
    case "voice":
      return "Voice connection failed. Please check your microphone permissions and try again.";
    case "permissions":
      return "Permission denied. Please enable the required permissions in your browser settings.";
    case "unknown":
    default:
      return originalMessage || "An unexpected error occurred. Please try again.";
  }
};

/**
 * Format and log error with context
 */
export const logError = (
  error: any,
  context?: ErrorContext
): CategorizedError => {
  const category = categorizeError(error);
  const timestamp = new Date().toISOString();
  const userMessage = getUserFriendlyMessage(category, error?.message);
  
  const categorizedError: CategorizedError = {
    category,
    message: error?.message || "Unknown error",
    originalError: error,
    context,
    timestamp,
    userMessage,
  };
  
  // Log to console with context
  console.error(`[${category.toUpperCase()}] Error at ${timestamp}:`, {
    message: error?.message,
    stack: error?.stack,
    context,
  });
  
  // TODO: In production, send to error tracking service (e.g., Sentry)
  // if (process.env.NODE_ENV === 'production') {
  //   sendToErrorTracking(categorizedError);
  // }
  
  return categorizedError;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  return (
    categorizeError(error) === "network" ||
    error?.name === "NetworkError" ||
    error?.name === "TypeError" ||
    !navigator.onLine
  );
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: any): boolean => {
  return (
    categorizeError(error) === "auth" ||
    error?.status === 401 ||
    error?.status === 403
  );
};

/**
 * Format error for display
 */
export const formatErrorMessage = (error: any, context?: ErrorContext): string => {
  const categorized = logError(error, context);
  return categorized.userMessage;
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`Retry attempt ${i + 1}/${maxRetries} failed:`, error);
      
      if (i < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = delayMs * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};
