/**
 * React Query Configuration for GenFit Frontend
 * Provides caching, synchronization, and state management for server state
 */

import { QueryClient, type QueryFunction } from '@tanstack/react-query';
import GFapi from '../api/GFapi';
import { formatApiError } from '../utils';

/**
 * Default query function that uses GFapi
 */
const defaultQueryFn: QueryFunction = async ({ queryKey, signal }) => {
  const [url, params] = queryKey as [string, Record<string, string | number | boolean>?];
  
  try {
    // Create AbortController from React Query's signal
    if (signal?.aborted) {
      throw new Error('Query was cancelled');
    }

    return await GFapi.get(url, params);
  } catch (error) {
    // Format error for better UX
    const formattedError = new Error(formatApiError(error));
    
    // Preserve original error properties
    if (error instanceof Error && 'status' in error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (formattedError as any).status = (error as any).status;
    }
    
    throw formattedError;
  }
};

/**
 * Create and configure React Query client
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error && 'status' in error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Disable refetch on window focus by default
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false, // Don't retry mutations by default
      onError: (error) => {
        // Global error handling for mutations
        console.error('Mutation error:', formatApiError(error));
      },
    },
  },
});

/**
 * Simple query key helper
 * Creates consistent query keys from endpoints
 */
export const createQueryKey = (endpoint: string, params?: Record<string, string | number | boolean>) => {
  return params ? [endpoint, params] as const : [endpoint] as const;
};

/**
 * Utility function to invalidate queries by pattern
 */
export const invalidateQueries = (pattern: string[]) => {
  return queryClient.invalidateQueries({ queryKey: pattern });
};

/**
 * Utility function to prefetch data
 */
export const prefetchQuery = <T>(
  queryKey: readonly unknown[],
  queryFn?: QueryFunction<T>
) => {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn: queryFn || defaultQueryFn,
  });
};

export default queryClient;
