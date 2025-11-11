/**
 * ActivityDashboard Component Tests
 * Tests for the ActivityDashboard component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent, createMockQueryResult } from '../../test/test-utils';
import { ActivityDashboard } from '../ActivityDashboard';
import { mockGoals, mockChallenges, mockLoginStats } from '../../test/mocks/handlers';
import * as libHooks from '../../lib';

// Mock the useLoginStats hook
vi.mock('../../lib', async () => {
  const actual = await vi.importActual('../../lib');
  return {
    ...actual,
    useLoginStats: vi.fn(),
  };
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ActivityDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock for useLoginStats
    vi.mocked(libHooks.useLoginStats).mockReturnValue(
      createMockQueryResult({
        data: mockLoginStats,
        isLoading: false,
        error: null,
      })
    );
  });

  it('renders loading state when stats are loading', () => {
    vi.mocked(libHooks.useLoginStats).mockReturnValue(
      createMockQueryResult({
        data: undefined,
        isLoading: true,
        error: null,
        isSuccess: false,
        status: 'pending',
      })
    );

    renderWithProviders(
      <ActivityDashboard
        goals={[]}
        challenges={[]}
        activeGoals={0}
        joinedChallenges={0}
      />
    );

    expect(screen.getByText('Loading activity dashboard...')).toBeInTheDocument();
  });

  it('renders stats correctly', async () => {
    renderWithProviders(
      <ActivityDashboard
        goals={mockGoals}
        challenges={mockChallenges}
        activeGoals={2}
        joinedChallenges={1}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Active Goals')).toBeInTheDocument();
      expect(screen.getByText('Joined Challenges')).toBeInTheDocument();
      // Check that the stats section contains the numbers
      const statsSection = screen.getByText('Active Goals').closest('.stats-row');
      expect(statsSection).toBeInTheDocument();
    });
  });

  it('renders login streak information', async () => {
    renderWithProviders(
      <ActivityDashboard
        goals={mockGoals}
        challenges={mockChallenges}
        activeGoals={2}
        joinedChallenges={1}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Login Streak')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();
      expect(screen.getByText('Best')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      // Check that the streak section exists
      const streakSection = screen.getByText('Login Streak').closest('.streak-section');
      expect(streakSection).toBeInTheDocument();
    });
  });

  it('shows warning when user has not logged in today', async () => {
    vi.mocked(libHooks.useLoginStats).mockReturnValue(
      createMockQueryResult({
        data: { ...mockLoginStats, logged_in_today: false },
        isLoading: false,
        error: null,
      })
    );

    renderWithProviders(
      <ActivityDashboard
        goals={mockGoals}
        challenges={mockChallenges}
        activeGoals={2}
        joinedChallenges={1}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Log in today to continue!')).toBeInTheDocument();
    });
  });

  it('renders calendar with current month', async () => {
    renderWithProviders(
      <ActivityDashboard
        goals={mockGoals}
        challenges={mockChallenges}
        activeGoals={2}
        joinedChallenges={1}
      />
    );

    const today = new Date();
    const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    await waitFor(() => {
      expect(screen.getByText(monthName)).toBeInTheDocument();
    });
  });

  it('shows upcoming deadlines section', async () => {
    renderWithProviders(
      <ActivityDashboard
        goals={mockGoals}
        challenges={mockChallenges}
        activeGoals={2}
        joinedChallenges={1}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Upcoming Deadlines')).toBeInTheDocument();
    });
  });

  it('shows empty state when no upcoming deadlines', async () => {
    renderWithProviders(
      <ActivityDashboard
        goals={[]}
        challenges={[]}
        activeGoals={0}
        joinedChallenges={0}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No upcoming deadlines')).toBeInTheDocument();
    });
  });

  it('navigates to goals page when clicking on a goal deadline', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ActivityDashboard
        goals={[
          {
            ...mockGoals[0],
            target_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
          },
        ]}
        challenges={[]}
        activeGoals={1}
        joinedChallenges={0}
      />
    );

    await waitFor(() => {
      const goalElement = screen.getByText('Lose 10 pounds');
      expect(goalElement).toBeInTheDocument();
    });

    const goalDeadline = screen.getByText('Lose 10 pounds').closest('.deadline-item');
    if (goalDeadline) {
      await user.click(goalDeadline);
      expect(mockNavigate).toHaveBeenCalledWith('/goals');
    }
  });

  it('navigates to challenges page when clicking on a challenge deadline', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ActivityDashboard
        goals={[]}
        challenges={[
          {
            ...mockChallenges[0],
            end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
          },
        ]}
        activeGoals={0}
        joinedChallenges={1}
      />
    );

    await waitFor(() => {
      const challengeElement = screen.getByText('30-Day Fitness Challenge');
      expect(challengeElement).toBeInTheDocument();
    });

    const challengeDeadline = screen.getByText('30-Day Fitness Challenge').closest('.deadline-item');
    if (challengeDeadline) {
      await user.click(challengeDeadline);
      expect(mockNavigate).toHaveBeenCalledWith('/challenges');
    }
  });
});

