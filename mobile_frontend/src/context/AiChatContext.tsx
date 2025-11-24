import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import axios from 'axios';
import Cookies from '@react-native-cookies/cookies';
import Toast from 'react-native-toast-message';
import { useAuth } from './AuthContext';
import { API_URL } from '../constants/api';

export type AiTutorChat = {
  id: number;
  chat_id: string;
  created_at: string;
  is_ai: boolean;
};

export type AiMessage = {
  id: number;
  message: string;
  created_at: string;
  sender: 'user' | 'ai';
};

type AiChatContextType = {
  aiChats: AiTutorChat[];
  aiMessages: AiMessage[];
  selectedAiChatId: number | null;
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  error: string | null;
  fetchAiChats: () => Promise<void>;
  selectAiChat: (chatId: number | null) => Promise<void>;
  createAiChat: () => Promise<AiTutorChat | null>;
  sendAiMessage: (message: string) => Promise<void>;
  clearAiState: () => void;
};

const AiChatContext = createContext<AiChatContextType>({
  aiChats: [],
  aiMessages: [],
  selectedAiChatId: null,
  isLoadingChats: false,
  isLoadingMessages: false,
  isSendingMessage: false,
  error: null,
  fetchAiChats: async () => {},
  selectAiChat: async () => {},
  createAiChat: async () => null,
  sendAiMessage: async () => {},
  clearAiState: () => {},
});

type AiChatProviderProps = {
  children: ReactNode;
};

type AiChatHistoryResponse = {
  user_messages?: Array<{
    id: number;
    message: string;
    created_at: string;
  }>;
  ai_responses?: Array<{
    id: number;
    response: string;
    created_at: string;
  }>;
};

