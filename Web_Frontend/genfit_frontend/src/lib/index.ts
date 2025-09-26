/**
 * Main Library Exports for GenFit Frontend
 * Central export point for all utilities, services, and hooks
 */

// API Client
export { default as GFapi, GFApiClient } from './api/GFapi';

// Types
export type * from './types/api';

// Utilities
export * from './utils';

// Authentication
export { default as AuthService } from './auth/authService';

// React Query
export { queryClient, createQueryKey, invalidateQueries, prefetchQuery } from './query/queryClient';

// Hooks
export * from './hooks/useAuth';
export * from './hooks/useData';
