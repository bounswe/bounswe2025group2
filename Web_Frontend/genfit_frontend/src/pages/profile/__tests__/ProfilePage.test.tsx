import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '../../../test/test-utils';
import ProfilePage from '../ProfilePage';
import GFapi from '../../../lib/api/GFapi';
import { useUser, useGoals, useIsAuthenticated, useLogout, useNotifications } from '../../../lib';

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

// 1. MOCK TANSTACK QUERY
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
  };
});

// 2. MOCK EXTERNAL DEPENDENCIES
vi.mock('../../../lib/api/GFapi', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

// 3. MOCK CUSTOM HOOKS
vi.mock('../../../lib', () => ({
  useUser: vi.fn(),
  useGoals: vi.fn(),
  useIsAuthenticated: vi.fn(),
  useLogout: vi.fn(),
  useNotifications: vi.fn(),
  useCreateChat: vi.fn(),
}));

// 4. MOCK REACT ROUTER
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ username: undefined }),
    useLocation: () => ({ pathname: '/profile' }),
  };
});

describe('ProfilePage', () => {
  const mockProfileData = {
    username: 'testuser',
    name: 'John',
    surname: 'Doe',
    bio: 'Loves coding and running',
    location: 'New York',
    birth_date: '1990-01-01',
    age: 30,
    preferred_sports: 'Running',
    relationships: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock for useQuery
    vi.mocked(useQuery).mockImplementation((options: any) => {
      const queryKey = options?.queryKey || options;
      const keyString = JSON.stringify(queryKey);

      // If fetching relationships, return an Array
      if (keyString && (keyString.includes('relationship') || keyString.includes('mentors') || keyString.includes('mentees'))) {
        return {
          data: [],
          isLoading: false,
          isSuccess: true,
          isError: false,
          isPending: false,
          refetch: vi.fn(),
        } as unknown as UseQueryResult<any, Error>;
      }

      // Default: Return the Profile Object
      return {
        data: mockProfileData,
        isLoading: false,
        isSuccess: true,
        isError: false,
        isPending: false,
        refetch: vi.fn(),
      } as unknown as UseQueryResult<any, Error>;
    });

    // Mock custom hooks required by ProfilePage, Header, and SideNavigation
    vi.mocked(useUser).mockReturnValue({
      data: { id: 1, username: 'testuser' },
      isLoading: false,
    } as any);

    vi.mocked(useIsAuthenticated).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, username: 'testuser' },
      isLoading: false,
    } as any);

    vi.mocked(useLogout).mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
      isSuccess: true,
      isError: false,
    } as any);

    vi.mocked(useNotifications).mockReturnValue({
      data: [],
      isLoading: false,
      isSuccess: true,
      isError: false,
    } as any);

    vi.mocked(useGoals).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    vi.mocked(GFapi.get).mockResolvedValue({});
  });

  it('renders user information correctly', async () => {
    renderWithProviders(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('@testuser')).toBeInTheDocument();
    expect(screen.getByText('Loves coding and running')).toBeInTheDocument();
    expect(screen.getByText('New York')).toBeInTheDocument();
  });

  it('switches to edit mode when Edit Profile is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /edit profile/i }));

    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    const surnameInput = screen.getByRole('textbox', { name: 'Surname' });
    const bioInput = screen.getByRole('textbox', { name: /bio/i });

    // Check if the page is now in edit mode by looking for form elements
    expect(nameInput).toBeInTheDocument();
    expect(surnameInput).toBeInTheDocument();
    expect(bioInput).toBeInTheDocument();

    // Check if form fields are pre-filled with mock data
    expect(nameInput).toHaveValue('John');
  });

  it('cancels edit mode and reverts to view mode', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
    });

    // Enter edit mode
    await user.click(screen.getByRole('button', { name: /edit profile/i }));

    // Verify Save Changes button appears
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    // Click Cancel
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    // Verify we are back to view mode (Edit button visible, Save Changes gone)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
    });
  });

  it('renders empty state when user has no goals', async () => {
    // Usage of default mock (empty goals array) from beforeEach
    renderWithProviders(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('No Goals Set')).toBeInTheDocument();
    });
    expect(screen.getByText("You haven't set any fitness goals yet.")).toBeInTheDocument();
  });

  it('renders goals list when goals data is present', async () => {
    // Override the useGoals mock specifically for this test
    vi.mocked(useGoals).mockReturnValue({
      data: [
        {
          id: 99,
          title: 'Run 5k',
          description: 'Morning jog',
          status: 'IN_PROGRESS',
          current_value: 2,
          target_value: 5,
          unit: 'km',
          start_date: '2023-01-01',
          target_date: '2023-12-31'
        }
      ],
      isLoading: false,
    } as any);

    renderWithProviders(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Run 5k')).toBeInTheDocument();
    });

    // Check for progress text rendering
    expect(screen.getByText(/2 \/ 5 km/i)).toBeInTheDocument();
  });
});
