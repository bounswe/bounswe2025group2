/**
 * Data Fetching Hooks for GenFit Frontend
 * React hooks for fetching goals, challenges, and forum data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GFapi from '../api/GFapi';
import { createQueryKey } from '../query/queryClient';
import type { Goal, Challenge, ForumThread, Quote, Forum, Comment, Subcomment, Vote } from '../types/api';

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
      } catch (error: any) {
        // If no vote exists (404), return null instead of throwing error
        if (error?.response?.status === 404) {
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
    onSuccess: (data, variables) => {
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
      } catch (error: any) {
        // If no vote exists (404), return null instead of throwing error
        if (error?.response?.status === 404) {
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
    onSuccess: (data, variables) => {
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
    onSuccess: (data, subcommentId) => {
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
    onSuccess: (data, variables) => {
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
    onSuccess: (data, subcommentId) => {
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
    onSuccess: (data, variables) => {
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
      } catch (error: any) {
        // If no vote exists (404), return null instead of throwing error
        if (error?.response?.status === 404) {
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
    onSuccess: (data, variables) => {
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
    onSuccess: (data, threadId) => {
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
    onSuccess: (data, commentId) => {
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
    onSuccess: (data, variables) => {
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
    onSuccess: (data, commentId) => {
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
    onSuccess: (data, variables) => {
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
