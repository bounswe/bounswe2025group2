/**
 * Data Fetching Hooks for GenFit Frontend
 * React hooks for fetching goals, challenges, and forum data
 */

import { useQuery } from '@tanstack/react-query';
import GFapi from '../api/GFapi';
import { createQueryKey } from '../query/queryClient';
import type { Goal, Challenge, ForumThread, Quote } from '../types/api';

/**
 * Hook to fetch user's goals
 */
export function useGoals() {
  return useQuery({
    queryKey: createQueryKey('/api/goals/'),
    queryFn: () => GFapi.get<Goal[]>('/api/goals/'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch challenges
 */
export function useChallenges() {
  return useQuery({
    queryKey: createQueryKey('/api/challenges/search/'),
    queryFn: () => GFapi.get<Challenge[]>('/api/challenges/search/'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch forum threads
 */
export function useForumThreads() {
  return useQuery({
    queryKey: createQueryKey('/api/threads/'),
    queryFn: () => GFapi.get<ForumThread[]>('/api/threads/'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch the daily quote
 */
export function useDailyQuote() {
  return useQuery({
    queryKey: createQueryKey('/api/quotes/daily/'),
    queryFn: () => GFapi.get<Quote>('/api/quotes/daily/'),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

/**
 * Hook to fetch notifications
 */
export function useNotifications() {
  return useQuery({
    queryKey: createQueryKey('/api/notifications/'),
    queryFn: () => GFapi.get<any[]>('/api/notifications/'),
    staleTime: 60 * 1000, // 1 minute
  });
}


/**
 * Hook to fetch user statistics (derived from other data)
 */
export function useUserStats() {
  const { data: goals = [] } = useGoals();
  const { data: challenges = [] } = useChallenges();

  console.log(goals)

  return {
    activeGoals: goals.filter(goal => goal.status === 'ACTIVE').length,
    completedChallenges: challenges.filter(challenge => challenge.status === 'COMPLETED').length,
  };
}
