/**
 * Utility Functions for GenFit Frontend
 */

/**
 * Combine class names utility (useful for conditional styling)
 * Note: Install clsx package if you plan to use this function
 */
export function cn(...inputs: string[]): string {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Format error messages from API responses
 */
export function formatApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'An unexpected error occurred';
}

/**
 * Sleep function for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get environment variable with fallback
 */
export function getEnvVar(key: string, fallback?: string): string {
  return import.meta.env[key] || fallback || '';
}
