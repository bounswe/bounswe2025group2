/**
 * useAuth Hooks Tests
 * Tests for authentication-related hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useUser, useIsAuthenticated, useLogin, useLogout } from '../useAuth';
import { mockUser } from '../../../test/mocks/handlers';
import AuthService from '../../auth/authService';

// Mock AuthService
vi.mock('../../auth/authService', () => ({
  default: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  },
}));

describe('useAuth Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useUser', () => {
    it('fetches user data successfully', async () => {
      vi.mocked(AuthService.getCurrentUser).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUser);
      expect(AuthService.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('handles error when fetching user data fails', async () => {
      const error = new Error('Unauthorized');
      vi.mocked(AuthService.getCurrentUser).mockRejectedValue(error);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useIsAuthenticated', () => {
    it('returns true when user is authenticated', async () => {
      vi.mocked(AuthService.getCurrentUser).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useIsAuthenticated(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(result.current.user).toEqual(mockUser);
    });

    it('returns false when user is not authenticated', async () => {
      vi.mocked(AuthService.getCurrentUser).mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useIsAuthenticated(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });

      expect(result.current.user).toBeUndefined();
    });

    it('returns loading state while fetching', () => {
      vi.mocked(AuthService.getCurrentUser).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useIsAuthenticated(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('useLogin', () => {
    it('logs in successfully and invalidates queries', async () => {
      const credentials = { username: 'testuser', password: 'password123' };
      vi.mocked(AuthService.login).mockResolvedValue({ message: 'Login successful' });

      const { result } = renderHook(() => useLogin(), { wrapper });

      result.current.mutate(credentials);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(AuthService.login).toHaveBeenCalledWith(credentials);
    });

    it('handles login error', async () => {
      const credentials = { username: 'testuser', password: 'wrongpassword' };
      const error = new Error('Invalid credentials');
      vi.mocked(AuthService.login).mockRejectedValue(error);

      const { result } = renderHook(() => useLogin(), { wrapper });

      result.current.mutate(credentials);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useLogout', () => {
    it('logs out successfully and clears cache', async () => {
      vi.mocked(AuthService.logout).mockResolvedValue({ message: 'Logout successful' });

      const { result } = renderHook(() => useLogout(), { wrapper });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(AuthService.logout).toHaveBeenCalledTimes(1);
    });

    it('clears cache even when logout fails', async () => {
      const error = new Error('Logout failed');
      vi.mocked(AuthService.logout).mockRejectedValue(error);

      const { result } = renderHook(() => useLogout(), { wrapper });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Cache should still be cleared
      expect(AuthService.logout).toHaveBeenCalledTimes(1);
    });
  });
});

