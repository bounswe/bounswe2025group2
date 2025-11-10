/**
 * Authentication Hooks for GenFit Frontend
 * React hooks for managing authentication state and operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AuthService from '../auth/authService';
import { createQueryKey } from '../query/queryClient';
import GFapi from '../api/GFapi';
import type { LoginCredentials, RegisterData, LoginStats } from '../types/api';

/**
 * Hook to get current user data
 */
export function useUser() {
  return useQuery({
    queryKey: createQueryKey('/api/user/'),
    queryFn: () => AuthService.getCurrentUser(),
    retry: false, // Don't retry on auth failures
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
  const { data: user, isLoading, error } = useUser();
  // If we have user data and no error, user is authenticated
  const isAuthenticated = !!(user && !error);
  
  return {
    isAuthenticated,
    isLoading,
    user,
  };
}

/**
 * Hook for login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => AuthService.login(credentials),
    onSuccess: () => {
      // Login endpoint only returns success message, not user data
      // Invalidate user query to trigger refetch of user data
      queryClient.invalidateQueries({ queryKey: createQueryKey('/api/user/') });
      
      // Invalidate other queries that might depend on auth state
      queryClient.invalidateQueries({ queryKey: ['/api/'] });
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
}

/**
 * Hook for register mutation
 */
export function useRegister() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RegisterData) => AuthService.register(data),
    onSuccess: () => {
      // Registration endpoint returns success message, not user data
      // Invalidate user query to trigger refetch of user data
      queryClient.invalidateQueries({ queryKey: createQueryKey('/api/user/') });
      
      // Invalidate other queries that might depend on auth state
      queryClient.invalidateQueries({ queryKey: ['/api/'] });
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  });
}

/**
 * Hook for logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => AuthService.logout(),
    onSuccess: () => {
      // Clear user data from cache
      queryClient.setQueryData(createQueryKey('/api/user/'), null);
      
      // Clear all cached data on logout
      queryClient.clear();
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      
      // Even if logout fails on server, clear local cache
      queryClient.setQueryData(createQueryKey('/api/user/'), null);
      queryClient.clear();
    },
  });
}

/**
 * Hook to fetch profile picture for other users by username
 */
export function useOtherUserProfilePicture(username: string | undefined) {
  return useQuery<string | null>({
    queryKey: createQueryKey(`/api/profile/other/picture/${username}/`),
    queryFn: async () => {
      if (!username) return null;
      
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const endpoint = `/api/profile/other/picture/${username}/`;
      const response = await fetch(new URL(endpoint, base).toString(), {
        credentials: 'include',
      });
      
      if (!response.ok) {
        // If user doesn't have a profile picture, return null instead of throwing
        if (response.status === 404) return null;
        throw new Error('Failed to fetch profile picture');
      }
      
      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.startsWith('image/')) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
      
      // If response is JSON, it might contain an image URL
      const data = await response.json();
      return data.image || null;
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on failures (user might not have profile picture)
  });
}

/**
 * Hook to fetch login statistics for the current user
 */
export function useLoginStats() {
  return useQuery<LoginStats>({
    queryKey: createQueryKey('/api/user/login-stats/'),
    queryFn: () => GFapi.get<LoginStats>('/api/user/login-stats/'),
    staleTime: 1 * 60 * 1000, // 1 minute - refresh more frequently for accurate streak info
    retry: false,
  });
}

