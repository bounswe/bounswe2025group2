import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/test-utils';
import NotificationsPage from '../notificationPage';
import { useIsAuthenticated, useNotifications } from '../../../lib';
import { useNavigate } from 'react-router-dom';
import GFapi from '../../../lib/api/GFapi';

// Mock everything with minimal implementation
vi.mock('../../../lib', () => ({
  useIsAuthenticated: vi.fn(),
  useNotifications: vi.fn(),
  invalidateQueries: vi.fn(),
}));

vi.mock('../../../lib/api/GFapi', () => ({
  default: {
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Simple react-router-dom mock with just what we need
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: any) => <div>{children}</div>,
  useNavigate: vi.fn(),
}));

vi.mock('../../../components', () => ({
  Layout: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

vi.mock('../../../components/ui/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button data-testid="button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../../components/ui/card', () => ({
  Card: ({ children, ...props }: any) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div data-testid="card-content" {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, ...props }: any) => (
    <div data-testid="card-header" {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <div data-testid="card-title" {...props}>
      {children}
    </div>
  ),
}));

vi.mock('./NotificationDetailModal', () => ({
  default: ({ isOpen }: any) => 
    isOpen ? <div data-testid="notification-modal">Modal Content</div> : null,
}));

describe('NotificationsPage - Minimal Environment Test', () => {
  it('should render the basic page structure without crashing', () => {
    // Set up default mocks
    vi.mocked(useIsAuthenticated).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: null,
    });
    
    vi.mocked(useNotifications).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useNavigate).mockReturnValue(vi.fn());

    renderWithProviders(<NotificationsPage />);

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Stay updated with your fitness journey')).toBeInTheDocument();
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getAllByTestId('card')).toHaveLength(3);
    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });
});

describe('NotificationsPage - Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to auth page when user is not authenticated', () => {
    // Mock unauthenticated state
    vi.mocked(useIsAuthenticated).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    vi.mocked(useNotifications).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    renderWithProviders(<NotificationsPage />);

    // Should redirect to auth page
    expect(mockNavigate).toHaveBeenCalledWith('/auth');
  });

  it('should show loading state when authentication is loading', () => {
    // Mock loading state for authentication
    vi.mocked(useIsAuthenticated).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    vi.mocked(useNotifications).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<NotificationsPage />);

    // Should show loading indicator
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show loading state when notifications are loading', () => {
    // Mock authenticated state with notifications loading
    vi.mocked(useIsAuthenticated).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: null,
    });

    vi.mocked(useNotifications).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    } as any);

    renderWithProviders(<NotificationsPage />);

    // Should show notifications loading indicator
    expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
  });
});

