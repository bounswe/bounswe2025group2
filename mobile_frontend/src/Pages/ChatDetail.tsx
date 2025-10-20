import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';

const ChatDetail = ({ route, navigation }: any) => {
  const { chatId } = route.params;
  const { colors } = useTheme();
  const { 
    messages, 
    isConnected, 
    sendMessage, 
    connectToChat, 
    disconnectFromChat,
    chats 
  } = useChat();
  const { isAuthenticated, currentUser } = useAuth();
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Find the current chat to get the other user's name
  const currentChat = chats.find(chat => chat.id === chatId);
  const otherUserName = currentChat?.other_user?.username || 'Unknown User';

  useEffect(() => {
    if (isAuthenticated && chatId) {
      connectToChat(chatId);
    }

    return () => {
      disconnectFromChat();
    };
  }, [chatId, isAuthenticated]);

  // Additional cleanup on component unmount
  useEffect(() => {
    return () => {
      disconnectFromChat();
    };
  }, []);

  // Auto-refresh when component comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isAuthenticated && chatId) {
        // Reconnect to ensure we have the latest messages
        disconnectFromChat();
        setTimeout(() => {
          connectToChat(chatId);
        }, 100);
      }
    });

    return unsubscribe;
  }, [navigation, isAuthenticated, chatId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (messageText.trim() && isConnected) {
      sendMessage(messageText.trim());
      setMessageText('');
    } else if (!isConnected) {
      Toast.show({
        type: 'error',
        text1: 'Connection Error',
        text2: 'Not connected to chat',
      });
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    // Check if this message is from the current user
    const isMyMessage = currentUser && item.sender === currentUser.username;
    const showTime = index === messages.length - 1 || 
      new Date(item.created).getTime() - new Date(messages[index + 1]?.created).getTime() > 300000; // 5 minutes

    return (
      <View style={[
        styles.messageContainer,
        { alignItems: isMyMessage ? 'flex-end' : 'flex-start' }
      ]}>
        <View
            style={[
              styles.messageBubble,
              {
                backgroundColor: isMyMessage ? colors.active : colors.navBar,
                maxWidth: '80%',
              },
            ]}
        >
          <CustomText
            style={[
              styles.messageText,
              { color: isMyMessage ? colors.userMessageText : colors.text }
            ]}
          >
            {item.body}
          </CustomText>
          {showTime && (
            <CustomText
              style={[
                styles.messageTime,
                { color: isMyMessage ? 'rgba(255,255,255,0.7)' : colors.subText }
              ]}
            >
              {formatMessageTime(item.created)}
            </CustomText>
          )}
        </View>
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <CustomText style={[styles.title, { color: colors.text }]}>
            Please log in to view chat
          </CustomText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: colors.navBar,
        borderBottomColor: colors.border 
      }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <CustomText style={[styles.backText, { color: colors.active }]}>
            ← Back
          </CustomText>
        </TouchableOpacity>
        <CustomText style={[styles.headerTitle, { color: colors.text }]}>
          {otherUserName}
        </CustomText>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CustomText style={[styles.emptyText, { color: colors.subText }]}>
                {isConnected ? 'No messages yet. Start the conversation!' : 'Connecting...'}
              </CustomText>
            </View>
          }
        />

        {/* Message Input */}
        <View style={[styles.inputContainer, { 
          backgroundColor: colors.navBar,
          borderTopColor: colors.border 
        }]}>
          <TextInput
            style={[styles.messageInput, { 
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border 
            }]}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor={colors.subText}
            multiline
            maxLength={1000}
          />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { 
              backgroundColor: messageText.trim() && isConnected ? colors.active : colors.border 
            }
          ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || !isConnected}
          >
            <CustomText style={[styles.sendButtonText, { color: colors.userMessageText }]}>Send</CustomText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  backText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    marginVertical: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChatDetail;
