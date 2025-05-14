import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for our chat system
export type Message = {
  id: string;
  content: string;
  timestamp: number;
  senderId: string;
  receiverId: string;
  read: boolean;
  imageUri?: string; // Add imageUri for image messages
};

export type Contact = {
  id: string;
  name: string;
  avatar: any;
  lastSeen: string;
  status: 'online' | 'offline' | 'away';
  unreadCount: number;
};

export type Conversation = {
  contactId: string;
  messages: Message[];
};

type ChatContextType = {
  contacts: Contact[];
  conversations: Conversation[];
  activeContactId: string | null;
  setActiveContactId: (id: string | null) => void;
  sendMessage: (content: string, receiverId: string, imageUri?: string) => void;
  getMessages: (contactId: string) => Message[];
  getUnreadCount: (contactId: string) => number;
  markAsRead: (contactId: string) => void;
  getTotalUnread: () => number;
};

const ChatContext = createContext<ChatContextType>({
  contacts: [],
  conversations: [],
  activeContactId: null,
  setActiveContactId: () => {},
  sendMessage: () => {},
  getMessages: () => [],
  getUnreadCount: () => 0,
  markAsRead: () => {},
  getTotalUnread: () => 0,
});

export const useChat = () => useContext(ChatContext);

type ChatProviderProps = {
  children: ReactNode;
};

// Initial mock data
const initialContacts: Contact[] = [
  {
    id: '1',
    name: 'Coach Smith',
    avatar: require('../assets/temp_images/pp1.png'),
    lastSeen: 'Today, 9:41 AM',
    status: 'online',
    unreadCount: 0,
  },
  {
    id: '2',
    name: 'Sarah Jones',
    avatar: require('../assets/temp_images/pp2.png'),
    lastSeen: 'Yesterday',
    status: 'offline',
    unreadCount: 0,
  },
  {
    id: '3',
    name: 'Basketball Team',
    avatar: require('../assets/temp_images/pp3.png'),
    lastSeen: 'Today, 11:20 AM',
    status: 'online',
    unreadCount: 0,
  },
  {
    id: '4',
    name: 'Fitness Buddy',
    avatar: require('../assets/temp_images/profile.png'),
    lastSeen: '3 days ago',
    status: 'away',
    unreadCount: 0,
  },
];

const generateInitialMessages = (contacts: Contact[]): Conversation[] => {
  return contacts.map(contact => ({
    contactId: contact.id,
    messages: [], // Start with empty messages
  }));
};

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [conversations, setConversations] = useState<Conversation[]>(
    generateInitialMessages(initialContacts)
  );
  const [activeContactId, setActiveContactId] = useState<string | null>(null);

  // Load conversations from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedConversations = await AsyncStorage.getItem('conversations');
        const storedContacts = await AsyncStorage.getItem('contacts');
        
        if (storedConversations) {
          setConversations(JSON.parse(storedConversations));
        }
        
        if (storedContacts) {
          setContacts(JSON.parse(storedContacts));
        }
      } catch (error) {
        console.error('Failed to load chat data:', error);
      }
    };
    
    loadData();
  }, []);

  // Save conversations to storage whenever they change
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('conversations', JSON.stringify(conversations));
        await AsyncStorage.setItem('contacts', JSON.stringify(contacts));
      } catch (error) {
        console.error('Failed to save chat data:', error);
      }
    };
    
    saveData();
  }, [conversations, contacts]);

  // Send a new message (text or image)
  const sendMessage = (content: string, receiverId: string, imageUri?: string) => {
    if (!content.trim() && !imageUri) return;
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      timestamp: Date.now(),
      senderId: 'currentUser',
      receiverId,
      read: true,
      ...(imageUri ? { imageUri } : {}),
    };
    
    // Find the conversation or create a new one
    const conversationIndex = conversations.findIndex(c => c.contactId === receiverId);
    
    if (conversationIndex !== -1) {
      // Update existing conversation
      const updatedConversations = [...conversations];
      updatedConversations[conversationIndex] = {
        ...updatedConversations[conversationIndex],
        messages: [...updatedConversations[conversationIndex].messages, newMessage],
      };
      setConversations(updatedConversations);
    } else {
      // Create new conversation
      setConversations([
        ...conversations,
        {
          contactId: receiverId,
          messages: [newMessage],
        },
      ]);
    }
  };

  // Get messages for a specific contact
  const getMessages = (contactId: string): Message[] => {
    const conversation = conversations.find(c => c.contactId === contactId);
    return conversation ? conversation.messages : [];
  };

  // Get unread message count for a contact
  const getUnreadCount = (contactId: string): number => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? contact.unreadCount : 0;
  };

  // Mark all messages from a contact as read
  const markAsRead = (contactId: string) => {
    // Update messages
    const conversationIndex = conversations.findIndex(c => c.contactId === contactId);
    if (conversationIndex !== -1) {
      const updatedConversations = [...conversations];
      updatedConversations[conversationIndex] = {
        ...updatedConversations[conversationIndex],
        messages: updatedConversations[conversationIndex].messages.map(msg => ({
          ...msg,
          read: true
        })),
      };
      setConversations(updatedConversations);
    }
    
    // Update contact unread count
    const updatedContacts = [...contacts];
    const contactIndex = updatedContacts.findIndex(c => c.id === contactId);
    if (contactIndex !== -1) {
      updatedContacts[contactIndex] = {
        ...updatedContacts[contactIndex],
        unreadCount: 0,
      };
      setContacts(updatedContacts);
    }
  };

  // Get total number of unread messages
  const getTotalUnread = (): number => {
    return contacts.reduce((total, contact) => total + contact.unreadCount, 0);
  };

  return (
    <ChatContext.Provider
      value={{
        contacts,
        conversations,
        activeContactId,
        setActiveContactId,
        sendMessage,
        getMessages,
        getUnreadCount,
        markAsRead,
        getTotalUnread,
      }}>
      {children}
    </ChatContext.Provider>
  );
}; 