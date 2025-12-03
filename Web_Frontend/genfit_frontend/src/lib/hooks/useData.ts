/**
 * Data Fetching Hooks for GenFit Frontend
 * React hooks for fetching goals, challenges, and forum data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GFapi from '../api/GFapi';
import { createQueryKey } from '../query/queryClient';
import type { Goal, Challenge, ForumThread, Quote, Forum, Comment, Subcomment, Vote, DailyAdvice, UserSettings } from '../types/api';

/**
 * Hook to fetch user's goals
 */
export function useGoals(username?: string) {
  return useQuery({
    queryKey: createQueryKey('/api/goals/', username ? { username } : undefined),
    queryFn: async () => {
      if (!username) {
        try {
          await GFapi.get('/api/goals/check-inactive/');
        } catch (error) {
          console.error("Failed to check inactive goals:", error);
        }
      }
      const goals = await GFapi.get<Goal[]>('/api/goals/', username ? { username } : undefined);
      return goals;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch challenges (deprecated - use useChallenges from useChallenges.ts instead)
 * Keeping for backward compatibility
 */
export function useChallengesLegacy() {
  return useQuery({
    queryKey: createQueryKey('/api/challenges/search/'),
    queryFn: () => GFapi.get<Challenge[]>('/api/challenges/search/'),
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
 * Hook to fetch daily AI-generated advice
 */
export function useDailyAdvice() {
  return useQuery({
    queryKey: createQueryKey('/api/daily-advice/'),
    queryFn: () => GFapi.get<DailyAdvice>('/api/daily-advice/'),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - advice is generated once per day
    retry: 1, // Retry once if it fails
  });
}

/**
 * Hook to regenerate daily advice
 */
export function useRegenerateDailyAdvice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => GFapi.post<DailyAdvice>('/api/daily-advice/regenerate/', {}),
    onSuccess: () => {
      // Invalidate daily advice query to refetch new advice
      queryClient.invalidateQueries({ queryKey: createQueryKey('/api/daily-advice/') });
    },
    onError: (error) => {
      console.error('Failed to regenerate daily advice:', error);
    },
  });
}

/**
 * Hook to fetch notifications
 */
interface Notification {
  id: number;
  notification_type: string;
  title?: string;
  message: string;
  sender_username?: string;
  recipient_username: string;
  related_object_id?: number;
  related_object_type?: string;
  is_read: boolean;
  is_email_sent: boolean;
  created_at: string;
}

export function useNotifications() {
  return useQuery({
    queryKey: createQueryKey('/api/notifications/'),
    queryFn: () => GFapi.get<Notification[]>('/api/notifications/'),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch user settings
 */
export function useUserSettings() {
  return useQuery({
    queryKey: createQueryKey('/api/user/settings/'),
    queryFn: () => GFapi.get<UserSettings>('/api/user/settings/'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update user settings
 */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<UserSettings>) =>
      GFapi.patch<UserSettings>('/api/user/settings/', settings),
    onSuccess: () => {
      // Invalidate settings query to refetch
      queryClient.invalidateQueries({ queryKey: createQueryKey('/api/user/settings/') });
      // Invalidate user query to update user data
      queryClient.invalidateQueries({ queryKey: createQueryKey('/api/user/') });
      // Invalidate daily advice to reflect changes
      queryClient.invalidateQueries({ queryKey: createQueryKey('/api/daily-advice/') });
    },
    onError: (error) => {
      console.error('Failed to update settings:', error);
    },
  });
}


/**
 * Hook to fetch user statistics (derived from other data)
 */
export function useUserStats() {
  const { data: goals = [] } = useGoals();
  const { data: challenges = [] } = useChallengesLegacy();

  return {
    activeGoals: goals.filter(goal => goal.status === 'ACTIVE').length,
    completedChallenges: challenges.filter(challenge => challenge.is_active === false).length,
  };
}

export function useForums() {
  return useQuery({
    queryKey: createQueryKey('/api/forums/'),
    queryFn: () => GFapi.get<Forum[]>('/api/forums/'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useForumThreads(forumId?: number) {
  return useQuery({
    queryKey: createQueryKey(`/api/forums/${forumId}/threads/`),
    queryFn: () => GFapi.get<ForumThread[]>(`/api/forums/${forumId}/threads/`),
    staleTime: 5 * 60 * 1000,
    enabled: !!forumId,
  });
}

export function useThread(threadId?: number) {
  return useQuery({
    queryKey: createQueryKey(`/api/threads/${threadId}/`),
    queryFn: () => GFapi.get<ForumThread>(`/api/threads/${threadId}/`),
    staleTime: 5 * 60 * 1000,
    enabled: !!threadId,
  });
}

export function useThreadComments(threadId?: number, sortBy: 'date' | 'likes' = 'date') {
  const endpoint = sortBy === 'likes' ? `/api/comments/thread/${threadId}/likes/` : `/api/comments/thread/${threadId}/`;
  return useQuery({
    queryKey: createQueryKey(endpoint),
    queryFn: () => GFapi.get<Comment[]>(endpoint),
    staleTime: 5 * 60 * 1000,
    enabled: !!threadId,
  });
}

/**
 * Hook to get a single comment by ID
 */
export function useComment(commentId?: number) {
  return useQuery({
    queryKey: createQueryKey(`/api/comments/${commentId}/`),
    queryFn: () => GFapi.get<Comment>(`/api/comments/${commentId}/`),
    staleTime: 5 * 60 * 1000,
    enabled: !!commentId,
  });
}

/**
 * Hook to get user's vote status on a comment
 */
export function useCommentVoteStatus(commentId?: number) {
  return useQuery({
    queryKey: createQueryKey(`/api/forum/vote/comment/${commentId}/status/`),
    queryFn: async () => {
      try {
        return await GFapi.get<Vote>(`/api/forum/vote/comment/${commentId}/status/`);
      } catch (error: unknown) {
        // If no vote exists (404), return null instead of throwing error
        const err = error as { response?: { status?: number } };
        if (err?.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!commentId,
    retry: false, // Don't retry if no vote exists (404)
  });
}

/**
 * Hook to add a comment to a thread
 */
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, content }: { threadId: number; content: string }) =>
      GFapi.post<Comment>(`/api/comments/add/${threadId}/`, { content }),
    onSuccess: (_data, variables) => {
      // Invalidate thread comments to show the new comment
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key =>
            typeof key === 'string' && key.includes(`/api/comments/thread/${variables.threadId}`)
          );
        }
      });

      // Invalidate thread data to update comment count
      queryClient.invalidateQueries({
        queryKey: createQueryKey(`/api/threads/${variables.threadId}/`)
      });
    },
  });
}

/**
 * Hook to get user's vote status on a subcomment
 */
export function useSubcommentVoteStatus(subcommentId?: number) {
  return useQuery({
    queryKey: createQueryKey(`/api/forum/vote/subcomment/${subcommentId}/status/`),
    queryFn: async () => {
      try {
        return await GFapi.get<Vote>(`/api/forum/vote/subcomment/${subcommentId}/status/`);
      } catch (error: unknown) {
        // If no vote exists (404), return null instead of throwing error
        const err = error as { response?: { status?: number } };
        if (err?.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!subcommentId,
    retry: false, // Don't retry if no vote exists (404)
  });
}

/**
 * Hook to vote on a subcomment
 */
export function useVoteSubcomment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subcommentId, voteType }: { subcommentId: number; voteType: 'UPVOTE' | 'DOWNVOTE' }) =>
      GFapi.post<Vote>('/api/forum/vote/', {
        content_type: 'SUBCOMMENT',
        object_id: subcommentId,
        vote_type: voteType,
      }),
    onSuccess: (_data, variables) => {
      // Invalidate vote status for this subcomment
      queryClient.invalidateQueries({
        queryKey: createQueryKey(`/api/forum/vote/subcomment/${variables.subcommentId}/status/`)
      });

      // Invalidate subcomment data to refresh like count
      queryClient.invalidateQueries({
        queryKey: createQueryKey(`/api/subcomments/${variables.subcommentId}/`)
      });

      // Invalidate all subcomments queries to refresh the list
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key =>
            typeof key === 'string' && key.includes('/api/subcomments/comment/')
          );
        }
      });

      // Invalidate all thread comments queries to refresh the comment list
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key =>
            typeof key === 'string' && key.includes('/api/comments/thread/')
          );
        }
      });
    },
  });
}

