import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import ForumDetail from '../ForumDetail';

// Mocks
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  useRoute: () => ({ params: { forumId: 42 } }),
}));

jest.mock('react-native-paper', () => {
  const actual = jest.requireActual('react-native-paper');
  return {
    ...actual,
    useTheme: () => ({ colors: { background: '#fff', primary: '#6200ee', error: '#b00020' } }),
  };
});

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ getAuthHeader: () => ({ Authorization: 'Bearer token' }) }),
}));

jest.mock('../../constants/api', () => ({
  API_URL: 'https://example.com/api/',
}));

jest.mock('@react-native-cookies/cookies', () => ({
  get: jest.fn(async () => ({ csrftoken: { value: 'csrf-token' } })),
}));

declare const global: any;

describe('ForumDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('renders loading then threads list', async () => {
    const threads = [
      { id: 1, title: 'First', author: 'alice', comment_count: 3, last_activity: new Date().toISOString() },
      { id: 2, title: 'Second', author: 'bob', comment_count: 0, last_activity: new Date().toISOString() },
    ];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => threads,
    });

    render(<ForumDetail />);

    expect(screen.getByRole('progressbar')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText('Threads')).toBeTruthy();
    });

    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();

    // FAB visible when threads exist
    expect(screen.getByA11yLabel('plus')).toBeTruthy();

    // Ensure the fetch call included headers and credentials
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api/forums/42/threads/',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: 'Bearer token',
        }),
      })
    );
  });

  it('shows error and allows retry', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, statusText: 'Server error' });

    render(<ForumDetail />);
    await waitFor(() => screen.getByText('Server error'));

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] });
    fireEvent.press(screen.getByText('Retry'));

    await waitFor(() => screen.getByText('No threads found.'));
  });

  it('empty state shows create button and hides FAB', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] });
    render(<ForumDetail />);
    await waitFor(() => screen.getByText('No threads found.'));

    expect(screen.queryByA11yLabel('plus')).toBeNull();
    expect(screen.getByText('Create First Thread')).toBeTruthy();
  });

  it('opens dialog, validates, and creates thread successfully', async () => {
    // Initial load with no threads
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] });
    render(<ForumDetail />);
    await waitFor(() => screen.getByText('Create First Thread'));

    fireEvent.press(screen.getByText('Create First Thread'));
    await waitFor(() => screen.getByText('Create New Thread'));

    const titleInput = screen.getByLabelText('Thread Title');
    const contentInput = screen.getByLabelText('Thread Content');

    // Invalid first
    fireEvent.changeText(titleInput, 'a');
    fireEvent.changeText(contentInput, 'short');
    fireEvent.press(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('Title must be at least 3 characters long')).toBeTruthy();
      expect(screen.getByText('Content must be at least 10 characters long')).toBeTruthy();
    });

    // Fill valid data
    fireEvent.changeText(titleInput, 'New valid thread');
    fireEvent.changeText(contentInput, 'This is a sufficiently long content.');

    // Mock POST create
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 100, title: 'New valid thread' }),
    });

    // Follow-up reload of threads
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [{ id: 100, title: 'New valid thread', author: 'me', comment_count: 0, last_activity: new Date().toISOString() }] });

    fireEvent.press(screen.getByText('Create'));

    await waitFor(() => screen.getByText('Threads'));
    expect(screen.getByText('Thread created successfully!')).toBeTruthy();

    // Ensure POST was made with headers including CSRF and Referer
    const postCall = (global.fetch as jest.Mock).mock.calls.find((c: any[]) => String(c[0]).endsWith('/threads/'));
    expect(postCall).toBeTruthy();
    expect(postCall[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: 'Bearer token',
          Referer: 'https://example.com',
          'X-CSRFToken': 'csrf-token',
        }),
        body: expect.stringContaining('"forum":42'),
      })
    );
  });
});
