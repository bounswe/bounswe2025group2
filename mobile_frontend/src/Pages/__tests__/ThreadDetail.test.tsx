/**
 * @format
 * Unit tests for ThreadDetail.tsx component
 * Tests cover: rendering, data fetching, user interactions, and error handling
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native-paper';
import ThreadDetail from '../ThreadDetail';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import Cookies from '@react-native-cookies/cookies';

// Mock dependencies
jest.mock('../../context/AuthContext');
jest.mock('../../context/ThemeContext');
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));
jest.mock('react-native-toast-message');
jest.mock('@react-native-cookies/cookies');

// Type declarations for global mocks
declare const global: {
  fetch: jest.Mock;
};

// Mock global fetch
global.fetch = jest.fn();

describe('ThreadDetail Page - Unit Tests', () => {
  const mockThread = {
    id: 1,
    title: 'Getting Started with Fitness',
    content: 'This is a comprehensive guide to starting your fitness journey.',
    author: 'john_doe',
    author_profile_photo: 'https://example.com/john.jpg',
    created_at: '2025-11-20T10:30:00Z',
    like_count: 15,
    comment_count: 3,
    is_pinned: false,
    is_locked: false,
    user_has_liked: false,
    comments: [
      {
        id: 101,
        author_id: 2,
        author_username: 'jane_smith',
        author_profile_photo: 'https://example.com/jane.jpg',
        content: 'Great guide! Very helpful.',
        created_at: '2025-11-20T11:00:00Z',
        like_count: 5,
        subcomment_count: 1,
      },
    ],
  };

  const mockAuthHeader = { Authorization: 'Bearer test-token' };
  const mockColors = {
    background: '#fff',
    text: '#000',
    primary: '#007AFF',
  };

  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      getAuthHeader: jest.fn(() => mockAuthHeader),
    });

    (useTheme as jest.Mock).mockReturnValue({
      colors: mockColors,
    });

    (useNavigation as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
      addListener: jest.fn(() => jest.fn()),
    });

    (useRoute as jest.Mock).mockReturnValue({
      params: {
        threadId: 1,
      },
    });

    (Cookies.get as jest.Mock).mockResolvedValue({
      csrftoken: { value: 'test-csrf-token' },
    });
  });

  describe('Component Rendering Tests', () => {
    test('renders loading state initially', async () => {
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValue(fetchPromise);

      const { UNSAFE_getByType } = render(<ThreadDetail />);
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();

      resolveFetch!({
        ok: true,
        json: async () => mockThread,
      });

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    });

    test('renders thread details correctly after successful API call', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockThread,
      });

      const { getByText, UNSAFE_queryByType } = render(<ThreadDetail />);

      await waitFor(() => {
        expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
        expect(getByText('Getting Started with Fitness')).toBeTruthy();
        expect(getByText('This is a comprehensive guide to starting your fitness journey.')).toBeTruthy();
        expect(getByText('@john_doe')).toBeTruthy();
      });
    });

    test('renders comments section with comments', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockThread,
      });

      const { getByText } = render(<ThreadDetail />);

      await waitFor(() => {
        expect(getByText('Comments')).toBeTruthy();
        expect(getByText('Great guide! Very helpful.')).toBeTruthy();
        expect(getByText('@jane_smith')).toBeTruthy();
      });
    });

    test('renders error state on fetch failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Failed to load thread',
      });

      const { getByText } = render(<ThreadDetail />);

      await waitFor(() => {
        expect(getByText('Failed to load thread')).toBeTruthy();
      });
    });

    test('renders pinned badge when thread is pinned', async () => {
      const pinnedThread = { ...mockThread, is_pinned: true };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => pinnedThread,
      });

      const { getByText } = render(<ThreadDetail />);

      await waitFor(() => {
        expect(getByText('PINNED')).toBeTruthy();
      });
    });

    test('renders locked badge when thread is locked', async () => {
      const lockedThread = { ...mockThread, is_locked: true };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => lockedThread,
      });

      const { getByText } = render(<ThreadDetail />);

      await waitFor(() => {
        expect(getByText('LOCKED')).toBeTruthy();
      });
    });
  });

  describe('API Integration Tests', () => {
    test('calls fetch with correct API endpoints', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockThread,
      });

      render(<ThreadDetail />);

      await waitFor(() => {
        const calls = (global.fetch as jest.Mock).mock.calls;
        expect(calls.some(call => call[0].includes('/threads/1/'))).toBe(true);
        expect(calls.some(call => call[0].includes('/comments/thread/1/'))).toBe(true);
        expect(calls.some(call => call[0].includes('/forum/vote/thread/1/status/'))).toBe(true);
      });
    });

    test('includes authentication headers in fetch requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockThread,
      });

      render(<ThreadDetail />);

      await waitFor(() => {
        const calls = (global.fetch as jest.Mock).mock.calls;
        calls.forEach(call => {
          expect(call[1].headers).toEqual(
            expect.objectContaining({
              Authorization: 'Bearer test-token',
              'Content-Type': 'application/json',
            })
          );
        });
      });
    });

    test('handles network error gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { getByText } = render(<ThreadDetail />);

      await waitFor(() => {
        expect(getByText('Network error')).toBeTruthy();
      });
    });

    test('uses credentials include for authenticated requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockThread,
      });

      render(<ThreadDetail />);

      await waitFor(() => {
        const calls = (global.fetch as jest.Mock).mock.calls;
        calls.forEach(call => {
          expect(call[1]).toEqual(
            expect.objectContaining({
              credentials: 'include',
            })
          );
        });
      });
    });
  });

  describe('User Interaction Tests', () => {
    test('navigates to profile when thread author is pressed', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockThread,
      });

      const { getByText } = render(<ThreadDetail />);

      await waitFor(() => {
        expect(getByText('@john_doe')).toBeTruthy();
      });

      fireEvent.press(getByText('@john_doe'));
      expect(mockNavigate).toHaveBeenCalledWith('Profile', { username: 'john_doe' });
    });

    test('navigates to comment author profile when comment author is pressed', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockThread,
      });

      const { getByText } = render(<ThreadDetail />);

      await waitFor(() => {
        expect(getByText('@jane_smith')).toBeTruthy();
      });

      fireEvent.press(getByText('@jane_smith'));
      expect(mockNavigate).toHaveBeenCalledWith('Profile', { username: 'jane_smith' });
    });

    test('renders like button with correct initial count', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockThread,
      });

      const { getByText } = render(<ThreadDetail />);

      await waitFor(() => {
        expect(getByText('15 Likes')).toBeTruthy();
      });
    });
  });

  describe('Edge Cases and Data Handling', () => {
    test('handles thread with many comments', async () => {
      const manyComments = Array.from({ length: 5 }, (_, i) => ({
        id: i + 101,
        author_id: i + 2,
        author_username: `user_${i}`,
        author_profile_photo: undefined,
        content: `Comment ${i}`,
        created_at: '2025-11-20T11:00:00Z',
        like_count: i,
        subcomment_count: 0,
      }));

      const threadWithManyComments = { ...mockThread, comments: manyComments, comment_count: 5 };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => threadWithManyComments,
      });

      const { getByText } = render(<ThreadDetail />);

      await waitFor(() => {
        expect(getByText('Comment 0')).toBeTruthy();
        expect(getByText('5 comments')).toBeTruthy();
      });
    });
  });
});
