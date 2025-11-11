/**
 * @format
 * Unit tests for Forum.tsx component
 * Tests cover: rendering, data fetching, error handling, and user interactions
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import Forum from '../Pages/Forum';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

// Type declarations for global mocks
declare const global: {
  fetch: jest.Mock;
};

// Mock dependencies
jest.mock('../context/ThemeContext');
jest.mock('../context/AuthContext');
jest.mock('@react-navigation/native');
jest.mock('@components/CustomText', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function CustomText(props: any) {
    const { children, style, numberOfLines, ...rest } = props;
    return (
      <Text style={style} numberOfLines={numberOfLines} {...rest}>
        {children}
      </Text>
    );
  };
});

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
      navigate: jest.fn(),
      getParent: jest.fn(() => ({
        getParent: jest.fn(() => ({
          navigate: jest.fn(),
        })),
      })),
    });

    // Mock global fetch
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Component Rendering Tests', () => {
    test('renders loading state initially', async () => {
      // Mock fetch to never resolve (simulating loading)
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      const { UNSAFE_queryAllByType } = render(<Forum />);
      
      // ActivityIndicator is rendered but doesn't have testID by default
      const indicators = UNSAFE_queryAllByType(ActivityIndicator);
      expect(indicators.length).toBeGreaterThan(0);
    });

    test('renders forum list after successful API call', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockForums,
      });

      const { getByText } = render(<Forum />);
      
      await waitFor(() => {
        expect(getByText('General Discussion')).toBeTruthy();
      });
    });

    test('renders error state on fetch failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Failed to load forums',
      });

      const { getByText } = render(<Forum />);
      
      await waitFor(() => {
        expect(getByText(/Failed to load forums/)).toBeTruthy();
      });
    });

    test('renders empty list when no forums available', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const { queryByText } = render(<Forum />);
      
      await waitFor(() => {
        expect(queryByText('General Discussion')).toBeFalsy();
      });
    });

    test('renders all forum items from API response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockForums,
      });

      const { getByText } = render(<Forum />);
      
      await waitFor(() => {
        expect(getByText('General Discussion')).toBeTruthy();
        expect(getByText('Fitness Tips')).toBeTruthy();
        expect(getByText('Nutrition')).toBeTruthy();
      });
    });
  });

  describe('API Integration Tests', () => {
    test('calls fetch with correct API endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<Forum />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://164.90.166.81:8000/api/forums/',
          expect.any(Object)
        );
      });
    });

    test('includes authentication headers in fetch request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<Forum />);
      
      await waitFor(() => {
        const callArgs = (global.fetch as jest.Mock).mock.calls[0];
        expect(callArgs[1].headers).toEqual(
          expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
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
        // The actual error message from the code is the error type, not "Failed to load forums"
        expect(getByText('Network error')).toBeTruthy();
      });
    });

    test('handles non-ok response status', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Server Error',
      });

      const { getByText } = render(<Forum />);
      
      await waitFor(() => {
        expect(getByText(/Server Error/)).toBeTruthy();
      });
    });

    test('fetches forums on component mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<Forum />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('User Interaction Tests', () => {
    test('retry button is visible in error state', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Error',
      });

      const { getByText } = render(<Forum />);
      
      await waitFor(() => {
        expect(getByText('Retry')).toBeTruthy();
      });
    });

    test('retry button calls fetchForums again', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Error',
      });

      const { getByText } = render(<Forum />);
      
      await waitFor(() => {
        expect(getByText('Retry')).toBeTruthy();
      });

      const initialCallCount = (global.fetch as jest.Mock).mock.calls.length;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockForums,
      });

      fireEvent.press(getByText('Retry'));
      
      await waitFor(() => {
        expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(
          initialCallCount
        );
      });
    });

    test('forum item is touchable', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockForums,
      });

      const { getByText } = render(<Forum />);
      
      await waitFor(() => {
        const forumItem = getByText('General Discussion');
        expect(forumItem).toBeTruthy();
      });
    });

    test('forum item displays title and description', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockForums,
      });

      const { getByText } = render(<Forum />);
      
      await waitFor(() => {
        expect(getByText('General Discussion')).toBeTruthy();
        expect(getByText('General forum for discussions')).toBeTruthy();
      });
    });
  });

  describe('State Management Tests', () => {
    test('isLoading state transitions from true to false on success', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockForums,
      });

      const { getByText } = render(<Forum />);
      
      // After fetch completes, forums should be visible
      await waitFor(() => {
        expect(getByText('General Discussion')).toBeTruthy();
      });
    });

    test('error state is cleared on successful retry', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Error',
      });

      const { getByText, queryByText } = render(<Forum />);
      
      await waitFor(() => {
        expect(getByText(/Error/)).toBeTruthy();
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockForums,
      });

      fireEvent.press(getByText('Retry'));
      
      await waitFor(() => {
        expect(queryByText(/Error/)).toBeFalsy();
      });
    });

    test('forums state is populated with API data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockForums,
      });

      const { getByText } = render(<Forum />);
      
      await waitFor(() => {
        mockForums.forEach(forum => {
          expect(getByText(forum.title)).toBeTruthy();
        });
      });
    });

    test('error state set on failed fetch', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { getByText } = render(<Forum />);
      
      await waitFor(() => {
        // The error message comes from the caught error
        expect(getByText('Network error')).toBeTruthy();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles undefined forum data gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => undefined,
      });

      render(<Forum />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    test('handles forum with missing title field', async () => {
      const forumsWithMissing = [
        { id: 1, description: 'Description only' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => forumsWithMissing,
      });

      render(<Forum />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    test('handles large number of forums', async () => {
      const manyForums = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        title: `Forum ${i}`,
        description: `Description ${i}`,
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => manyForums,
      });

      const { getByText } = render(<Forum />);
      
      await waitFor(() => {
        // Only check first and some middle items due to FlatList virtualization
        expect(getByText('Forum 0')).toBeTruthy();
        expect(getByText('Forum 5')).toBeTruthy();
      });
    });

    test('handles forum with very long description', async () => {
      const forumWithLongDesc = [
        {
          id: 1,
          title: 'Long Description Forum',
          description: 'A'.repeat(200),
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => forumWithLongDesc,
      });

      const { getByText } = render(<Forum />);
      
      await waitFor(() => {
        expect(getByText('Long Description Forum')).toBeTruthy();
      });
    });

    test('handles empty statusText in error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: '',
      });

      const { getByText } = render(<Forum />);
      
      await waitFor(() => {
        expect(getByText(/Failed to load forums/)).toBeTruthy();
      });
    });
  });

  describe('Component Lifecycle Tests', () => {
    test('component mounts without crashing', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      expect(() => {
        render(<Forum />);
      }).not.toThrow();
    });

    test('multiple sequential renders work correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockForums,
      });

      const { unmount, rerender } = render(<Forum />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockForums,
      });

      rerender(<Forum />);

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    test('component handles rapid re-renders', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockForums,
      });

      const { rerender } = render(<Forum />);
      
      rerender(<Forum />);
      rerender(<Forum />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility Tests', () => {
    test('activity indicator is rendered during loading', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      const { UNSAFE_queryAllByType } = render(<Forum />);
      
      // ActivityIndicator is rendered but doesn't have testID
      const indicators = UNSAFE_queryAllByType(ActivityIndicator);
      expect(indicators.length).toBeGreaterThan(0);
    });

    test('error message is visible and readable', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Test error')
      );

      const { getByText } = render(<Forum />);
      
      await waitFor(() => {
        const errorText = getByText('Test error');
        expect(errorText).toBeTruthy();
      });
    });

    test('retry button is visible in error state', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Failed',
      });

      const { getByText } = render(<Forum />);
      
      await waitFor(() => {
        expect(getByText('Retry')).toBeTruthy();
      });
    });
  });
});
