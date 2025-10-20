/**
 * Chat Hooks for GenFit Frontend
 * React hooks for managing chat functionality and AI tutor
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import GFapi from '../api/GFapi';
import { createQueryKey, invalidateQueries } from '../query/queryClient';
import type { Chat, ChatUser, AiTutorChat } from '../types/api';

/**
 * Hook to get all users for chat creation
 */
export function useChatUsers() {
  return useQuery({
    queryKey: createQueryKey('/chat/get-users/'),
    queryFn: () => GFapi.get<ChatUser[]>('/chat/get-users/'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on failure
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

/**
 * Hook to get user's chats
 */
export function useChats() {
  return useQuery({
    queryKey: createQueryKey('/chat/get-chats/'),
    queryFn: () => GFapi.get<Chat[]>('/chat/get-chats/'),
    staleTime: 30 * 1000, // 30 seconds - chats update frequently
    retry: false, // Don't retry on failure
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

/**
 * Hook to create a new chat
 */
export function useCreateChat() {
  return useMutation({
    mutationFn: (userId: number) => 
      GFapi.post<Chat>('/chat/create-chat/', { user_id: userId }),
    onSuccess: () => {
      // Invalidate chats query to refetch updated list
      invalidateQueries(['/chat/get-chats/']);
    },
    onError: (error) => {
      console.error('Failed to create chat:', error);
    },
  });
}

/**
 * Hook to get AI tutor chats
 */
export function useAiChats() {
  return useQuery({
    queryKey: createQueryKey('/api/ai-tutor/'),
    queryFn: () => GFapi.get<AiTutorChat[]>('/api/ai-tutor/'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on failure
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

/**
 * Hook to create a new AI tutor chat
 */
export function useCreateAiChat() {
  return useMutation({
    mutationFn: () => GFapi.post<AiTutorChat>('/api/ai-tutor/', {}),
    onSuccess: () => {
      // Invalidate AI chats query to refetch updated list
      invalidateQueries(['/api/ai-tutor/']);
    },
    onError: (error) => {
      console.error('Failed to create AI chat:', error);
    },
  });
}

/**
 * Hook to get AI chat history
 */
export function useAiChatHistory(chatId: number | null) {
  return useQuery({
    queryKey: createQueryKey(`/api/ai-tutor/${chatId}/chat_history/`),
    queryFn: () => GFapi.get(`/api/ai-tutor/${chatId}/chat_history/`),
    enabled: !!chatId, // Only run query if chatId is provided
    staleTime: 30 * 1000, // 30 seconds
    retry: false, // Don't retry on failure
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

/**
 * Hook to send message to AI tutor
 */
export function useSendAiMessage() {
  return useMutation({
    mutationFn: ({ chatId, message }: { chatId: number; message: string }) =>
      GFapi.post(`/api/ai-tutor/${chatId}/send_message/`, { message }),
    onSuccess: (_, variables) => {
      // Invalidate the specific chat history to refetch messages
      invalidateQueries([`/api/ai-tutor/${variables.chatId}/chat_history/`]);
    },
    onError: (error) => {
      console.error('Failed to send AI message:', error);
    },
  });
}
