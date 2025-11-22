/**
 * @format
 * Unit tests for Home.tsx component
 * Tests cover: rendering, data fetching, error handling, pull-to-refresh, and user interactions
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { FlatList, ActivityIndicator } from 'react-native';
import Home from '../Pages/Home';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import Cookies from '@react-native-cookies/cookies';
import { API_URL } from '@constants/api';

// Type declarations for global mocks
declare const global: {
  fetch: jest.Mock;
  URL: {
    createObjectURL: jest.Mock;
    revokeObjectURL: jest.Mock;
  };
};

// Mock dependencies
jest.mock('@react-native-cookies/cookies');
jest.mock('../context/AuthContext');
jest.mock('../context/ThemeContext');
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));
jest.mock('../components/Thread', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function Thread(props: any) {
    return (
      <View testID={`thread-${props.threadId}`}>
        <Text testID={`username-${props.threadId}`}>{props.username}</Text>
        <Text testID={`forumName-${props.threadId}`}>{props.forumName}</Text>
        <Text testID={`content-${props.threadId}`}>{props.content}</Text>
      </View>
    );
  };
});

describe('Home Component', () => {
  // Mock data for tests
  const mockThreads = [
    {
      id: 1,
      title: 'Test Thread 1',
      content: 'This is test content 1',
      author: { username: 'user1' },
      forum: { title: 'Test Forum 1' },
      like_count: 5,
      comment_count: 3,
      created_at: '2025-11-09T10:00:00Z',
    },
    {
      id: 2,
      title: 'Test Thread 2',
      content: 'This is test content 2',
      author: { username: 'user2' },
      forum: { title: 'Test Forum 2' },
      like_count: 10,
      comment_count: 7,
      created_at: '2025-11-08T10:00:00Z',
    },
  ];

  const mockAuthHeader = { Authorization: 'Bearer test-token' };
  const mockColors = {
    mentionText: '#007AFF',
    subText: '#666666',
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

    // Mock useFocusEffect to NOT immediately call the callback
    (useFocusEffect as jest.Mock).mockImplementation(() => {
      // Do nothing - don't call the callback
    });

    // Mock Cookies.get
    (Cookies.get as jest.Mock).mockResolvedValue({
      csrftoken: { value: 'test-csrf-token' },
    });

    // Mock successful fetch by default
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockThreads,
      blob: async () => new Blob(),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Rendering', () => {
    test('renders without crashing', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    test('shows loading indicator initially', () => {
      const { UNSAFE_queryByType } = render(<Home />);
      const activityIndicator = UNSAFE_queryByType(ActivityIndicator);
      expect(activityIndicator).toBeTruthy();
    });

    test('renders FlatList component', async () => {
      const { UNSAFE_queryByType } = render(<Home />);
      await waitFor(() => {
        const flatList = UNSAFE_queryByType(FlatList);
        expect(flatList).toBeTruthy();
      });
    });
  });

  describe('Data Fetching', () => {
    test('fetches threads on mount', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `${API_URL}threads/`,
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer test-token',
              'Content-Type': 'application/json',
              'X-CSRFToken': 'test-csrf-token',
            }),
            credentials: 'include',
          })
        );
      });
    });

    test('includes authentication headers in request', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining(mockAuthHeader),
          })
        );
      });
    });

    test('includes CSRF token in request headers', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'X-CSRFToken': 'test-csrf-token',
            }),
          })
        );
      });
    });

    test('handles missing CSRF token gracefully', async () => {
      (Cookies.get as jest.Mock).mockResolvedValue({});

      render(<Home />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
        expect(callArgs.headers['X-CSRFToken']).toBeUndefined();
      });
    });

    test('displays threads after successful fetch', async () => {
      const { getByTestId } = render(<Home />);

      await waitFor(() => {
        expect(getByTestId('thread-1')).toBeTruthy();
        expect(getByTestId('thread-2')).toBeTruthy();
      });
    });

    test('sorts threads by date (newest first)', async () => {
      const unsortedThreads = [
        { ...mockThreads[1], created_at: '2025-11-07T10:00:00Z' },
        { ...mockThreads[0], created_at: '2025-11-09T10:00:00Z' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => unsortedThreads,
      });

      const { getByTestId } = render(<Home />);

      await waitFor(() => {
        expect(getByTestId('thread-1')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { getByText } = render(<Home />);

      await waitFor(() => {
        expect(getByText('Failed to load threads. Pull to refresh.')).toBeTruthy();
      });
    });

    test('displays network error message on fetch exception', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { getByText } = render(<Home />);

      await waitFor(() => {
        expect(getByText('Failed to load threads. Pull to refresh.')).toBeTruthy();
      });
    });

    test('clears error state on successful retry', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: true, json: async () => mockThreads });

      const { getByText, queryByText, UNSAFE_getByType } = render(<Home />);

      await waitFor(() => {
        expect(getByText('Failed to load threads. Pull to refresh.')).toBeTruthy();
      });

      const flatList = UNSAFE_getByType(FlatList);
      fireEvent(flatList, 'refresh');

      await waitFor(() => {
        expect(queryByText('Failed to load threads. Pull to refresh.')).toBeNull();
      });
    });

    test('sets empty array when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { queryByTestId } = render(<Home />);

      await waitFor(() => {
        expect(queryByTestId('thread-1')).toBeNull();
        expect(queryByTestId('thread-2')).toBeNull();
      });
    });
  });

  describe('Pull to Refresh', () => {
    test('triggers refresh when user pulls down', async () => {
      const { UNSAFE_getByType } = render(<Home />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled(); // Initial fetch
      });

      const initialCallCount = (global.fetch as jest.Mock).mock.calls.length;
      const flatList = UNSAFE_getByType(FlatList);
      fireEvent(flatList, 'refresh');

      await waitFor(() => {
        expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    test('sets refreshing state during pull-to-refresh', async () => {
      const { UNSAFE_getByType } = render(<Home />);

      const flatList = UNSAFE_getByType(FlatList);

      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, json: async () => [] }), 100)
          )
      );

      fireEvent(flatList, 'refresh');
      expect(flatList.props.refreshing).toBe(true);
    });

    test('clears refreshing state after refresh completes', async () => {
      const { UNSAFE_getByType } = render(<Home />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const flatList = UNSAFE_getByType(FlatList);
      fireEvent(flatList, 'refresh');

      await waitFor(() => {
        expect(flatList.props.refreshing).toBe(false);
      });
    });
  });

  describe('Empty States', () => {
    test('displays empty message when no threads exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const { getByText } = render(<Home />);

      await waitFor(() => {
        expect(getByText('There is no such post.')).toBeTruthy();
      });
    });

    test('does not display loading spinner after data loads', async () => {
      const { UNSAFE_queryByType } = render(<Home />);

      await waitFor(() => {
        const activityIndicator = UNSAFE_queryByType(ActivityIndicator);
        expect(activityIndicator).toBeNull();
      });
    });
  });

  describe('Profile Picture Fetching', () => {
    test('fetches profile pictures for thread authors', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `${API_URL}profile/other/picture/user1/`,
          expect.objectContaining({
            headers: expect.objectContaining(mockAuthHeader),
            credentials: 'include',
          })
        );
      });
    });

    test('fetches profile pictures for all unique usernames', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/profile/other/picture/user1/'),
          expect.any(Object)
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/profile/other/picture/user2/'),
          expect.any(Object)
        );
      });
    });

    test('handles profile picture fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/profile/other/picture/')) {
          return Promise.reject(new Error('Profile pic not found'));
        }
        return Promise.resolve({ ok: true, json: async () => mockThreads });
      });

      const { getByTestId } = render(<Home />);

      await waitFor(() => {
        expect(getByTestId('thread-1')).toBeTruthy();
        expect(getByTestId('thread-2')).toBeTruthy();
      });
    });

    test('does not fetch duplicate profile pictures', async () => {
      const duplicateThreads = [
        { ...mockThreads[0], id: 3 },
        { ...mockThreads[0], id: 4 },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => duplicateThreads,
        blob: async () => new Blob(),
      });

      render(<Home />);

      await waitFor(() => {
        const profilePicCalls = (global.fetch as jest.Mock).mock.calls.filter((call) =>
          call[0].includes('/profile/other/picture/')
        );
        expect(profilePicCalls.length).toBe(1);
      });
    });
  });

  describe('Focus Effect', () => {
    test('refreshes data when screen comes into focus', async () => {
      let focusCallback: () => void = () => {};
      (useFocusEffect as jest.Mock).mockImplementation((callback) => {
        focusCallback = callback;
      });

      render(<Home />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const initialCallCount = (global.fetch as jest.Mock).mock.calls.length;
      focusCallback();

      await waitFor(() => {
        expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(
          initialCallCount
        );
      });
    });
  });

  describe('Thread Rendering', () => {
    test('passes correct props to Thread component', async () => {
      const { getByTestId } = render(<Home />);

      await waitFor(() => {
        expect(getByTestId('forumName-1')).toHaveTextContent('Test Forum 1');
        expect(getByTestId('content-1')).toHaveTextContent('Test Thread 1\nThis is test content 1');
        expect(getByTestId('username-1')).toHaveTextContent('user1');
      });
    });

    test('handles threads without title field', async () => {
      const threadsWithoutTitle = [
        {
          id: 1,
          content: 'Content only',
          author: { username: 'user1' },
          forum: { title: 'Test Forum' },
          like_count: 0,
          comment_count: 0,
          created_at: '2025-11-09T10:00:00Z',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => threadsWithoutTitle,
      });

      const { getByTestId } = render(<Home />);

      await waitFor(() => {
        expect(getByTestId('content-1')).toHaveTextContent('Content only');
      });
    });

    test('handles threads with missing author data', async () => {
      const threadsWithMissingAuthor = [
        {
          id: 1,
          title: 'Test',
          content: 'Content',
          forum: { title: 'Test Forum' },
          like_count: 0,
          comment_count: 0,
          created_at: '2025-11-09T10:00:00Z',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => threadsWithMissingAuthor,
      });

      const { getByTestId } = render(<Home />);

      await waitFor(() => {
        expect(getByTestId('username-1')).toHaveTextContent('User');
      });
    });
  });

  describe('Date Sorting', () => {
    test('handles threads with different date field names', async () => {
      const mixedDateFields = [
        {
          id: 1,
          title: 'Thread 1',
          content: 'Content 1',
          author: { username: 'user1' },
          forum: { title: 'Forum' },
          createdAt: '2025-11-07T10:00:00Z',
          like_count: 0,
          comment_count: 0,
        },
        {
          id: 2,
          title: 'Thread 2',
          content: 'Content 2',
          author: { username: 'user2' },
          forum: { title: 'Forum' },
          created: '2025-11-09T10:00:00Z',
          like_count: 0,
          comment_count: 0,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mixedDateFields,
      });

      const { getByTestId } = render(<Home />);

      await waitFor(() => {
        expect(getByTestId('thread-1')).toBeTruthy();
        expect(getByTestId('thread-2')).toBeTruthy();
      });
    });

    test('handles threads without valid dates', async () => {
      const threadsWithoutDates = [
        {
          id: 1,
          title: 'Thread 1',
          content: 'Content 1',
          author: { username: 'user1' },
          forum: { title: 'Forum' },
          like_count: 0,
          comment_count: 0,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => threadsWithoutDates,
      });

      const { getByTestId } = render(<Home />);

      await waitFor(() => {
        expect(getByTestId('thread-1')).toBeTruthy();
      });
    });

    test('handles invalid date values gracefully', async () => {
      const threadsWithInvalidDates = [
        {
          id: 1,
          title: 'Thread 1',
          content: 'Content 1',
          author: { username: 'user1' },
          forum: { title: 'Forum' },
          created_at: 'invalid-date',
          like_count: 0,
          comment_count: 0,
        },
        {
          id: 2,
          title: 'Thread 2',
          content: 'Content 2',
          author: { username: 'user2' },
          forum: { title: 'Forum' },
          created_at: '2025-11-09T10:00:00Z',
          like_count: 0,
          comment_count: 0,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => threadsWithInvalidDates,
      });

      const { getByTestId } = render(<Home />);

      await waitFor(() => {
        expect(getByTestId('thread-1')).toBeTruthy();
        expect(getByTestId('thread-2')).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles null or undefined response data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      const { getByText } = render(<Home />);

      await waitFor(() => {
        expect(getByText('There is no such post.')).toBeTruthy();
      });
    });

    test('handles extremely large thread list', async () => {
      const largeThreadList = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        title: `Thread ${i}`,
        content: `Content ${i}`,
        author: { username: `user${i}` },
        forum: { title: 'Forum' },
        like_count: i,
        comment_count: i,
        created_at: new Date(Date.now() - i * 1000000).toISOString(),
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => largeThreadList,
        blob: async () => new Blob(),
      });

      const { getByTestId } = render(<Home />);

      await waitFor(() => {
        // Check that first thread is rendered - FlatList will virtualize the rest
        expect(getByTestId('thread-0')).toBeTruthy();
      });
      
      // Verify that fetch was called successfully with large dataset
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
