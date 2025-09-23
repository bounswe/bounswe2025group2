import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import Sidebar from '@/components/layout/sidebar';
import MobileHeader from '@/components/layout/mobile-header';
import MobileNavigation from '@/components/layout/mobile-navigation';
import { API_BASE_URL, WEB_SOCKET_URL } from "@/lib/queryClient.ts";
import { useTheme } from '@/theme/ThemeContext';

interface User {
  id: number;
  username: string;
}

interface Message {
  id: number;
  sender: string;
  body: string;
  created: string;
  is_read: boolean;
}

interface Chat {
  id: number;
  participants: User[];
  other_user: User;
  created: string;
  last_message: {
    body: string;
    created: string;
    sender: string;
  } | null;
  unread_count: number;
}

// New interfaces for AI Tutor
interface AiTutorChat {
  id: number;
  chat_id: string;
  created_at: string;
  is_ai: boolean;
}

interface AiMessage {
  id: number;
  message: string;
  created_at: string;
  sender: string;
}

function getCsrfToken() {
  const name = 'csrftoken';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const lastPart = parts.pop();
    if (lastPart) {
      const value = lastPart.split(';').shift();
      return value ?? '';
    }
  }
  return '';
}

// Create an API client with consistent headers
const apiClient = {
  fetch: (url: string, options: RequestInit = {}) => {
    const csrfToken = getCsrfToken();
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
        ...options.headers
      }
    };

    // Merge default options with provided options
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {})
      }
    };

    return fetch(url, mergedOptions);
  },

  get: (url: string) => {
    return apiClient.fetch(url);
  },

  post: (url: string, data: any) => {
    return apiClient.fetch(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export default function ChatPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const websocket = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // AI Tutor states
  const [aiChats, setAiChats] = useState<AiTutorChat[]>([]);
  const [selectedAiChat, setSelectedAiChat] = useState<AiTutorChat | null>(null);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiMessageInput, setAiMessageInput] = useState('');
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch users and chats on load
  useEffect(() => {
    // Fetch users, using the API BASE URL
    apiClient.get(`${API_BASE_URL}/chat/get-users/`)
      .then((res) => res.json())
      .then(setUsers)
      .catch((err) => console.error('Error fetching users:', err));

    // Fetch chats
    fetchChats();
    
    // Fetch AI chats
    fetchAiChats();
  }, []);

  const fetchChats = () => {
    apiClient.get(`${API_BASE_URL}/chat/get-chats/`)
      .then((res) => {
        if (!res.ok) {
          // If we get an error response, handle it
          if (res.status === 401) {
            console.error('Authentication required. Please log in.');
            // You might want to redirect to login here
          }
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Filter out any chats that don't have other_user properly defined
        const validChats = data.filter((chat: Chat) => chat && chat.other_user && chat.other_user.username);
        setChats(validChats);
      })
      .catch((err) => console.error('Error fetching chats:', err));
  };

  // WebSocket connection effect
  useEffect(() => {
    if (!selectedChat) return;

    const chatId = selectedChat.id;
    const ws = new WebSocket(`${WEB_SOCKET_URL}/ws/chat/${chatId}/`);

    ws.onopen = () => {
      console.log('Connected to chat server');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.message) {
        const message = {
          id: data.message.id,
          sender: data.message.sender,
          body: data.message.body,
          created: data.message.created,
          is_read: data.message.is_read
        };
        setMessages((prev) => [...prev, message]);

        // Update chat list to reflect new messages
        if (message.sender !== user?.username) {
          fetchChats();
        }
      } else {
        console.error('Unexpected message format:', data);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from chat server');
      setConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.current = ws;

    return () => {
      ws.close();
      setConnected(false);
      setMessages([]); // Clear messages when switching chats
    };
  }, [selectedChat]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !websocket.current) return;
    const messageData = { body: messageInput };
    websocket.current.send(JSON.stringify(messageData));
    setMessageInput('');
  };

  const handleCreateChat = async (userId: number) => {
    try {
      const res = await apiClient.post(`${API_BASE_URL}/chat/create-chat/`, { user_id: userId });

      if (!res.ok) {
        const err = await res.json();
        alert(Object.values(err)[0] || 'Failed to create chat');
        return;
      }

      const newChat: Chat = await res.json();
      setChats((prev) => {
        const exists = prev.some(chat => chat.id === newChat.id);
        if (exists) {
          return prev;
        }
        return [...prev, newChat];
      });
      setSelectedChat(newChat); // Auto-select newly created chat
      setShowUserList(false); // Hide user list after selection
    } catch (err) {
      console.error('Error creating chat:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper function to safely get the first letter of username
  const getInitial = (user?: User) => {
    if (!user || !user.username) return '?';
    return user.username.charAt(0).toUpperCase();
  };

  // AI Tutor functions
  const fetchAiChats = () => {
    apiClient.get(`${API_BASE_URL}/api/ai-tutor/`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            console.error('Authentication required. Please log in.');
          }
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setAiChats(data);
      })
      .catch((err) => console.error('Error fetching AI chats:', err));
  };

  const createAiChat = async () => {
    try {
      const res = await apiClient.post(`${API_BASE_URL}/api/ai-tutor/`, {});

      if (!res.ok) {
        const err = await res.json();
        alert(Object.values(err)[0] || 'Failed to create AI chat');
        return;
      }

      const newChat = await res.json();
      setAiChats((prev) => [...prev, newChat]);
      setSelectedAiChat(newChat);
      setShowAiChat(true);
      fetchAiChatHistory(newChat.id);
    } catch (err) {
      console.error('Error creating AI chat:', err);
    }
  };

  const fetchAiChatHistory = (chatId: number) => {
    apiClient.get(`${API_BASE_URL}/api/ai-tutor/${chatId}/chat_history/`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Combine user messages and AI responses into a single chronological array
        const userMessages = data.user_messages || [];
        const aiResponses = data.ai_responses || [];
        
        const combinedMessages = [
          ...userMessages.map((msg: any) => ({
            id: msg.id,
            message: msg.message,
            created_at: msg.created_at,
            sender: 'user'
          })),
          ...aiResponses.map((resp: any) => ({
            id: resp.id,
            message: resp.response,
            created_at: resp.created_at,
            sender: 'ai'
          }))
        ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        setAiMessages(combinedMessages);
      })
      .catch((err) => console.error('Error fetching AI chat history:', err));
  };

  const sendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMessageInput.trim() || !selectedAiChat || isLoadingAiResponse) return;
    
    setIsLoadingAiResponse(true);
    
    // Optimistically add user message to the UI
    const tempUserMessage: AiMessage = {
      id: Date.now(), // Temporary ID
      message: aiMessageInput,
      created_at: new Date().toISOString(),
      sender: 'user'
    };
    
    setAiMessages(prev => [...prev, tempUserMessage]);
    setAiMessageInput('');
    
    try {
      const res = await apiClient.post(
        `${API_BASE_URL}/api/ai-tutor/${selectedAiChat.id}/send_message/`,
        { message: aiMessageInput }
      );
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Update messages with the actual response
      setAiMessages(prev => [
        ...prev.filter(msg => msg.id !== tempUserMessage.id), // Remove temp message
        {
          id: data.user_message.id,
          message: data.user_message.message,
          created_at: data.user_message.created_at,
          sender: 'user'
        },
        {
          id: data.ai_response.id,
          message: data.ai_response.response,
          created_at: data.ai_response.created_at,
          sender: 'ai'
        }
      ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
      
    } catch (err) {
      console.error('Error sending message to AI:', err);
      // Remove the optimistic message if there was an error
      setAiMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
    } finally {
      setIsLoadingAiResponse(false);
    }
  };

  const selectAiChat = (chat: AiTutorChat) => {
    setSelectedAiChat(chat);
    setSelectedChat(null); // Deselect regular chat
    setAiMessages([]); // Clear messages before fetching new ones
    fetchAiChatHistory(chat.id);
    setShowAiChat(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <div className="flex mt-14">
        <Sidebar activeTab="chat" />
        <main className="flex-1 md:ml-56 p-4 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="mb-4 flex justify-center">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => setShowAiChat(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg ${!showAiChat 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                >
                  User Chats
                </button>
                <button
                  type="button"
                  onClick={() => setShowAiChat(true)}
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg ${showAiChat 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                >
                  AI Fitness Tutor
                </button>
              </div>
            </div>

            {!showAiChat ? (
              // Regular user-to-user chat UI
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sidebar with chats */}
                <div className="md:col-span-1">
                  <div className="bg-white rounded-lg shadow-md p-4 h-[80vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold">Direct Messages</h2>
                      <button
                        onClick={() => setShowUserList(!showUserList)}
                        className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>

                    {/* User selection popup */}
                    {showUserList && (
                      <div className="bg-white rounded-lg shadow-lg p-4 absolute z-10 left-20 md:left-64 top-32 w-80">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold">New Message</h3>
                          <button
                            onClick={() => setShowUserList(false)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l-7 8a1 1 0 001.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {users.length === 0 ? (
                            <div className="text-gray-500 text-center py-4">No users found</div>
                          ) : (
                            users.map((user) => (
                              <div
                                key={user.id}
                                onClick={() => handleCreateChat(user.id)}
                                className="p-2 hover:bg-gray-100 rounded cursor-pointer flex items-center"
                              >
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 mr-2">
                                  {getInitial(user)}
                                </div>
                                <span>{user.username}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Chat list */}
                    <div className="flex-1 overflow-y-auto">
                      {chats.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <div className="text-4xl mb-2">💬</div>
                            <div>No messages yet</div>
                            <button
                              onClick={() => setShowUserList(true)}
                              className="mt-2 text-blue-500 hover:text-blue-700"
                            >
                              Start a new conversation
                            </button>
                          </div>
                        </div>
                      ) : (
                        chats.map((chat) => {
                          // Add a safety check for each chat object
                          if (!chat || !chat.other_user) {
                            console.error("Invalid chat object encountered:", chat);
                            return null;
                          }

                          return (
                            <div
                              key={chat.id}
                              onClick={() => setSelectedChat(chat)}
                              className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                                selectedChat?.id === chat.id ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-center mb-1">
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 mr-3">
                                  {getInitial(chat.other_user)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-center">
                                    <h3 className="font-semibold">{chat.other_user?.username || 'Unknown User'}</h3>
                                    {chat.last_message && (
                                      <span className="text-xs text-gray-500">
                                        {formatDate(chat.last_message.created)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center">
                                    <p className="text-sm text-gray-600 truncate max-w-[150px]">
                                      {chat.last_message ? chat.last_message.body : 'No messages yet'}
                                    </p>
                                    {chat.unread_count > 0 && (
                                      <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                        {chat.unread_count}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Chat area */}
                <div className="md:col-span-2">
                  <div className="bg-white rounded-lg shadow-md h-[80vh] flex flex-col">
                    {selectedChat ? (
                      <>
                        {/* Chat header */}
                        <div className="p-4 border-b flex items-center">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 mr-3">
                            {getInitial(selectedChat.other_user)}
                          </div>
                          <div>
                            <h2 className="font-semibold">{selectedChat.other_user?.username || 'Unknown User'}</h2>
                            <div className="text-xs text-gray-500">
                              {connected ? (
                                <span className="flex items-center">
                                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                  Online
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-1"></span>
                                  Offline
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4">
                          {messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                              <div className="text-center">
                                <div className="text-4xl mb-2">💬</div>
                                <div>No messages yet</div>
                                <div className="text-sm mt-1">Send a message to start the conversation</div>
                              </div>
                            </div>
                          ) : (
                            messages.map((message) => (
                              <div
                                key={message.id}
                                className={`mb-4 ${
                                  message.sender === user?.username ? 'text-right' : 'text-left'
                                }`}
                              >
                                <div
                                  className={`inline-block rounded-lg px-4 py-2 max-w-[70%] ${
                                    message.sender === user?.username
                                      ? 'bg-[#990000] text-white'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  <div className="text-base">{message.body}</div>
                                  <div className="text-xs mt-1 opacity-75 flex items-center justify-end gap-1">
                                    {formatDate(message.created)}
                                    {message.sender === user?.username && (
                                      <span>
                                        {message.is_read ? (
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        ) : (
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                          </svg>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Message input */}
                        <form onSubmit={sendMessage} className="p-4 border-t">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              placeholder="Type a message..."
                              className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              disabled={!connected}
                            />
                            <button
                              type="submit"
                              className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                              disabled={!connected || !messageInput.trim()}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                              </svg>
                            </button>
                          </div>
                        </form>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <div className="text-4xl mb-2">👋</div>
                          <div>Select a conversation or start a new one</div>
                          <button
                            onClick={() => setShowUserList(true)}
                            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                          >
                            New Message
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // AI Tutor chat UI
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sidebar with AI chats */}
                <div className="md:col-span-1">
                  <div className="bg-white rounded-lg shadow-md p-4 h-[80vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold">AI Fitness Tutor</h2>
                      <button
                        onClick={createAiChat}
                        className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>

                    {/* AI Chat list */}
                    <div className="flex-1 overflow-y-auto">
                      {aiChats.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <div className="text-4xl mb-2">🤖</div>
                            <div>No AI chats yet</div>
                            <button
                              onClick={createAiChat}
                              className="mt-2 text-green-500 hover:text-green-700"
                            >
                              Start a new AI conversation
                            </button>
                          </div>
                        </div>
                      ) : (
                        aiChats.map((chat) => (
                          <div
                            key={chat.id}
                            onClick={() => selectAiChat(chat)}
                            className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${selectedAiChat?.id === chat.id ? 'bg-green-50' : ''}`}
                          >
                            <div className="flex items-center mb-1">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">
                                🤖
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center">
                                  <h3 className="font-semibold">AI Fitness Tutor</h3>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(chat.created_at)}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <p className="text-sm text-gray-600 truncate max-w-[150px]">
                                    Chat #{chat.id}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Chat area */}
                <div className="md:col-span-2">
                  <div className="bg-white rounded-lg shadow-md h-[80vh] flex flex-col">
                    {selectedAiChat ? (
                      <>
                        {/* AI Chat header */}
                        <div className="p-4 border-b flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">
                            🤖
                          </div>
                          <div>
                            <h2 className="font-semibold">AI Fitness Tutor</h2>
                            <div className="text-xs text-green-500">
                              <span className="flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                Always Online
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* AI Messages */}
                        <div className="flex-1 overflow-y-auto p-4">
                          {aiMessages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                              <div className="text-center">
                                <div className="text-4xl mb-2">🤖</div>
                                <div>No messages yet</div>
                                <div className="text-sm mt-1">Ask the AI Fitness Tutor a question</div>
                              </div>
                            </div>
                          ) : (
                            aiMessages.map((message) => (
                              <div
                                key={message.id}
                                className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
                              >
                                <div
                                  className={`inline-block rounded-lg px-4 py-2 max-w-[70%] ${message.sender === 'user' ? 'bg-[#990000] text-white' : 'bg-green-100 text-gray-800'}`}
                                >
                                  <div className="text-base">{message.message}</div>
                                  <div className="text-xs mt-1 opacity-75 text-right">
                                    {formatDate(message.created_at)}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                          {isLoadingAiResponse && (
                            <div className="text-left mb-4">
                              <div className="inline-block rounded-lg px-4 py-2 bg-green-100 text-gray-800">
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-75 mr-1"></div>
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-150"></div>
                                </div>
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* AI Message input */}
                        <form onSubmit={sendAiMessage} className="p-4 border-t">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={aiMessageInput}
                              onChange={(e) => setAiMessageInput(e.target.value)}
                              placeholder="Ask the AI Fitness Tutor..."
                              className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              disabled={isLoadingAiResponse}
                            />
                            <button
                              type="submit"
                              className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                              disabled={isLoadingAiResponse || !aiMessageInput.trim()}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                              </svg>
                            </button>
                          </div>
                        </form>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🤖</div>
                          <div>Select an AI chat or start a new one</div>
                          <button
                            onClick={createAiChat}
                            className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200"
                          >
                            New AI Chat
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedChat && !connected && !showAiChat && (
              <div className="text-red-500 text-center mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                Disconnected from chat server. Please refresh or re-select the chat.
              </div>
            )}
          </div>
        </main>
      </div>
      <MobileNavigation activeTab="chat" />
    </div>
  );
}