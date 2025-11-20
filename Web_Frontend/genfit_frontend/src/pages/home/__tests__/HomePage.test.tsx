/**
 * HomePage Component Tests
 * Tests for the main HomePage component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent, createMockQueryResult } from '../../../test/test-utils';
import HomePage from '../HomePage';
import {
  mockUser,
  mockGoals,
  mockChallenges,
  mockLoginStats,
  mockDailyQuote,
  mockFoodItems,
} from '../../../test/mocks/handlers';
import * as libHooks from '../../../lib';
import { GFapi } from '../../../lib/api/GFapi';

// Mock all the custom hooks
vi.mock('../../../lib', async () => {
  const actual = await vi.importActual('../../../lib');
  return {
    ...actual,
    useIsAuthenticated: vi.fn(),
    useGoals: vi.fn(),
    useChallenges: vi.fn(),
    useUserStats: vi.fn(),
    useDailyQuote: vi.fn(),
    useUserChallenges: vi.fn(),
    useLoginStats: vi.fn(),
  };
});

// Mock Layout and other components
vi.mock('../../../components', () => ({
  Layout: ({ children, onSearch }: { children: React.ReactNode; onSearch: (value: string) => void }) => (
    <div data-testid="layout">
      <input
        data-testid="search-input"
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search"
      />
      {children}
    </div>
  ),
  ActivityDashboard: ({ activeGoals, joinedChallenges }: { activeGoals: number; joinedChallenges: number }) => (
    <div data-testid="activity-dashboard">
      <div>Active Goals: {activeGoals}</div>
      <div>Joined Challenges: {joinedChallenges}</div>
    </div>
  ),
  DailyAdvice: () => <div data-testid="daily-advice">Daily Advice Component</div>,
}));

// Mock GFapi
vi.mock('../../../lib/api/GFapi', () => ({
  GFapi: {
    post: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(libHooks.useIsAuthenticated).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: mockUser,
    });

    vi.mocked(libHooks.useGoals).mockReturnValue(
      createMockQueryResult({
        data: mockGoals,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
    );

    vi.mocked(libHooks.useChallenges).mockReturnValue(
      createMockQueryResult({
        data: mockChallenges,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
    );

    vi.mocked(libHooks.useUserStats).mockReturnValue({
      activeGoals: 2,
      completedChallenges: 5,
    });

    vi.mocked(libHooks.useDailyQuote).mockReturnValue(
      createMockQueryResult({
        data: mockDailyQuote,
        error: null,
        isLoading: false,
        refetch: vi.fn(),
      })
    );

    vi.mocked(libHooks.useUserChallenges).mockReturnValue(
      createMockQueryResult({
        data: [mockChallenges[0]],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
    );

    vi.mocked(libHooks.useLoginStats).mockReturnValue(
      createMockQueryResult({
        data: mockLoginStats,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
    );
  });

  it('shows loading state while checking authentication', () => {
    vi.mocked(libHooks.useIsAuthenticated).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    renderWithProviders(<HomePage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects to auth page when not authenticated', () => {
    vi.mocked(libHooks.useIsAuthenticated).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    renderWithProviders(<HomePage />);
    expect(mockNavigate).toHaveBeenCalledWith('/auth');
  });

  it('shows loading state while fetching data', () => {
    vi.mocked(libHooks.useGoals).mockReturnValue(
      createMockQueryResult({
        data: undefined,
        isLoading: true,
        error: null,
        isSuccess: false,
        status: 'pending',
        refetch: vi.fn(),
      })
    );

    renderWithProviders(<HomePage />);
    expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument();
  });

  it('shows error state when data fetching fails', async () => {
    vi.mocked(libHooks.useGoals).mockReturnValue(
      createMockQueryResult({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
        isError: true,
        isSuccess: false,
        status: 'error',
        refetch: vi.fn(),
      })
    );

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load dashboard')).toBeInTheDocument();
      expect(
        screen.getByText('Please try refreshing the page or check your connection.')
      ).toBeInTheDocument();
    });
  });

  it('renders all main sections when data is loaded', async () => {
    renderWithProviders(<HomePage />);

    await waitFor(() => {
      // Daily quote section
      expect(screen.getByText(`"${mockDailyQuote.text}"`)).toBeInTheDocument();
      expect(screen.getByText(`— ${mockDailyQuote.author}`)).toBeInTheDocument();

      // Activity dashboard
      expect(screen.getByTestId('activity-dashboard')).toBeInTheDocument();
      expect(screen.getByText('Active Goals: 2')).toBeInTheDocument();

      // Daily advice
      expect(screen.getByTestId('daily-advice')).toBeInTheDocument();

      // Nutrition analyzer
      expect(screen.getByText('Nutrition Analyzer')).toBeInTheDocument();
    });
  });

  it('handles nutrition analyzer form submission', async () => {
    const user = userEvent.setup();
    vi.mocked(GFapi.post).mockResolvedValue({ foods: mockFoodItems });

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. 2 eggs and a banana')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('e.g. 2 eggs and a banana');
    const analyzeButton = screen.getByRole('button', { name: 'Analyze' });

    // Type in the input
    await user.type(input, '2 eggs and a banana');
    expect(input).toHaveValue('2 eggs and a banana');

    // Click analyze button
    await user.click(analyzeButton);

    await waitFor(() => {
      expect(GFapi.post).toHaveBeenCalledWith('/api/parse_food/', {
        query: '2 eggs and a banana',
      });
    });

    // Check if food results are displayed
    await waitFor(() => {
      expect(screen.getByText('Egg, whole, raw')).toBeInTheDocument();
      expect(screen.getByText('Banana, raw')).toBeInTheDocument();
    });
  });

  it('shows analyzing state during food analysis', async () => {
    const user = userEvent.setup();
    vi.mocked(GFapi.post).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ foods: mockFoodItems }), 1000))
    );

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. 2 eggs and a banana')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('e.g. 2 eggs and a banana');
    const analyzeButton = screen.getByRole('button', { name: 'Analyze' });

    await user.type(input, 'apple');
    await user.click(analyzeButton);

    // Should show analyzing state
    await waitFor(() => {
      expect(screen.getByText('Analyzing...')).toBeInTheDocument();
    });
  });

  it('handles nutrition analyzer error', async () => {
    const user = userEvent.setup();
    vi.mocked(GFapi.post).mockRejectedValue(new Error('API Error'));

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. 2 eggs and a banana')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('e.g. 2 eggs and a banana');
    const analyzeButton = screen.getByRole('button', { name: 'Analyze' });

    await user.type(input, 'invalid food');
    await user.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to analyze food. Please try again.')).toBeInTheDocument();
    });
  });

  it('disables analyze button when input is empty', async () => {
    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. 2 eggs and a banana')).toBeInTheDocument();
    });

    const analyzeButton = screen.getByRole('button', { name: 'Analyze' });
    expect(analyzeButton).toBeDisabled();
  });

  it('displays nutritional information correctly', async () => {
    const user = userEvent.setup();
    vi.mocked(GFapi.post).mockResolvedValue({ foods: mockFoodItems });

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. 2 eggs and a banana')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('e.g. 2 eggs and a banana');
    const analyzeButton = screen.getByRole('button', { name: 'Analyze' });

    await user.type(input, '2 eggs and a banana');
    await user.click(analyzeButton);

    await waitFor(() => {
      // Check egg nutritional info
      expect(screen.getByText('143.0 kcal')).toBeInTheDocument();
      expect(screen.getByText('12.6g')).toBeInTheDocument(); // protein

      // Check banana nutritional info
      expect(screen.getByText('105.0 kcal')).toBeInTheDocument();
      expect(screen.getByText('1.3g')).toBeInTheDocument(); // protein
    });
  });

  it('shows empty state for nutrition analyzer initially', async () => {
    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(
        screen.getByText('Enter food items to analyze their nutritional content')
      ).toBeInTheDocument();
    });
  });

  it('does not render daily quote when there is an error', async () => {
    vi.mocked(libHooks.useDailyQuote).mockReturnValue(
      createMockQueryResult({
        data: undefined,
        error: new Error('Failed to fetch quote'),
        isLoading: false,
        isError: true,
        isSuccess: false,
        status: 'error',
        refetch: vi.fn(),
      })
    );

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.queryByText(`"${mockDailyQuote.text}"`)).not.toBeInTheDocument();
    });
  });

  it('handles refresh button click on error state', async () => {
    vi.mocked(libHooks.useGoals).mockReturnValue(
      createMockQueryResult({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
        isError: true,
        isSuccess: false,
        status: 'error',
        refetch: vi.fn(),
      })
    );

    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    });

    const user = userEvent.setup();
    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Refresh Page')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: 'Refresh Page' });
    await user.click(refreshButton);

    expect(reloadSpy).toHaveBeenCalled();
  });
});

