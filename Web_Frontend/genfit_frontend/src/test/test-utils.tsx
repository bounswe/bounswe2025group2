/* eslint-disable react-refresh/only-export-components */
/**
 * Test Utilities
 * Custom render functions and utilities for testing React components
 */

import { type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Create a new QueryClient for each test to ensure isolation
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry failed queries in tests
        gcTime: Infinity, // Don't garbage collect during tests
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllTheProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

/**
 * Wrapper component that provides all necessary context providers
 */
function AllTheProviders({ children, queryClient }: AllTheProvidersProps) {
  const client = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient }
) {
  const { queryClient, ...renderOptions } = options || {};

  return {
    ...render(ui, {
      wrapper: ({ children }) => (
        <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
      ),
      ...renderOptions,
    }),
    queryClient: queryClient || createTestQueryClient(),
  };
}

/**
 * Helper to create a properly typed UseQueryResult mock
 */
export function createMockQueryResult<TData>(
  overrides: Partial<{
    data: TData;
    error: Error | null;
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    status: 'pending' | 'error' | 'success';
    refetch: () => void;
  }> = {}
) {
  const defaults = {
    data: overrides.data,
    error: overrides.error ?? null,
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    isSuccess: overrides.isSuccess ?? true,
    isFetching: false,
    isPending: false,
    isLoadingError: false,
    isRefetchError: false,
    isStale: false,
    status: overrides.status ?? ('success' as const),
    fetchStatus: 'idle' as const,
    refetch: overrides.refetch ?? (() => Promise.resolve({} as any)),
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetched: true,
    isFetchedAfterMount: true,
    isPlaceholderData: false,
    isRefetching: false,
    isInitialLoading: overrides.isLoading ?? false,
    isPaused: false,
    isEnabled: true,
    promise: Promise.resolve({} as any),
  };

  // Cast to any to avoid strict type checking issues in tests
  return defaults as any;
}

/**
 * Re-export everything from React Testing Library
 */
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

