/**
 * @format
 * Unit tests for Chat-related components and contexts
 * Tests cover: ChatContext, MessageBubble, ChatListItem components
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { ChatProvider, useChat, Message, Chat, Contact } from '../context/ChatContext';
import MessageBubble from '../components/MessageBubble';
import ChatListItem from '../components/ChatListItem';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import Cookies from '@react-native-cookies/cookies';
import { webSocketService } from '../services/WebSocketService';
import { API_CHAT_URL, API_URL } from '../constants/api';

// Mock dependencies
jest.mock('../context/AuthContext');
jest.mock('../context/ThemeContext');
jest.mock('axios');
jest.mock('@react-native-cookies/cookies');
jest.mock('../services/WebSocketService', () => ({
  webSocketService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    sendMessage: jest.fn(),
    isConnected: jest.fn(() => false),
  },
}));

describe('ChatContext', () => {
  const mockAuthHeader = { Authorization: 'Bearer test-token' };
  const mockToken = 'test-token';
  const mockColors = {
    text: '#000000',
    subText: '#666666',
    mentionText: '#007AFF',
    navBar: '#F5F5F5',
    border: '#CCCCCC',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      token: mockToken,
      getAuthHeader: jest.fn(() => mockAuthHeader),
    });

    (useTheme as jest.Mock).mockReturnValue({
      colors: mockColors,
    });

    (Cookies.get as jest.Mock).mockResolvedValue({
      csrftoken: { value: 'test-csrf-token' },
      sessionid: { value: 'test-session-id' },
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('ChatProvider - Initialization', () => {
    test('provides default context values', () => {
      const TestComponent = () => {
        const chat = useChat();
        expect(chat.contacts).toEqual([]);
        expect(chat.chats).toEqual([]);
        expect(chat.activeChatId).toBeNull();
        expect(chat.messages).toEqual([]);
        expect(chat.isConnected).toBe(false);
        return null;
      };

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );
    });

    test('fetches contacts and chats when token is available', async () => {
      const mockContacts: Contact[] = [
        {
          id: 1,
          username: 'user1',
          first_name: 'John',
          last_name: 'Doe',
        },
        {
          id: 2,
          username: 'user2',
          first_name: 'Jane',
          last_name: 'Smith',
        },
      ];

      const mockChats: Chat[] = [
        {
          id: 1,
          participants: [mockContacts[0]],
          other_user: mockContacts[0],
          created: '2025-01-01T10:00:00Z',
          last_message: null,
          unread_count: 0,
        },
      ];

      (axios.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockContacts })
        .mockResolvedValueOnce({ data: mockChats });

      const TestComponent = () => {
        const chat = useChat();
        React.useEffect(() => {
          if (chat.contacts.length > 0) {
            expect(chat.contacts).toEqual(mockContacts);
          }
        }, [chat.contacts]);
        return null;
      };

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          `${API_CHAT_URL}get-users/`,
          expect.objectContaining({
            headers: expect.objectContaining(mockAuthHeader),
          })
        );
        expect(axios.get).toHaveBeenCalledWith(
          `${API_CHAT_URL}get-chats/`,
          expect.objectContaining({
            headers: expect.objectContaining(mockAuthHeader),
          })
        );
      });
    });
  });

  describe('ChatProvider - fetchContacts', () => {
    test('successfully fetches contacts', async () => {
      const mockContacts: Contact[] = [
        {
          id: 1,
          username: 'user1',
          first_name: 'John',
        },
      ];

      (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockContacts });

      const TestComponent = () => {
        const { fetchContacts, contacts } = useChat();
        React.useEffect(() => {
          fetchContacts();
        }, [fetchContacts]);

        return null;
      };

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          `${API_CHAT_URL}get-users/`,
          expect.any(Object)
        );
      });
    });

    test('handles fetch contacts error gracefully', async () => {
      (axios.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const TestComponent = () => {
        const { fetchContacts, contacts } = useChat();
        React.useEffect(() => {
          fetchContacts();
        }, [fetchContacts]);

        return null;
      };

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
    });
  });

  describe('ChatProvider - fetchChats', () => {
    test('successfully fetches chats', async () => {
      const mockChats: Chat[] = [
        {
          id: 1,
          participants: [],
          other_user: { id: 1, username: 'user1' },
          created: '2025-01-01T10:00:00Z',
          last_message: null,
          unread_count: 0,
        },
      ];

      (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockChats });

      const TestComponent = () => {
        const { fetchChats } = useChat();
        React.useEffect(() => {
          fetchChats();
        }, [fetchChats]);

        return null;
      };

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          `${API_CHAT_URL}get-chats/`,
          expect.any(Object)
        );
      });
    });

    test('handles fetch chats error gracefully', async () => {
      (axios.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const TestComponent = () => {
        const { fetchChats } = useChat();
        React.useEffect(() => {
          fetchChats();
        }, [fetchChats]);

        return null;
      };

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
    });
  });

  describe('ChatProvider - createChat', () => {
    test('successfully creates a chat', async () => {
      const mockChat: Chat = {
        id: 1,
        participants: [],
        other_user: { id: 2, username: 'user2' },
        created: '2025-01-01T10:00:00Z',
        last_message: null,
        unread_count: 0,
      };

      (axios.post as jest.Mock).mockResolvedValueOnce({ data: mockChat });
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      const TestComponent = () => {
        const { createChat } = useChat();
        React.useEffect(() => {
          createChat(2);
        }, [createChat]);

        return null;
      };

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          `${API_CHAT_URL}create-chat/`,
          { user_id: 2 },
          expect.any(Object)
        );
      });
    });

    test('handles create chat error gracefully', async () => {
      (axios.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const TestComponent = () => {
        const { createChat } = useChat();
        React.useEffect(() => {
          createChat(2);
        }, [createChat]);

        return null;
      };

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
    });
  });

  describe('ChatProvider - WebSocket operations', () => {
    test('connects to chat via WebSocket', async () => {
      const TestComponent = () => {
        const { connectToChat } = useChat();
        React.useEffect(() => {
          connectToChat(1);
        }, [connectToChat]);

        return null;
      };

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      await waitFor(() => {
        expect(webSocketService.connect).toHaveBeenCalledWith(
          1,
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
          expect.any(Function)
        );
      });
    });

    test('disconnects from chat', () => {
      const TestComponent = () => {
        const { disconnectFromChat } = useChat();
        React.useEffect(() => {
          disconnectFromChat();
        }, [disconnectFromChat]);

        return null;
      };

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      expect(webSocketService.disconnect).toHaveBeenCalled();
    });

    test('sends message via WebSocket', () => {
      (webSocketService.isConnected as jest.Mock).mockReturnValue(true);

      const TestComponent = () => {
        const { sendMessage } = useChat();
        React.useEffect(() => {
          sendMessage('Hello, world!');
        }, [sendMessage]);

        return null;
      };

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      expect(webSocketService.sendMessage).toHaveBeenCalledWith('Hello, world!');
    });

    test('does not send empty message', () => {
      const TestComponent = () => {
        const { sendMessage } = useChat();
        React.useEffect(() => {
          sendMessage('   ');
        }, [sendMessage]);

        return null;
      };

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      expect(webSocketService.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('ChatProvider - State cleanup', () => {
    test('clears state when token becomes null', () => {
      (useAuth as jest.Mock).mockReturnValue({
        token: null,
        getAuthHeader: jest.fn(() => mockAuthHeader),
      });

      const TestComponent = () => {
        const chat = useChat();
        expect(chat.contacts).toEqual([]);
        expect(chat.chats).toEqual([]);
        expect(chat.activeChatId).toBeNull();
        expect(chat.messages).toEqual([]);
        expect(chat.isConnected).toBe(false);
        return null;
      };

      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      );

      expect(webSocketService.disconnect).toHaveBeenCalled();
    });
  });
});

describe('MessageBubble Component', () => {
  const mockColors = {
    text: '#000000',
    subText: '#666666',
    mentionText: '#007AFF',
    navBar: '#F5F5F5',
  };

  const mockMessage: Message = {
    id: 1,
    sender: 'user1',
    body: 'Hello, this is a test message',
    created: '2025-01-01T10:30:00Z',
    is_read: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({
      colors: mockColors,
    });
  });

  test('renders message bubble correctly', () => {
    const { getByText } = render(<MessageBubble message={mockMessage} isMine={false} />);

    expect(getByText('Hello, this is a test message')).toBeTruthy();
  });

  test('renders my message with correct styling', () => {
    const { getByText } = render(<MessageBubble message={mockMessage} isMine={true} />);

    expect(getByText('Hello, this is a test message')).toBeTruthy();
  });

  test('formats time correctly', () => {
    const { getByText } = render(<MessageBubble message={mockMessage} isMine={false} />);

    // The time should be formatted and displayed
    // Format: "10:30 AM" or similar
    const timeElement = getByText(/\d{1,2}:\d{2}\s(AM|PM)/);
    expect(timeElement).toBeTruthy();
  });

  test('handles message without body', () => {
    const messageWithoutBody: Message = {
      ...mockMessage,
      body: '',
    };

    const { queryByText } = render(
      <MessageBubble message={messageWithoutBody} isMine={false} />
    );

    expect(queryByText('Hello, this is a test message')).toBeNull();
  });
});

describe('ChatListItem Component', () => {
  const mockColors = {
    text: '#000000',
    subText: '#666666',
    mentionText: '#007AFF',
    border: '#CCCCCC',
  };

  const mockChat: Chat = {
    id: 1,
    participants: [],
    other_user: {
      id: 2,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
    },
    created: '2025-01-01T10:00:00Z',
    last_message: {
      id: 1,
      sender: 'testuser',
      body: 'This is a test message',
      created: '2025-01-01T10:30:00Z',
      is_read: false,
    },
    unread_count: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({
      colors: mockColors,
    });
  });

  test('renders chat list item correctly', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <ChatListItem chat={mockChat} onPress={mockOnPress} isActive={false} />
    );

    expect(getByText('testuser')).toBeTruthy();
    expect(getByText('This is a test message')).toBeTruthy();
  });

  test('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <ChatListItem chat={mockChat} onPress={mockOnPress} isActive={false} />
    );

    fireEvent.press(getByText('testuser'));
    expect(mockOnPress).toHaveBeenCalledWith(1);
  });

  test('displays unread count badge', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <ChatListItem chat={mockChat} onPress={mockOnPress} isActive={false} />
    );

    expect(getByText('2')).toBeTruthy();
  });

  test('does not display badge when unread_count is 0', () => {
    const chatWithoutUnread: Chat = {
      ...mockChat,
      unread_count: 0,
    };

    const mockOnPress = jest.fn();
    const { queryByText } = render(
      <ChatListItem chat={chatWithoutUnread} onPress={mockOnPress} isActive={false} />
    );

    expect(queryByText('2')).toBeNull();
  });

  test('handles chat without last message', () => {
    const chatWithoutMessage: Chat = {
      ...mockChat,
      last_message: null,
    };

    const mockOnPress = jest.fn();
    const { getByText } = render(
      <ChatListItem chat={chatWithoutMessage} onPress={mockOnPress} isActive={false} />
    );

    expect(getByText('testuser')).toBeTruthy();
  });
});