export const AiChatProvider = ({ children }: AiChatProviderProps) => {
  const { token, getAuthHeader, isAuthenticated } = useAuth() as {
    token?: string | null;
    getAuthHeader: () => Record<string, string>;
    isAuthenticated: boolean;
  };
  const isLoggedIn = Boolean(token) || isAuthenticated;
  const [aiChats, setAiChats] = useState<AiTutorChat[]>([]);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [selectedAiChatId, setSelectedAiChatId] = useState<number | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildHeaders = useCallback(
    async () => {
      // Extract the origin (base URL) for Referer header
      const origin = API_URL.replace(/\/api\/?$/, '');
      
      const headers: Record<string, string> = {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
        'Referer': origin,
      };

      try {
        const cookies = await Cookies.get(API_URL);
        const csrfToken = cookies?.csrftoken?.value;
        if (csrfToken) {
          headers['X-CSRFToken'] = csrfToken;
        }
      } catch (cookieError) {
        console.log('[AiChatContext] Failed to read cookies:', cookieError);
      }

      return headers;
    },
    [getAuthHeader],
  );

  const handleError = useCallback((message: string, err: unknown) => {
    console.error(`[AiChatContext] ${message}`, err);
    setError(message);
    Toast.show({
      type: 'error',
      text1: 'AI Chat Error',
      text2: message,
    });
  }, []);

  const fetchAiChats = useCallback(async () => {
    if (!isLoggedIn) {
      setAiChats([]);
      return;
    }

    console.log('[AiChatContext] Fetching AI chats');
    setIsLoadingChats(true);
    setError(null);

    try {
      const headers = await buildHeaders();
      const response = await axios.get<AiTutorChat[]>(`${API_URL}ai-tutor/`, {
        headers,
        withCredentials: true,
      });
      console.log('[AiChatContext] Fetched AI chats:', response.data.length);
      setAiChats(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      handleError('Failed to fetch AI chats', err);
      setAiChats([]);
    } finally {
      console.log('[AiChatContext] Fetch AI chats completed');
      setIsLoadingChats(false);
    }
  }, [isLoggedIn, buildHeaders, handleError]);

  const hydrateMessages = useCallback((history: AiChatHistoryResponse) => {
    const userMessages = history.user_messages ?? [];
    const aiResponses = history.ai_responses ?? [];

    const combined: AiMessage[] = [
      ...userMessages.map((msg) => ({
        id: msg.id,
        message: msg.message,
        created_at: msg.created_at,
        sender: 'user' as const,
      })),
      ...aiResponses.map((msg) => ({
        id: msg.id,
        message: msg.response,
        created_at: msg.created_at,
        sender: 'ai' as const,
      })),
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    setAiMessages(combined);
  }, []);

  const fetchAiChatHistory = useCallback(
    async (chatId: number) => {
      if (!isLoggedIn) {
        setAiMessages([]);
        return;
      }

    console.log('[AiChatContext] Fetching AI chat history for chat:', chatId);
      setIsLoadingMessages(true);
      setError(null);

      try {
        const headers = await buildHeaders();
        const response = await axios.get<AiChatHistoryResponse>(
          `${API_URL}ai-tutor/${chatId}/chat_history/`,
          { headers, withCredentials: true },
        );
        console.log('[AiChatContext] Loaded AI chat history for chat:', chatId);
        hydrateMessages(response.data ?? {});
      } catch (err) {
        handleError('Failed to load AI chat history', err);
        setAiMessages([]);
      } finally {
      console.log('[AiChatContext] Fetch AI chat history completed for chat:', chatId);
        setIsLoadingMessages(false);
      }
    },
    [isLoggedIn, buildHeaders, hydrateMessages, handleError],
  );

  const selectAiChat = useCallback(
    async (chatId: number | null) => {
      console.log('[AiChatContext] Selecting AI chat:', chatId);
      setSelectedAiChatId(chatId);
      if (chatId === null) {
        setAiMessages([]);
        return;
      }

      await fetchAiChatHistory(chatId);
    },
    [fetchAiChatHistory],
  );

  const createAiChat = useCallback(async () => {
    if (!isLoggedIn) {
      console.log('[AiChatContext] createAiChat blocked: not logged in');
      handleError('You must be logged in to create an AI chat', null);
      return null;
    }

    console.log('[AiChatContext] Creating AI chat');
    setIsSendingMessage(true);
    setError(null);

    try {
      const headers = await buildHeaders();
      const response = await axios.post<AiTutorChat>(
        `${API_URL}ai-tutor/`,
        {},
        { headers, withCredentials: true },
      );

      console.log('[AiChatContext] Created AI chat:', response.data?.id);
      await fetchAiChats();
      if (response.data?.id) {
        await selectAiChat(response.data.id);
      } else {
        console.log('[AiChatContext] createAiChat response missing id');
      }
      return response.data ?? null;
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.log('[AiChatContext] createAiChat failed', { status, data });
      handleError('Failed to create AI chat', err);
      return null;
    } finally {
      console.log('[AiChatContext] Create AI chat request finished');
      setIsSendingMessage(false);
    }
  }, [isLoggedIn, buildHeaders, fetchAiChats, selectAiChat, handleError]);

  const sendAiMessage = useCallback(
    async (message: string) => {
      if (!selectedAiChatId) {
        handleError('No AI chat selected', null);
        return;
      }

      if (!message.trim()) {
        return;
      }

      setIsSendingMessage(true);
      setError(null);

    let optimisticId: number | null = null;

    try {
        const headers = await buildHeaders();
        optimisticId = Date.now();
        const userMessage: AiMessage = {
          id: optimisticId,
          message,
          created_at: new Date().toISOString(),
          sender: 'user',
        };

        // Optimistically add the user message
        setAiMessages((prev) => [...prev, userMessage]);

        await axios.post(
          `${API_URL}ai-tutor/${selectedAiChatId}/send_message/`,
          { message },
          { headers, withCredentials: true },
        );

        console.log('[AiChatContext] Message sent to AI for chat:', selectedAiChatId);

        // Refresh messages to include the AI response
        await fetchAiChatHistory(selectedAiChatId);
      } catch (err) {
        handleError('Failed to send message to AI tutor', err);
        // Remove the optimistic message on failure
        if (optimisticId !== null) {
          setAiMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
        }
      } finally {
      console.log('[AiChatContext] Send message flow finished for chat:', selectedAiChatId);
        setIsSendingMessage(false);
      }
    },
    [selectedAiChatId, buildHeaders, fetchAiChatHistory, handleError],
  );

  const clearAiState = useCallback(() => {
    setSelectedAiChatId(null);
    setAiMessages([]);
    setError(null);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchAiChats();
    } else {
      setAiChats([]);
      setAiMessages([]);
      setSelectedAiChatId(null);
    }
  }, [isLoggedIn, fetchAiChats]);

  const value = useMemo(
    () => ({
      aiChats,
      aiMessages,
      selectedAiChatId,
      isLoadingChats,
      isLoadingMessages,
      isSendingMessage,
      error,
      fetchAiChats,
      selectAiChat,
      createAiChat,
      sendAiMessage,
      clearAiState,
    }),
    [
      aiChats,
      aiMessages,
      selectedAiChatId,
      isLoadingChats,
      isLoadingMessages,
      isSendingMessage,
      error,
      fetchAiChats,
      selectAiChat,
      createAiChat,
      sendAiMessage,
      clearAiState,
    ],
  );

  return <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>;
};

export const useAiChat = () => useContext(AiChatContext);


