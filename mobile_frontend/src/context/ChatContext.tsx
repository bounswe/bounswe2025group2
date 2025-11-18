import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import Cookies from '@react-native-cookies/cookies';
import { webSocketService } from '../services/WebSocketService';

// Types for our chat system
export type Message = {
  id: number;
  sender: string;
  body: string;
  created: string;
  is_read: boolean;
};

export type Contact = {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_staff?: boolean;
  user_type?: string;
  // Add any other fields that might come from /api/users/
};

export type Chat = {
  id: number;
  participants: Contact[];
  other_user: Contact;
  created: string;
  last_message: Message | null;
  unread_count: number;
};

type ChatContextType = {
  contacts: Contact[];
  chats: Chat[];
  activeChatId: number | null;
  setActiveChatId: (id: number | null) => void;
  fetchContacts: () => Promise<void>;
  fetchChats: () => Promise<void>;
  createChat: (userId: number) => Promise<Chat | null>;
  // WebSocket related
  messages: Message[];
  isConnected: boolean;
  sendMessage: (messageBody: string) => void;
  connectToChat: (chatId: number) => void;
  disconnectFromChat: () => void;
};

const ChatContext = createContext<ChatContextType>({
  contacts: [],
  chats: [],
  activeChatId: null,
  setActiveChatId: () => {},
  fetchContacts: async () => {},
  fetchChats: async () => {},
  createChat: async () => null,
  messages: [],
  isConnected: false,
  sendMessage: () => {},
  connectToChat: () => {},
  disconnectFromChat: () => {},
});

export const useChat = () => useContext(ChatContext);

type ChatProviderProps = {
  children: ReactNode;
};

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const { token, getAuthHeader } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const fetchContacts = useCallback(async () => {
    try {
      const cookies = await Cookies.get('http://164.90.166.81:8000');
      const csrfToken = cookies.csrftoken?.value;
      
      const res = await axios.get('http://164.90.166.81:8000/api/users/', {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        withCredentials: true,
      });
      
      
      // Ensure we transform the data to match our Contact type if needed
      const mappedContacts: Contact[] = Array.isArray(res.data) 
        ? res.data.map((user: any) => ({
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            is_staff: user.is_staff,
            user_type: user.user_type,
          }))
        : [];
      
      setContacts(mappedContacts);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setContacts([]);
    }
  }, [getAuthHeader]);

  const fetchChats = useCallback(async () => {
    try {
      const cookies = await Cookies.get('http://164.90.166.81:8000');
      const csrfToken = cookies.csrftoken?.value;
      
      const res = await axios.get('http://164.90.166.81:8000/chat/get-chats/', {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        withCredentials: true,
      });
      setChats(res.data);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
      setChats([]);
    }
  }, [getAuthHeader]);

  const createChat = useCallback(async (userId: number) => {
    try {
      const cookies = await Cookies.get('http://164.90.166.81:8000');
      const csrfToken = cookies.csrftoken?.value;
      
      const res = await axios.post(
        'http://164.90.166.81:8000/chat/create-chat/',
        { user_id: userId },
        { 
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
          withCredentials: true,
        }
      );
      await fetchChats();
      return res.data;
    } catch (err) {
      console.error('Failed to create chat:', err);
      return null;
    }
  }, [fetchChats, getAuthHeader]);

  // WebSocket methods
  const connectToChat = useCallback(async (chatId: number) => {
    setActiveChatId(chatId);
    setMessages([]); // Clear previous messages
    
    try {
      await webSocketService.connect(
        chatId,
        (message: Message) => {
          setMessages(prev => {
            // Check if message already exists to prevent duplicates
            const exists = prev.some(msg => msg.id === message.id);
            if (exists) {
              return prev;
            }
            return [...prev, message];
          });
        },
        (error: string) => {
          console.error('WebSocket error:', error);
        },
        () => {
          setIsConnected(true);
        },
        () => {
          setIsConnected(false);
        }
      );
    } catch (error) {
      console.error('Failed to connect to chat:', error);
    }
  }, []);

  const disconnectFromChat = useCallback(() => {
    webSocketService.disconnect();
    setActiveChatId(null);
    setMessages([]);
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((messageBody: string) => {
    if (messageBody.trim()) {
      webSocketService.sendMessage(messageBody.trim());
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchContacts();
      fetchChats();
    }
  }, [token, fetchContacts, fetchChats]);

  return (
    <ChatContext.Provider
      value={{
        contacts,
        chats,
        activeChatId,
        setActiveChatId,
        fetchContacts,
        fetchChats,
        createChat,
        messages,
        isConnected,
        sendMessage,
        connectToChat,
        disconnectFromChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}; 