/**
 * Hook to remove vote from a subcomment
 */
export function useRemoveVoteSubcomment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subcommentId: number) =>
      GFapi.delete(`/api/forum/vote/subcomment/${subcommentId}/`),
    onSuccess: (_data, subcommentId) => {
      // Invalidate vote status for this subcomment
      queryClient.invalidateQueries({
        queryKey: createQueryKey(`/api/forum/vote/subcomment/${subcommentId}/status/`)
      });

      // Invalidate subcomment data to refresh like count
      queryClient.invalidateQueries({
        queryKey: createQueryKey(`/api/subcomments/${subcommentId}/`)
      });

      // Invalidate all subcomments queries to refresh the list
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key =>
            typeof key === 'string' && key.includes('/api/subcomments/comment/')
          );
        }
      });

      // Invalidate all thread comments queries to refresh the comment list
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key =>
            typeof key === 'string' && key.includes('/api/comments/thread/')
          );
        }
      });
    },
  });
}

/**
 * Hook to update a subcomment
 */
export function useUpdateSubcomment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subcommentId, content }: { subcommentId: number; content: string }) =>
      GFapi.put<Subcomment>(`/api/subcomments/update/${subcommentId}/`, { content }),
    onSuccess: (data) => {
      // Invalidate subcomments for the parent comment
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key =>
            typeof key === 'string' && key.includes(`/api/subcomments/comment/${data.comment_id}`)
          );
        }
      });

      // Invalidate all thread comments queries to refresh the comment list
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key =>
            typeof key === 'string' && key.includes('/api/comments/thread/')
          );
        }
      });
    },
  });
}

