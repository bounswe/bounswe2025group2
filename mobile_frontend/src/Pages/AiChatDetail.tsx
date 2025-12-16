import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { useAiChat } from '../context/AiChatContext';

const AiChatDetail = ({ route, navigation }: any) => {
  const { chatId } = route.params;
  const { colors } = useTheme();
  const {
    aiMessages,
    isLoadingMessages,
    isSendingMessage,
    sendAiMessage,
    selectAiChat,
  } = useAiChat();
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const initializeChat = async () => {
      await selectAiChat(chatId);
    };
    initializeChat();
  }, [chatId, selectAiChat]);

  useEffect(() => {
    if (aiMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [aiMessages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || isSendingMessage) return;
    await sendAiMessage(messageText.trim());
    setMessageText('');
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isUserMessage = item.sender === 'user';
    return (
      <View
        style={[
          styles.messageContainer,
          { alignItems: isUserMessage ? 'flex-end' : 'flex-start' },
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isUserMessage ? colors.active : colors.navBar,
            },
          ]}
        >
          <CustomText
            style={[
              styles.messageText,
              {
                color: isUserMessage
                  ? colors.userMessageText
                  : colors.text,
              },
            ]}
          >
            {item.message}
          </CustomText>
          <CustomText
            style={[
              styles.messageTime,
              {
                color: isUserMessage
                  ? 'rgba(255,255,255,0.7)'
                  : colors.subText,
              },
            ]}
          >
            {new Date(item.created_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </CustomText>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.navBar,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <CustomText style={[styles.backText, { color: colors.active }]}>
            ← Back
          </CustomText>
        </TouchableOpacity>
        <CustomText style={[styles.headerTitle, { color: colors.text }]}>
          AI Fitness Tutor
        </CustomText>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={aiMessages}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {isLoadingMessages ? (
                <ActivityIndicator size="small" color={colors.active} />
              ) : (
                <CustomText
                  style={[styles.emptyText, { color: colors.subText }]}
                >
                  Ask me anything about your fitness journey!
                </CustomText>
              )}
            </View>
          }
        />

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.navBar,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.messageInput,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Ask the AI tutor..."
            placeholderTextColor={colors.subText}
            multiline
            maxLength={1000}
            editable={!isSendingMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  messageText.trim() && !isSendingMessage
                    ? colors.active
                    : colors.border,
              },
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || isSendingMessage}
          >
            {isSendingMessage ? (
              <ActivityIndicator size="small" color={colors.userMessageText} />
            ) : (
              <CustomText
                style={[
                  styles.sendButtonText,
                  { color: colors.userMessageText },
                ]}
              >
                Send
              </CustomText>
            )}
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
    maxWidth: '80%',
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
    maxHeight: 120,
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

export default AiChatDetail;


