import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  useIsAuthenticated,
  useChatUsers,
  useChats,
  useCreateChat,
  useAiChats,
  useCreateAiChat,
  useAiChatHistory,
  useSendAiMessage
} from '../../lib';
import { Layout, UserAvatar, ReportButton } from '../../components';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import type { Chat, Message, AiTutorChat, AiMessage } from '../../lib/types/api';
import { Plus, Send, MessageSquare, Bot, Users, X, Trophy } from 'lucide-react';
import { renderMessageWithChallengeLinks } from '../../lib/utils/chatLinkParser';
import ChallengePickerDialog from './ChallengePickerDialog';
import './chat_page.css';

// Helper function to get WebSocket URL
const getWebSocketUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  return baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
};

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};


const ChatPage = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useIsAuthenticated();
  const navigate = useNavigate();

  // Data hooks
  const { data: users = [], isLoading: usersLoading, error: usersError } = useChatUsers();
  const { data: chats = [], isLoading: chatsLoading, error: chatsError, refetch: refetchChats } = useChats();
  const { data: aiChats = [], error: aiChatsError, refetch: refetchAiChats } = useAiChats();

  // Mutation hooks
  const createChatMutation = useCreateChat();
  const createAiChatMutation = useCreateAiChat();
  const sendAiMessageMutation = useSendAiMessage();

  // State for regular chat
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showConnectionError, setShowConnectionError] = useState(false);

  // State for AI chat
  const [selectedAiChat, setSelectedAiChat] = useState<AiTutorChat | null>(null);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiMessageInput, setAiMessageInput] = useState('');
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState(false);

  // UI state
  const [showAiChat, setShowAiChat] = useState(false);
  const [showChallengePicker, setShowChallengePicker] = useState(false);

  // Refs
  const websocket = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // AI chat history hook
  const { data: aiChatHistory, error: aiChatHistoryError } = useAiChatHistory(selectedAiChat?.id || null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // All useEffect hooks must be called before any early returns
  useEffect(() => {
    scrollToBottom();
  }, [messages, aiMessages]);

  // Handle connection error display with delay
  useEffect(() => {
    if (!connected && selectedChat) {
      // Wait 2 seconds before showing the error to allow for reconnection
      const timer = setTimeout(() => {
        setShowConnectionError(true);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setShowConnectionError(false);
    }
  }, [connected, selectedChat]);

  // WebSocket connection effect for regular chat
  useEffect(() => {
    if (!selectedChat) return;

    const chatId = selectedChat.id;
    const wsUrl = `${getWebSocketUrl()}/ws/chat/${chatId}/`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to chat server');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.message) {
        const message: Message = {
          id: data.message.id,
          sender: data.message.sender,
          body: data.message.body,
          created: data.message.created,
          is_read: data.message.is_read
        };
        setMessages((prev) => [...prev, message]);

        // Update chat list to reflect new messages
        if (message.sender !== user?.username) {
          refetchChats();
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
  }, [selectedChat, user?.username]);

  // Update AI messages when chat history changes
  useEffect(() => {
    try {
      if (aiChatHistory && selectedAiChat && !aiChatHistoryError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userMessages = (aiChatHistory as any).user_messages || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const aiResponses = (aiChatHistory as any).ai_responses || [];

        const combinedMessages = [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...userMessages.map((msg: any) => ({
            id: msg.id,
            message: msg.message,
            created_at: msg.created_at,
            sender: 'user'
          })),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...aiResponses.map((resp: any) => ({
            id: resp.id,
            message: resp.response,
            created_at: resp.created_at,
            sender: 'ai'
          }))
        ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        setAiMessages(combinedMessages);
      } else if (selectedAiChat && !aiChatHistory) {
        // Clear messages if we have a selected chat but no history yet (loading state)
        setAiMessages([]);
      }
    } catch (error) {
      console.error('Error processing AI chat history:', error);
      setAiMessages([]);
    }
  }, [aiChatHistory, selectedAiChat, aiChatHistoryError]);

  // Handle regular message send
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !websocket.current) return;

    const messageData = { body: messageInput };
    websocket.current.send(JSON.stringify(messageData));
    setMessageInput('');
  };

  // Handle AI message send
  const sendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMessageInput.trim() || !selectedAiChat || isLoadingAiResponse) return;

    setIsLoadingAiResponse(true);

    try {
      await sendAiMessageMutation.mutateAsync({
        chatId: selectedAiChat.id,
        message: aiMessageInput
      });
      setAiMessageInput('');
    } catch (error) {
      console.error('Error sending AI message:', error);
    } finally {
      setIsLoadingAiResponse(false);
    }
  };

  // Handle create chat
  const handleCreateChat = async (userId: number) => {
    try {
      const newChat = await createChatMutation.mutateAsync(userId);
      setSelectedChat(newChat);
      setShowUserList(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(error.message || 'Failed to create chat');
    }
  };

  // Handle create AI chat
  const handleCreateAiChat = async () => {
    try {
      const newChat = await createAiChatMutation.mutateAsync();
      setSelectedAiChat(newChat);
      setAiMessages([]); // Clear AI messages for new chat
      setShowAiChat(true);
      refetchAiChats();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(error.message || 'Failed to create AI chat');
    }
  };

  // Handle challenge selection from picker
  const handleSelectChallenge = (challengeId: number, challengeTitle: string) => {
    const challengeLink = `challenge://${challengeId}`;
    const linkText = `Check out "${challengeTitle}" - ${challengeLink}`;

    if (showAiChat) {
      setAiMessageInput((prev) => prev ? `${prev} ${linkText}` : linkText);
    } else {
      setMessageInput((prev) => prev ? `${prev} ${linkText}` : linkText);
    }

    setShowChallengePicker(false);
  };

  // Handle select AI chat
  const selectAiChat = (chat: AiTutorChat) => {
    setSelectedAiChat(chat);
    setSelectedChat(null); // Deselect regular chat
    setAiMessages([]); // Clear AI messages when switching chats
    setShowAiChat(true);
  };

  // Authentication checks - AFTER all hooks
  if (authLoading) {
    return <div className="chat-page-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  // Show error state if there are critical API errors
  if (usersError || chatsError || aiChatsError) {
    console.warn('Chat API errors:', { usersError, chatsError, aiChatsError });
    // Don't crash the app, just log the errors and continue
  }

  return (
    <Layout>
      <div className="chat-page-content">
        {/* Chat Type Toggle */}
        <div className="chat-toggle">
          <Button
            variant={!showAiChat ? "default" : "outline"}
            onClick={() => setShowAiChat(false)}
            className="toggle-btn"
          >
            <Users className="w-4 h-4 mr-2" />
            User Chats
          </Button>
          <Button
            variant={showAiChat ? "default" : "outline"}
            onClick={() => setShowAiChat(true)}
            className={`toggle-btn ${showAiChat ? 'ai-active' : ''}`}
          >
            <Bot className="w-4 h-4 mr-2" />
            AI Fitness Tutor
          </Button>
        </div>

        <div className="chat-container">
          {!showAiChat ? (
            // Regular user-to-user chat UI
            <div className="chat-layout">
              {/* Chat List Sidebar */}
              <div className="chat-sidebar">
                <Card className="chat-list-card">
                  <CardHeader className="chat-list-header">
                    <div className="chat-list-title-section">
                      <CardTitle className="chat-list-title">Direct Messages</CardTitle>
                      <Button
                        onClick={() => setShowUserList(!showUserList)}
                        size="sm"
                        className="add-chat-btn"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="chat-list-content">
                    {/* User selection popup */}
                    {showUserList && (
                      <div className="user-selection-popup">
                        <div className="user-selection-header">
                          <h3 className="user-selection-title">New Message</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowUserList(false)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="user-list">
                          {usersLoading ? (
                            <div className="user-list-loading">Loading users...</div>
                          ) : users.length === 0 ? (
                            <div className="user-list-empty">No users found</div>
                          ) : (
                            users.map((user) => (
                              <div
                                key={user.id}
                                onClick={() => handleCreateChat(user.id)}
                                className="user-item"
                              >
                                <UserAvatar user={user} className="user-avatar" size="md" />
                                <span className="user-name">{user.username}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Chat list */}
                    <div className="chat-list">
                      {chatsLoading ? (
                        <div className="chat-list-loading">Loading chats...</div>
                      ) : chats.length === 0 ? (
                        <div className="chat-list-empty">
                          <MessageSquare className="w-12 h-12 mb-2" />
                          <div>No messages yet</div>
                          <Button
                            onClick={() => setShowUserList(true)}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            Start a new conversation
                          </Button>
                        </div>
                      ) : (
                        chats.map((chat) => {
                          if (!chat || !chat.other_user) return null;

                          return (
                            <div
                              key={chat.id}
                              onClick={() => setSelectedChat(chat)}
                              className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                            >
                              <UserAvatar user={chat.other_user} className="chat-item-avatar" size="md" />
                              <div className="chat-item-content">
                                <div className="chat-item-header">
                                  <h3 className="chat-item-name">
                                    {chat.other_user?.username || 'Unknown User'}
                                  </h3>
                                  {chat.last_message && (
                                    <span className="chat-item-time">
                                      {formatDate(chat.last_message.created)}
                                    </span>
                                  )}
                                </div>
                                <div className="chat-item-message">
                                  <p className="chat-item-last-message">
                                    {chat.last_message ? chat.last_message.body : 'No messages yet'}
                                  </p>
                                  {chat.unread_count > 0 && (
                                    <span className="chat-item-unread-badge">
                                      {chat.unread_count}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chat Area */}
              <div className="chat-main">
                <Card className="chat-main-card">
                  {selectedChat ? (
                    <>
                      {/* Chat header */}
                      <CardHeader className="chat-header">
                        <div className="chat-header-content">
                          <Link to={`/profile/other/${selectedChat.other_user?.username}`}>
                            <UserAvatar user={selectedChat.other_user} className="chat-header-avatar" size="lg" />
                          </Link>
                          <div className="chat-header-info">
                            <h2 className="chat-header-name">
                              <Link to={`/profile/other/${selectedChat.other_user?.username}`} className="text-inherit hover:underline">
                                {selectedChat.other_user?.username || 'Unknown User'}
                              </Link>
                            </h2>
                            <div className="chat-header-status">
                              <span className={`status-indicator ${connected ? 'online' : 'offline'}`}></span>
                              {connected ? 'Online' : 'Offline'}
                            </div>
                          </div>
                          {/* Add Report Button for specific chat */}
                          <ReportButton
                            contentType="CHAT"
                            objectId={selectedChat.id}
                            contentTitle={`Chat with ${selectedChat.other_user?.username}`}
                            className="chat-header-report-button"
                          />
                        </div>
                      </CardHeader>

                      {/* Messages */}
                      <CardContent className="chat-messages">
                        {messages.length === 0 ? (
                          <div className="chat-empty">
                            <MessageSquare className="w-12 h-12 mb-2" />
                            <div>No messages yet</div>
                            <div className="text-sm mt-1">Send a message to start the conversation</div>
                          </div>
                        ) : (
                          messages.map((message) => (
                            <div
                              key={message.id}
                              className={`message ${message.sender === user?.username ? 'sent' : 'received'}`}
                            >
                              <div className="message-content">
                                <div className="message-text">{renderMessageWithChallengeLinks(message.body)}</div>
                                <div className="message-time">
                                  {formatDate(message.created)}
                                  {message.sender === user?.username && (
                                    <span className="message-status">
                                      {message.is_read ? '✓✓' : '✓'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </CardContent>

                      {/* Message input */}
                      <div className="chat-input-container">
                        <form onSubmit={sendMessage} className="chat-input-form">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setShowChallengePicker(true)}
                            disabled={!connected}
                            className="challenge-picker-btn"
                            title="Share a challenge"
                          >
                            <Trophy className="w-4 h-4" />
                          </Button>
                          <input
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder="Type a message..."
                            className="chat-input"
                            disabled={!connected}
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={!connected || !messageInput.trim()}
                            className="chat-send-btn"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="chat-empty-state">
                      <MessageSquare className="w-16 h-16 mb-4" />
                      <div>Select a conversation or start a new one</div>
                      <Button
                        onClick={() => setShowUserList(true)}
                        className="mt-4"
                      >
                        New Message
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          ) : (
            // AI Tutor chat UI
            <div className="chat-layout">
              {/* AI Chat List Sidebar */}
              <div className="chat-sidebar">
                <Card className="chat-list-card">
                  <CardHeader className="chat-list-header">
                    <div className="chat-list-title-section">
                      <CardTitle className="chat-list-title">AI Fitness Tutor</CardTitle>
                      <Button
                        onClick={handleCreateAiChat}
                        size="sm"
                        className="add-chat-btn ai-btn"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="chat-list-content">
                    <div className="chat-list">
                      {aiChats.length === 0 ? (
                        <div className="chat-list-empty">
                          <Bot className="w-12 h-12 mb-2" />
                          <div>No AI chats yet</div>
                          <Button
                            onClick={handleCreateAiChat}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            Start a new AI conversation
                          </Button>
                        </div>
                      ) : (
                        aiChats.map((chat) => (
                          <div
                            key={chat.id}
                            onClick={() => selectAiChat(chat)}
                            className={`chat-item ai-chat-item ${selectedAiChat?.id === chat.id ? 'active' : ''}`}
                          >
                            <div className="chat-item-avatar ai-avatar">
                              <Bot className="w-5 h-5" />
                            </div>
                            <div className="chat-item-content">
                              <div className="chat-item-header">
                                <h3 className="chat-item-name">AI Fitness Tutor</h3>
                                <span className="chat-item-time">
                                  {formatDate(chat.created_at)}
                                </span>
                              </div>
                              <div className="chat-item-message">
                                <p className="chat-item-last-message">
                                  Chat #{chat.id}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Chat Area */}
              <div className="chat-main">
                <Card className="chat-main-card">
                  {selectedAiChat ? (
                    <>
                      {/* AI Chat header */}
                      <CardHeader className="chat-header">
                        <div className="chat-header-content">
                          <div className="chat-header-avatar ai-avatar">
                            <Bot className="w-6 h-6" />
                          </div>
                          <div className="chat-header-info">
                            <h2 className="chat-header-name">AI Fitness Tutor</h2>
                            <div className="chat-header-status">
                              <span className="status-indicator online"></span>
                              Always Online
                            </div>
                          </div>
                          {/* Add Report Button for AI chat */}
                          <ReportButton
                            contentType="CHAT"
                            objectId={selectedAiChat.id}
                            contentTitle="AI Fitness Tutor Chat"
                            className="chat-header-report-button"
                          />
                        </div>
                      </CardHeader>

                      {/* AI Messages */}
                      <CardContent className="chat-messages">
                        {aiMessages.length === 0 ? (
                          <div className="chat-empty">
                            <Bot className="w-12 h-12 mb-2" />
                            <div>No messages yet</div>
                            <div className="text-sm mt-1">Ask the AI Fitness Tutor a question</div>
                          </div>
                        ) : (
                          aiMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`message ${message.sender === 'user' ? 'sent' : 'received ai-message'}`}
                            >
                              <div className="message-content">
                                <div className="message-text">{renderMessageWithChallengeLinks(message.message)}</div>
                                <div className="message-time">
                                  {formatDate(message.created_at)}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        {isLoadingAiResponse && (
                          <div className="message received ai-message">
                            <div className="message-content">
                              <div className="ai-typing">
                                <div className="typing-indicator">
                                  <span></span>
                                  <span></span>
                                  <span></span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </CardContent>

                      {/* AI Message input */}
                      <div className="chat-input-container">
                        <form onSubmit={sendAiMessage} className="chat-input-form">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setShowChallengePicker(true)}
                            disabled={isLoadingAiResponse}
                            className="challenge-picker-btn ai-btn"
                            title="Share a challenge"
                          >
                            <Trophy className="w-4 h-4" />
                          </Button>
                          <input
                            type="text"
                            value={aiMessageInput}
                            onChange={(e) => setAiMessageInput(e.target.value)}
                            placeholder="Ask the AI Fitness Tutor..."
                            className="chat-input"
                            disabled={isLoadingAiResponse}
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={isLoadingAiResponse || !aiMessageInput.trim()}
                            className="chat-send-btn ai-btn"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="chat-empty-state">
                      <Bot className="w-16 h-16 mb-4" />
                      <div>Select an AI chat or start a new one</div>
                      <Button
                        onClick={handleCreateAiChat}
                        className="mt-4 ai-btn"
                      >
                        New AI Chat
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Connection status for regular chat */}
        {showConnectionError && !showAiChat && (
          <div className="connection-error">
            Disconnected from chat server. Please refresh or re-select the chat.
          </div>
        )}

        {/* Challenge Picker Dialog */}
        <ChallengePickerDialog
          isOpen={showChallengePicker}
          onClose={() => setShowChallengePicker(false)}
          onSelectChallenge={handleSelectChallenge}
        />
      </div>
    </Layout>
  );
};

export default ChatPage;