/**
 * Hook to delete a subcomment
 */
export function useDeleteSubcomment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subcommentId: number) =>
      GFapi.delete(`/api/subcomments/delete/${subcommentId}/`),
    onSuccess: () => {
      // Invalidate all subcomments queries to refresh the lists
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key =>
            typeof key === 'string' && key.includes('/api/subcomments/comment/')
          );
        }
      });

      // Invalidate all thread comments queries to refresh comment counts
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key =>
            typeof key === 'string' && key.includes('/api/comments/thread/')
          );
        }
      });
    },
  });
}

/**
 * Hook to vote on a comment
 */
export function useVoteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, voteType }: { commentId: number; voteType: 'UPVOTE' | 'DOWNVOTE' }) =>
      GFapi.post<Vote>('/api/forum/vote/', {
        content_type: 'COMMENT',
        object_id: commentId,
        vote_type: voteType,
      }),
    onSuccess: (_data, variables) => {
      // Invalidate vote status for this comment
      queryClient.invalidateQueries({
        queryKey: createQueryKey(`/api/forum/vote/comment/${variables.commentId}/status/`)
      });

      // Invalidate comment data to refresh like count
      queryClient.invalidateQueries({
        queryKey: createQueryKey(`/api/comments/${variables.commentId}/`)
      });

      // Invalidate all thread comments queries (this will match any thread ID)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key =>
            typeof key === 'string' && key.includes('/api/comments/thread/')
          );
        }
      });
    },
  });
}

/**
 * Hook to get user's vote status on a thread
 */
export function useThreadVoteStatus(threadId?: number) {
  return useQuery({
    queryKey: createQueryKey(`/api/forum/vote/thread/${threadId}/status/`),
    queryFn: async () => {
      try {
        return await GFapi.get<Vote>(`/api/forum/vote/thread/${threadId}/status/`);
      } catch (error: unknown) {
        // If no vote exists (404), return null instead of throwing error
        const err = error as { response?: { status?: number } };
        if (err?.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!threadId,
    retry: false, // Don't retry if no vote exists (404)
  });
}

/**
 * Hook to vote on a thread
 */
export function useVoteThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, voteType }: { threadId: number; voteType: 'UPVOTE' | 'DOWNVOTE' }) =>
      GFapi.post<Vote>('/api/forum/vote/', {
        content_type: 'THREAD',
        object_id: threadId,
        vote_type: voteType,
      }),
    onSuccess: (_data, variables) => {
      // Invalidate vote status for this thread
      queryClient.invalidateQueries({
        queryKey: createQueryKey(`/api/forum/vote/thread/${variables.threadId}/status/`)
      });

      // Invalidate thread data to refresh like count
      queryClient.invalidateQueries({
        queryKey: createQueryKey(`/api/threads/${variables.threadId}/`)
      });
    },
  });
}

/**
 * Hook to remove vote from a thread
 */
export function useRemoveVoteThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (threadId: number) =>
      GFapi.delete(`/api/forum/vote/thread/${threadId}/`),
    onSuccess: (_data, threadId) => {
      // Invalidate vote status for this thread
      queryClient.invalidateQueries({
        queryKey: createQueryKey(`/api/forum/vote/thread/${threadId}/status/`)
      });

      // Invalidate thread data to refresh like count
      queryClient.invalidateQueries({
        queryKey: createQueryKey(`/api/threads/${threadId}/`)
      });
    },
  });
}

/**
 * Hook to remove vote from a comment
 */
export function useRemoveVoteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) =>
      GFapi.delete(`/api/forum/vote/comment/${commentId}/`),
    onSuccess: (_data, commentId) => {
      // Invalidate vote status for this comment
      queryClient.invalidateQueries({
        queryKey: createQueryKey(`/api/forum/vote/comment/${commentId}/status/`)
      });

      // Invalidate comment data to refresh like count
      queryClient.invalidateQueries({
        queryKey: createQueryKey(`/api/comments/${commentId}/`)
      });

      // Invalidate all thread comments queries (this will match any thread ID)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key =>
            typeof key === 'string' && key.includes('/api/comments/thread/')
          );
        }
      });
    },
  });
}

