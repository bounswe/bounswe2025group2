import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import Cookies from '@react-native-cookies/cookies';

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
};

const ChatContext = createContext<ChatContextType>({
  contacts: [],
  chats: [],
  activeChatId: null,
  setActiveChatId: () => {},
  fetchContacts: async () => {},
  fetchChats: async () => {},
  createChat: async () => null,
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

  const fetchContacts = async () => {
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
      
      // Log response for debugging
      console.log('User API Response:', res.data);
      
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
  };

  const fetchChats = async () => {
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
  };

  const createChat = async (userId: number) => {
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
  };

  useEffect(() => {
    if (token) {
      fetchContacts();
      fetchChats();
    }
  }, [token]);

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
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}; 