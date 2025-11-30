/**
 * @format
 * Unit tests for Forum.tsx component
 * Tests cover: rendering, data fetching, error handling, and user interactions
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native-paper';
import Forum from '../Pages/Forum';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

// Mock dependencies
jest.mock('../context/ThemeContext');
jest.mock('../context/AuthContext');
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

// Type declarations for global mocks
declare const global: {
  fetch: jest.Mock;
};

// Mock global fetch
global.fetch = jest.fn();

describe('Forum Page - Unit Tests', () => {
  // Mock data for tests
  const mockForums = [
    { id: 1, title: 'General Discussion', description: 'General forum for discussions' },
    { id: 2, title: 'Fitness Tips', description: 'Share fitness tips and advice' },
    { id: 3, title: 'Nutrition', description: 'Nutrition and diet discussions' },
  ];

  const mockAuthHeader = { Authorization: 'Bearer test-token' };
  const mockColors = {
    background: '#fff',
    text: '#000',
    subText: '#666',
    active: '#007AFF',
    border: '#ddd',
  };

  const mockNavigate = jest.fn();

  // Setup mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAuth hook
    (useAuth as jest.Mock).mockReturnValue({
      getAuthHeader: jest.fn(() => mockAuthHeader),
    });

    // Mock useTheme hook
    (useTheme as jest.Mock).mockReturnValue({
      colors: mockColors,
    });

    // Mock useNavigation hook
    (useNavigation as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
      getParent: jest.fn(() => ({
        getParent: jest.fn(() => ({
          navigate: mockNavigate,
        })),
      })),
    });
  });

  describe('Component Rendering Tests', () => {
    test('renders loading state initially', async () => {
      // Mock a promise that doesn't resolve immediately to check loading state
      // But we must ensure it resolves eventually to avoid Jest warnings
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValue(fetchPromise);

      const { UNSAFE_getByType } = render(<Forum />);
      
      // Check for ActivityIndicator
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();

      // Resolve the promise to clean up
      resolveFetch!({
        ok: true,
        json: async () => [],
      });

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    });

    test('renders forum list correctly after successful API call', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockForums,
      });

      const { getByText, UNSAFE_queryByType } = render(<Forum />);
      
      await waitFor(() => {
        expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
        // Verify specific content is rendered
        expect(getByText('General Discussion')).toBeTruthy();
        expect(getByText('General forum for discussions')).toBeTruthy();
        expect(getByText('Fitness Tips')).toBeTruthy();
        expect(getByText('Nutrition')).toBeTruthy();
      });
    });

    test('renders error state on fetch failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Failed to load forums',
      });

      const { getByText } = render(<Forum />);
      
      await waitFor(() => {
        expect(getByText('Failed to load forums')).toBeTruthy();
        expect(getByText('Retry')).toBeTruthy();
      });
    });

    test('renders empty list when no forums available', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const { queryByText } = render(<Forum />);
      
      await waitFor(() => {
        expect(queryByText('General Discussion')).toBeNull();
      });
    });
  });

  describe('API Integration Tests', () => {
    test('calls fetch with correct API endpoint and headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<Forum />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('forums/'),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token',
            }),
          })
        );
      });
    });

    test('handles network error gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { getByText } = render(<Forum />);
      
      await waitFor(() => {
        expect(getByText('Network error')).toBeTruthy();
      });
    });
  });

  describe('User Interaction Tests', () => {
    test('retry button calls fetchForums again', async () => {
      // First call fails
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('First Error'));

      const { getByText } = render(<Forum />);
      
      await waitFor(() => {
        expect(getByText('First Error')).toBeTruthy();
      });

      // Second call succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockForums,
      });

      fireEvent.press(getByText('Retry'));
      
      await waitFor(() => {
        expect(getByText('General Discussion')).toBeTruthy();
      });
      
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    test('navigates to ForumDetail on item press', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockForums,
      });

      const { getByText } = render(<Forum />);
      
      await waitFor(() => {
        expect(getByText('General Discussion')).toBeTruthy();
      });

      fireEvent.press(getByText('General Discussion'));

      expect(mockNavigate).toHaveBeenCalledWith('ForumDetail', { forumId: 1 });
    });
  });

  describe('Edge Cases', () => {
    test('handles malformed data gracefully (missing fields)', async () => {
        // Even if TS says it's Forum[], runtime might differ. 
        // However, the component assumes fields exist. 
        // If we pass partial data, we want to see if it renders what it can or crashes.
        const malformedForums = [
            { id: 1, title: 'Partial Forum' } // missing description
        ];

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => malformedForums,
        });

        const { getByText } = render(<Forum />);

        await waitFor(() => {
            expect(getByText('Partial Forum')).toBeTruthy();
        });
    });

    test('handles extremely long text content', async () => {
        const longTitle = 'A'.repeat(100);
        const longDesc = 'B'.repeat(500);
        
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => [{ id: 1, title: longTitle, description: longDesc }],
        });

        const { getByText } = render(<Forum />);

        await waitFor(() => {
            expect(getByText(longTitle)).toBeTruthy();
        });
    });
  });
});
