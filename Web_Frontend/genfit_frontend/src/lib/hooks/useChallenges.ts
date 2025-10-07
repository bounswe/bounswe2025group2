/**
 * Challenge-specific hooks for GenFit Frontend
 * Following the same patterns as useGoals and useData hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GFapi from '../api/GFapi';
import { createQueryKey } from '../query/queryClient';
import type {
  Challenge,
  ChallengeParticipant,
  CreateChallengeData,
  LeaderboardEntry,
  ChallengeHistory,
  User
} from '../types/api';

/**
 * Hook to fetch all users for coach username mapping
 */
function useUsers() {
  return useQuery({
    queryKey: createQueryKey('/api/users/'),
    queryFn: async () => {
      try {
        return await GFapi.get<User[]>('/api/users/');
      } catch (error) {
        console.error('Failed to fetch users for coach mapping:', error);
        // Return empty array to allow challenges to load without coach usernames
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - users don't change often
    retry: 1, // Retry once
    retryDelay: 1000, // Wait 1 second between retries
  });
}

/**
 * Hook to fetch all challenges with optional search/filter parameters
 * Uses the /api/challenges/search/ endpoint from the backend
 * Enriches challenges with coach usernames
 */
export function useChallenges(searchParams?: {
  is_active?: string;
  user_participating?: string;
  min_age?: string;
  max_age?: string;
  location?: string;
  radius_km?: string;
}) {
  const queryKey = searchParams
    ? createQueryKey('/api/challenges/search/', searchParams)
    : createQueryKey('/api/challenges/search/');

  const { data: users = [], error: usersError } = useUsers();

  // Log users data for debugging
  if (usersError) {
    console.error('Failed to fetch users:', usersError);
  }

  // Fetch challenges independently
  const challengesQuery = useQuery({
    queryKey,
    queryFn: () => GFapi.get<Challenge[]>('/api/challenges/search/', searchParams),
    staleTime: 5 * 60 * 1000,
  });

  // Combine challenges with user data
  const enrichedData = challengesQuery.data?.map(challenge => {
    // Create a mapping of user ID to username only if users are available
    let coachUsername = 'Coach'; // Default fallback
    
    if (users.length > 0) {
      const userMap = users.reduce((map, user) => {
        map[user.id] = user.username;
        return map;
      }, {} as Record<number, string>);
      
      coachUsername = userMap[challenge.coach] || 'Coach';
    }

    return {
      ...challenge,
      coach_username: coachUsername
    };
  });

  return {
    ...challengesQuery,
    data: enrichedData || []
  };
}

/**
 * Hook to fetch a single challenge by ID
 */
export function useChallenge(challengeId: number) {
  return useQuery({
    queryKey: createQueryKey(`/api/challenges/${challengeId}/`),
    queryFn: () => GFapi.get<Challenge>(`/api/challenges/${challengeId}/`),
    enabled: !!challengeId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch challenge participants and leaderboard data
 */
export function useChallengeParticipants(challengeId: number) {
  return useQuery({
    queryKey: createQueryKey(`/api/challenges/${challengeId}/leaderboard/`),
    queryFn: () => GFapi.get<ChallengeParticipant[]>(`/api/challenges/${challengeId}/leaderboard/`),
    enabled: !!challengeId,
    staleTime: 2 * 60 * 1000, // 2 minutes for more frequent updates (real-time requirement)
  });
}

/**
 * Hook to fetch leaderboard with different ranking criteria
 */
export function useChallengeLeaderboard(challengeId: number, rankingCriteria: string = 'progress') {
  return useQuery({
    queryKey: createQueryKey(`/api/challenges/${challengeId}/leaderboard/`, { criteria: rankingCriteria }),
    queryFn: () => GFapi.get<LeaderboardEntry[]>(`/api/challenges/${challengeId}/leaderboard/`, { criteria: rankingCriteria }),
    enabled: !!challengeId,
    staleTime: 2 * 60 * 1000, // 2 minutes for real-time updates
  });
}

/**
 * Hook to fetch user's joined challenges
 */
export function useUserChallenges() {
  return useQuery({
    queryKey: createQueryKey('/api/challenges/joined/'),
    queryFn: () => GFapi.get<Challenge[]>('/api/challenges/joined/'),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch user's challenge history
 */
export function useChallengeHistory() {
  return useQuery({
    queryKey: createQueryKey('/api/challenges/history/'),
    queryFn: () => GFapi.get<ChallengeHistory[]>('/api/challenges/history/'),
    staleTime: 10 * 60 * 1000, // 10 minutes - history doesn't change often
  });
}

/**
 * Hook to create a new challenge (coaches only)
 * Uses the /api/challenges/create/ endpoint
 */
export function useCreateChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChallengeData) => GFapi.post<Challenge>('/api/challenges/create/', data),
    onSuccess: () => {
      // Invalidate challenges queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/search/'] });
    },
    onError: (error) => {
      console.error('Failed to create challenge:', error);
    },
  });
}

/**
 * Hook to update a challenge (coaches only)
 */
export function useUpdateChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ challengeId, data }: { challengeId: number; data: Partial<CreateChallengeData> }) =>
      GFapi.put<Challenge>(`/api/challenges/${challengeId}/update/`, data),
    onSuccess: (_, { challengeId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/search/'] });
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}/`] });
    },
    onError: (error) => {
      console.error('Failed to update challenge:', error);
    },
  });
}

/**
 * Hook to delete a challenge (coaches only)
 */
export function useDeleteChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (challengeId: number) => GFapi.delete(`/api/challenges/${challengeId}/delete/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/search/'] });
    },
    onError: (error) => {
      console.error('Failed to delete challenge:', error);
    },
  });
}

/**
 * Hook to join a challenge
 */
export function useJoinChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (challengeId: number) => GFapi.post(`/api/challenges/${challengeId}/join/`),
    onSuccess: (_, challengeId) => {
      // Invalidate multiple queries to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/search/'] });
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}/`] });
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}/leaderboard/`] });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/joined/'] });
    },
    onError: (error) => {
      console.error('Failed to join challenge:', error);
    },
  });
}

/**
 * Hook to leave a challenge
 */
export function useLeaveChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (challengeId: number) => GFapi.post(`/api/challenges/${challengeId}/leave/`),
    onSuccess: (_, challengeId) => {
      // Invalidate multiple queries to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/search/'] });
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}/`] });
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}/leaderboard/`] });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/joined/'] });
    },
    onError: (error) => {
      console.error('Failed to leave challenge:', error);
    },
  });
}

/**
 * Hook to update challenge progress
 */
export function useUpdateChallengeProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ challengeId, progress }: { challengeId: number; progress: number }) =>
      GFapi.post(`/api/challenges/${challengeId}/update-progress/`, { added_value: progress }),
    onSuccess: (_, { challengeId }) => {
      // Invalidate queries for real-time updates
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}/`] });
      queryClient.invalidateQueries({ queryKey: [`/api/challenges/${challengeId}/leaderboard/`] });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/joined/'] });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/search/'] });
    },
    onError: (error) => {
      console.error('Failed to update challenge progress:', error);
    },
  });
}