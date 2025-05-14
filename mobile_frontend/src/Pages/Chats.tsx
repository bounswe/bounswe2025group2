import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
} from 'react-native';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { useChat, Message, Contact } from '../context/ChatContext';
import ChatListItem from '../components/ChatListItem';
import MessageBubble from '../components/MessageBubble';
import { useAuth } from '../context/AuthContext';

const WS_BASE = 'ws://10.0.2.2:8000/ws/chat/';

const Chats = () => {
  const { colors } = useTheme();
  const {
    chats,
    contacts,
    activeChatId,
    setActiveChatId,
    createChat,
    fetchChats,
    fetchContacts,
  } = useChat();
  const { getAuthHeader } = useAuth();
  const [inputMessage, setInputMessage] = useState('');
  const [showContacts, setShowContacts] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const flatListRef = useRef<FlatList | null>(null);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const activeChat = activeChatId ? chats.find(c => c.id === activeChatId) : undefined;

  // Fetch current user's username on mount
  useEffect(() => {
    const fetchCurrentUsername = async () => {
      try {
        const res = await fetch('http://10.0.2.2:8000/api/profile/', {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUsername(data.username || '');
        }
      } catch (e) {
        setCurrentUsername('');
      }
    };
    fetchCurrentUsername();
    fetchContacts();
    fetchChats();
  }, []);

  // WebSocket connection for active chat
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }
    // Open WebSocket connection
    const ws = new WebSocket(`${WS_BASE}${activeChatId}/`);
    wsRef.current = ws;
    ws.onopen = () => {
      // Connection established
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
          // Initial message list
          setMessages(data);
        } else if (data.message) {
          // New message received
          setMessages(prev => [...prev, data.message]);
        } else if (data.error) {
          // Handle error
        }
      } catch (e) {}
    };
    ws.onerror = (e) => {
      // Handle error
    };
    ws.onclose = () => {
      // Connection closed
    };
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [activeChatId]);

  // Send message via WebSocket
  const sendMessageWS = (body: string) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({ body }));
    }
  };

  // Only show contacts that are not the current user (by username)
  const filteredContacts = currentUsername
    ? contacts.filter(u => u.username !== currentUsername)
    : contacts;

  // Only show chats with at least one message
  const chatsWithMessages = chats.filter(c => c.last_message);

  // Show chat detail if either activeChatId or pendingUserId is set
  const showChatDetail = activeChatId || pendingUserId;
  const pendingUser = pendingUserId ? contacts.find(u => u.id === pendingUserId) : null;

  // Update handleSendMessage to use WebSocket
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    if (activeChat) {
      sendMessageWS(inputMessage.trim());
      setInputMessage('');
      await fetchChats();
      return;
    }
    if (pendingUserId && pendingUser) {
      const chat = await createChat(pendingUserId);
      if (chat) {
        setActiveChatId(chat.id);
        setPendingUserId(null);
        // Wait for WebSocket to connect, then send the message
        setTimeout(() => {
          sendMessageWS(inputMessage.trim());
          setInputMessage('');
        }, 500);
        await fetchChats();
      } else {
        setInputMessage('');
      }
      return;
    }
    setInputMessage('');
  };

  const handleStartChat = async (userId: number) => {
    try {
      // Check if a chat with this user already exists
      const existingChat = chats.find(
        c => c.other_user && c.other_user.id === userId
      );
      setShowContacts(false);
      if (existingChat) {
        setActiveChatId(existingChat.id);
        setPendingUserId(null);
        return;
      }
      // Otherwise, set pendingUserId and open the chat detail view
      setPendingUserId(userId);
      setActiveChatId(null); // No chat yet
    } catch (err) {
      console.error("Failed to create chat:", err);
    }
  };

  const renderContactItem = ({ item }: { item: Contact }) => {
    // Create a display name using available fields
    const displayName = item.first_name && item.last_name 
      ? `${item.first_name} ${item.last_name}` 
      : item.username || `User ${item.id}`;
    
    // Get initial for avatar
    const getInitial = () => {
      if (item.first_name) return item.first_name.charAt(0).toUpperCase();
      if (item.username) return item.username.charAt(0).toUpperCase();
      return '?';
    };
    
    return (
      <TouchableOpacity
        style={[styles.contactItem, { borderBottomColor: colors.border + '30' }]}
        onPress={() => handleStartChat(item.id)}
      >
        <View style={styles.contactCircle}>
          <CustomText style={styles.contactInitial}>
            {getInitial()}
          </CustomText>
        </View>
        <View style={styles.contactInfo}>
          <CustomText style={[styles.contactName, { color: colors.text }]}>
            {displayName}
          </CustomText>
          {item.username && item.first_name && (
            <CustomText style={[styles.contactUsername, { color: colors.subText }]}>
              @{item.username}
            </CustomText>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderContactsModal = () => (
    <Modal
      visible={showContacts}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setShowContacts(false)}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}> 
        <View style={[styles.modalHeader, { borderBottomColor: colors.border + '30' }]}> 
          <CustomText style={[styles.modalTitle, { color: colors.text }]}> 
            New Chat ({filteredContacts?.length || 0} users)
          </CustomText>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowContacts(false)}
          >
            <CustomText style={{ color: colors.text, fontSize: 16 }}>✕</CustomText>
          </TouchableOpacity>
        </View>
        <View style={styles.modalSubHeader}>
          <CustomText style={{ color: colors.subText }}>
            Select a user to start a conversation
          </CustomText>
        </View>
        {filteredContacts.length === 0 ? (
          <View style={styles.emptyListContainer}>
            <CustomText style={[styles.emptyListText, { color: colors.subText }]}> 
              No users found. Pull down to refresh.
            </CustomText>
            <TouchableOpacity 
              style={[styles.debugButton, {backgroundColor: colors.mentionText}]} 
              onPress={fetchContacts}
            >
              <CustomText style={{color: 'white'}}>Refresh</CustomText>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredContacts}
            keyExtractor={item => item.id?.toString() || Math.random().toString()}
            renderItem={renderContactItem}
            style={styles.contactsList}
            refreshing={false}
            onRefresh={fetchContacts}
          />
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderChatsList = () => (
    <View style={styles.chatsListContainer}>
      <View style={[styles.header, { borderBottomColor: colors.border + '30' }]}> 
        <CustomText style={[styles.headerTitle, { color: colors.text }]}> 
          Messages 
        </CustomText>
        <TouchableOpacity
          style={[styles.newChatButton, { backgroundColor: colors.mentionText }]}
          onPress={() => setShowContacts(true)}
        >
          <CustomText style={styles.newChatButtonText}>+</CustomText>
        </TouchableOpacity>
      </View>
      <FlatList
        data={chatsWithMessages}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <ChatListItem
            chat={item}
            onPress={setActiveChatId}
            isActive={activeChatId === item.id}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <CustomText style={[styles.emptyListText, { color: colors.subText }]}>
              No conversations yet. Tap + to start a new chat.
            </CustomText>
          </View>
        }
      />
      {renderContactsModal()}
    </View>
  );

  const renderEmptyChat = () => (
    <View style={styles.emptyChatContainer}>
      <CustomText style={[styles.emptyChatText, { color: colors.subText }]}> 
        Select a conversation to start chatting 
      </CustomText> 
    </View>
  );

  const renderChatDetail = () => {
    if (!showChatDetail) return renderEmptyChat();
    // If pendingUserId, show pending user info
    if (pendingUserId && pendingUser) {
      return (
        <KeyboardAvoidingView
          style={styles.chatDetailContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={[styles.chatHeader, { borderBottomColor: colors.border + '30' }]}> 
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => { setPendingUserId(null); setActiveChatId(null); }}
            >
              <View style={styles.chevronLeft} />
            </TouchableOpacity>
            <View style={styles.chatHeaderInfo}>
              <CustomText style={[styles.headerName, { color: colors.text }]}> 
                {pendingUser.first_name && pendingUser.last_name ? `${pendingUser.first_name} ${pendingUser.last_name}` : pendingUser.username}
              </CustomText>
            </View>
          </View>
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <CustomText style={{ color: colors.subText, textAlign: 'center', marginBottom: 16 }}>
              Start the conversation by sending a message.
            </CustomText>
          </View>
          <View style={[styles.inputContainer, { borderTopColor: colors.border + '30' }]}> 
            <TextInput
              style={[styles.input, { backgroundColor: colors.navBar, color: colors.text }]}
              placeholder="Type a message..."
              placeholderTextColor={colors.subText}
              value={inputMessage}
              onChangeText={setInputMessage}
              multiline
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              disabled={!inputMessage.trim()}
            >
              <View style={styles.blueCircle}>
                <View style={styles.triangle} />
              </View>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      );
    }
    // Otherwise, show the normal chat detail
    if (!activeChatId || !activeChat) return renderEmptyChat();
    return (
      <KeyboardAvoidingView
        style={styles.chatDetailContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.chatHeader, { borderBottomColor: colors.border + '30' }]}> 
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setActiveChatId(null)}
          >
            <View style={styles.chevronLeft} />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <CustomText style={[styles.headerName, { color: colors.text }]}> 
              {activeChat.other_user.username}
            </CustomText>
          </View>
        </View>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id.toString()}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isMine={item.sender === currentUsername}
            />
          )}
        />
        <View style={[styles.inputContainer, { borderTopColor: colors.border + '30' }]}> 
          <TextInput
            style={[styles.input, { backgroundColor: colors.navBar, color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.subText}
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={!inputMessage.trim()}
          >
            <View style={styles.blueCircle}>
              <View style={styles.triangle} />
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  // On mobile, show either chat list or chat detail based on selection
  const isMobile = true; // For mobile first approach

  return (
    <SafeAreaView style={styles.container}>
      {isMobile && !showChatDetail && renderChatsList()}
      {isMobile && showChatDetail && renderChatDetail()}
      {!isMobile && (
        <View style={styles.tabletContainer}>
          {renderChatsList()}
          {renderChatDetail()}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabletContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  chatsListContainer: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  newChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    marginTop: -2,
  },
  emptyListContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyChatText: {
    fontSize: 16,
    textAlign: 'center',
  },
  chatDetailContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  chevronLeft: {
    width: 18,
    height: 18,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#333',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
    marginLeft: 8,
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
  },
  blueCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 0,
    borderBottomWidth: 12,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'white',
    borderRightColor: 'transparent',
    borderBottomColor: 'white',
    marginLeft: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  contactCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  contactName: {
    fontSize: 16,
  },
  debugButton: {
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  modalSubHeader: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  contactUsername: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default Chats;