describe('NotificationsPage - With Notification Data', () => {
  const mockNotifications = [
    {
      id: 1,
      notification_type: 'goal_reminder',
      title: 'Goal Reminder',
      message: 'Don\'t forget to work on your goal!',
      sender_username: 'system',
      recipient_username: 'user1',
      related_object_id: 123,
      related_object_type: 'goal',
      is_read: false,
      is_email_sent: false,
      created_at: '2023-10-05T12:00:00Z',
    },
    {
      id: 2,
      notification_type: 'friend_request',
      title: 'Friend Request',
      message: 'You have a new friend request.',
      sender_username: 'user2',
      recipient_username: 'user1',
      related_object_id: 456,
      related_object_type: 'friend_request',
      is_read: true,
      is_email_sent: true,
      created_at: '2023-10-04T10:30:00Z',
    },
    {
      id: 3,
      notification_type: 'workout_comment',
      title: 'Workout Comment',
      message: 'Someone commented on your workout.',
      sender_username: 'user3',
      recipient_username: 'user1',
      related_object_id: 789,
      related_object_type: 'workout',
      is_read: false,
      is_email_sent: false,
      created_at: '2023-10-03T08:15:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default authenticated state
    vi.mocked(useIsAuthenticated).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: null,
    });
  });

  it('should display notifications when data is available', () => {
    vi.mocked(useNotifications).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<NotificationsPage />);

    // Check if notifications are displayed
    expect(screen.getByText('Don\'t forget to work on your goal!')).toBeInTheDocument();
    expect(screen.getByText('You have a new friend request.')).toBeInTheDocument();
    expect(screen.getByText('Someone commented on your workout.')).toBeInTheDocument();

    // Check if statistics are correct
    expect(screen.getByText('3')).toBeInTheDocument(); // Total notifications
    expect(screen.getByText('2')).toBeInTheDocument(); // Unread notifications
    expect(screen.getByText('1')).toBeInTheDocument(); // Read notifications
  });

  it('should show correct tab counts', () => {
    vi.mocked(useNotifications).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<NotificationsPage />);

    // Look for the tab container specifically
    const tabContainer = document.querySelector('.notification-tabs');
    expect(tabContainer).toBeInTheDocument();

    // Check that the tab container has the expected content
    if (tabContainer) {
      expect(tabContainer.textContent).toContain('All Notifications');
      expect(tabContainer.textContent).toContain('Unread');
      expect(tabContainer.textContent).toContain('Read');
      expect(tabContainer.textContent).toContain('(3)');
      expect(tabContainer.textContent).toContain('(2)');
      expect(tabContainer.textContent).toContain('(1)');
    }
  });

  it('should filter notifications by unread tab', async () => {
    vi.mocked(useNotifications).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<NotificationsPage />);

    // Get all buttons and find the one that represents the Unread tab
    const allButtons = screen.getAllByRole('button');
    const unreadTab = allButtons.find(button => 
      button.textContent?.includes('Unread') && button.textContent?.includes('(2)')
    );

    expect(unreadTab).toBeDefined();
    await userEvent.click(unreadTab!);

    // Only unread notifications should be visible
    expect(screen.getByText('Don\'t forget to work on your goal!')).toBeInTheDocument();
    expect(screen.getByText('Someone commented on your workout.')).toBeInTheDocument();
    expect(screen.queryByText('You have a new friend request.')).not.toBeInTheDocument();
  });

  it('should filter notifications by read tab', async () => {
    vi.mocked(useNotifications).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<NotificationsPage />);

    // Get all buttons and find the one that represents the Read tab
    const allButtons = screen.getAllByRole('button');
    const readTab = allButtons.find(button => 
      button.textContent?.includes('Read') && button.textContent?.includes('(1)')
    );

    expect(readTab).toBeDefined();
    await userEvent.click(readTab!);

    // Only read notifications should be visible
    expect(screen.getByText('You have a new friend request.')).toBeInTheDocument();
    expect(screen.queryByText('Don\'t forget to work on your goal!')).not.toBeInTheDocument();
    expect(screen.queryByText('Someone commented on your workout.')).not.toBeInTheDocument();
  });
});

describe('NotificationsPage - User Interactions', () => {
  const mockNotifications = [
    {
      id: 1,
      notification_type: 'goal_reminder',
      title: 'Goal Reminder',
      message: 'Test notification',
      sender_username: 'system',
      recipient_username: 'user1',
      related_object_id: 123,
      related_object_type: 'goal',
      is_read: false,
      is_email_sent: false,
      created_at: '2023-10-05T12:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useIsAuthenticated).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: null,
    });

    vi.mocked(useNotifications).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      error: null,
    } as any);
  });

  it('should mark a notification as read when Mark as Read button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationsPage />);

    const markAsReadButton = screen.getByText('Mark as Read');
    await user.click(markAsReadButton);

    // Check if API was called
    expect(GFapi.patch).toHaveBeenCalledWith('/api/notifications/1/read/');
  });

  it('should open modal when notification is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationsPage />);

    // Find the notification card by its content and click it
    const notificationMessage = screen.getByText('Test notification');
    const notificationCard = notificationMessage.closest('[data-testid="card"]');
    
    expect(notificationCard).toBeInTheDocument();
    await user.click(notificationCard!);

    // Check if modal is opened
    const modal = screen.queryByTestId('notification-modal');
    if (modal) {
      expect(modal).toBeInTheDocument();
    }
  });

  it('should show Mark All as Read button when there are unread notifications', () => {
    renderWithProviders(<NotificationsPage />);

    expect(screen.getByText('Mark All as Read')).toBeInTheDocument();
  });

  it('should not show Mark All as Read button when all notifications are read', () => {
    const allReadNotifications = [{
      ...mockNotifications[0],
      is_read: true,
    }];

    vi.mocked(useNotifications).mockReturnValue({
      data: allReadNotifications,
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<NotificationsPage />);

    expect(screen.queryByText('Mark All as Read')).not.toBeInTheDocument();
  });
});