/**
 * Hook to update a comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      GFapi.put<Comment>(`/api/comments/update/${commentId}/`, { content }),
    onSuccess: (_data, variables) => {
      // Invalidate the specific comment
      queryClient.invalidateQueries({
        queryKey: createQueryKey(`/api/comments/${variables.commentId}/`)
      });

      // Invalidate all thread comments queries to refresh the comment list
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key =>
            typeof key === 'string' && key.includes('/api/comments/thread/')
          );
        }
      });
    },
  });
}

/**
 * Hook to delete a comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) =>
      GFapi.delete(`/api/comments/delete/${commentId}/`),
    onSuccess: () => {
      // Invalidate all thread comments queries to refresh the comment list
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key =>
            typeof key === 'string' && key.includes('/api/comments/thread/')
          );
        }
      });

      // Invalidate thread data to update comment count
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key =>
            typeof key === 'string' && key.includes('/api/threads/')
          );
        }
      });
    },
  });
}

/**
 * Hook to get subcomments for a comment
 */
export function useSubcomments(commentId?: number, sortBy: 'date' | 'likes' = 'date') {
  const endpoint = commentId ? `/api/subcomments/comment/${commentId}/?sort_by=${sortBy}` : null;

  return useQuery({
    queryKey: endpoint ? createQueryKey(endpoint) : [],
    queryFn: () => GFapi.get<Subcomment[]>(endpoint!),
    staleTime: 5 * 60 * 1000,
    enabled: !!commentId,
  });
}

/**
 * Hook to add a subcomment to a comment
 */
export function useAddSubcomment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      GFapi.post<Subcomment>(`/api/subcomments/add/${commentId}/`, { content }),
    onSuccess: (_data, variables) => {
      // Invalidate subcomments for this comment
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key =>
            typeof key === 'string' && key.includes(`/api/subcomments/comment/${variables.commentId}`)
          );
        }
      });

      // Invalidate the parent comment to update subcomment count
      queryClient.invalidateQueries({
        queryKey: createQueryKey(`/api/comments/${variables.commentId}/`)
      });

      // Invalidate all thread comments queries to refresh the comment list
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key =>
            typeof key === 'string' && key.includes('/api/comments/thread/')
          );
        }
      });
    },
  });
}

/**
 * Hook to update a thread
 */
export function useUpdateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, data }: { threadId: number; data: Partial<ForumThread> }) =>
      GFapi.put<ForumThread>(`/api/threads/${threadId}/`, data),
    onSuccess: (_data, variables) => {
      // Invalidate the specific thread
      queryClient.invalidateQueries({
        queryKey: createQueryKey(`/api/threads/${variables.threadId}/`)
      });

      // Invalidate forum threads list
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key =>
            typeof key === 'string' && key.includes('/api/forums/') && key.includes('/threads/')
          );
        }
      });

      // Invalidate all threads list
      queryClient.invalidateQueries({
        queryKey: createQueryKey('/api/threads/')
      });
    },
  });
}

/**
 * Hook to delete a thread
 */
export function useDeleteThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (threadId: number) =>
      GFapi.delete(`/api/threads/${threadId}/`),
    onSuccess: (_data, threadId) => {
      // Invalidate the specific thread
      queryClient.invalidateQueries({
        queryKey: createQueryKey(`/api/threads/${threadId}/`)
      });

      // Invalidate forum threads list
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(key =>
            typeof key === 'string' && key.includes('/api/forums/') && key.includes('/threads/')
          );
        }
      });

      // Invalidate all threads list
      queryClient.invalidateQueries({
        queryKey: createQueryKey('/api/threads/')
      });
    },
  });
}
/**
 * Hook to toggle thread bookmark
 */
export function useBookmarkThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (threadId: number) =>
      GFapi.post<{ status: string; is_bookmarked: boolean }>(`/api/threads/${threadId}/bookmark/`, {}),
    onSuccess: (_data, threadId) => {
      // Invalidate the specific thread to update bookmark status
      queryClient.invalidateQueries({
        queryKey: createQueryKey(`/api/threads/${threadId}/`)
      });

      // Invalidate bookmarked threads list
      queryClient.invalidateQueries({
        queryKey: createQueryKey('/api/threads/bookmarked/')
      });
    },
  });
}

/**
 * Hook to fetch bookmarked threads
 */
export function useBookmarkedThreads() {
  return useQuery({
    queryKey: createQueryKey('/api/threads/bookmarked/'),
    queryFn: () => GFapi.get<ForumThread[]>('/api/threads/bookmarked/'),
    staleTime: 5 * 60 * 1000,
  });
}
