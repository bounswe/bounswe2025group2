import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Modal,
  ActivityIndicator,
} from 'react-native';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';
import ChallengeCard from '@components/ChallengeCard';
import Cookies from '@react-native-cookies/cookies';
import { API_URL } from '@constants/api';
import { CommonActions } from '@react-navigation/native';

// Challenge selector modal component
interface ChallengeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (challengeId: number) => void;
  colors: any;
  getAuthHeader: () => { Authorization: string } | {};
}

type ChallengeListItem = {
  id: number;
  title: string;
  challenge_type?: string;
  difficulty_level?: string;
  target_value?: number;
  unit?: string;
  start_date?: string;
  end_date?: string;
};

const ChallengeSelectorModal: React.FC<ChallengeSelectorModalProps> = ({
  visible,
  onClose,
  onSelect,
  colors,
  getAuthHeader,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allChallenges, setAllChallenges] = useState<ChallengeListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const cookieOrigin = API_URL.replace(/\/api\/?$/, '');

  // Fetch all challenges when modal opens
  const fetchAllChallenges = useCallback(async () => {
    console.log('[ChallengeSelectorModal] ========== FETCHING CHALLENGES ==========');
    setLoading(true);
    try {
      const cookies = await Cookies.get(cookieOrigin);
      const csrf = cookies?.csrftoken?.value;
      console.log('[ChallengeSelectorModal] Cookie origin:', cookieOrigin);
      console.log('[ChallengeSelectorModal] CSRF token exists:', !!csrf);
      
      // Build search URL - fetch all active challenges
      const params = new URLSearchParams();
      params.append('is_active', 'true');
      
      const url = `${API_URL}challenges/search/?${params.toString()}`;
      console.log('[ChallengeSelectorModal] Fetching from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          ...(csrf ? { 'X-CSRFToken': csrf } : {}),
          'Referer': cookieOrigin,
        },
        credentials: 'include',
      });

      console.log('[ChallengeSelectorModal] Response status:', response.status);
      console.log('[ChallengeSelectorModal] Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ChallengeSelectorModal] Failed to fetch challenges:', response.status, errorText);
        throw new Error(`Failed to fetch challenges: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ChallengeSelectorModal] Response data type:', Array.isArray(data) ? 'array' : typeof data);
      console.log('[ChallengeSelectorModal] Response data keys:', Object.keys(data));
      
      const challengesList: ChallengeListItem[] = Array.isArray(data) ? data : (data.results || []);
      console.log('[ChallengeSelectorModal] Challenges count:', challengesList.length);
      console.log('[ChallengeSelectorModal] Challenge IDs:', challengesList.map(c => c.id));
      console.log('[ChallengeSelectorModal] Challenge titles:', challengesList.map(c => c.title));
      
      setAllChallenges(challengesList);
      console.log('[ChallengeSelectorModal] Challenges loaded successfully');
    } catch (error) {
      console.error('[ChallengeSelectorModal] ERROR fetching challenges:', error);
      Alert.alert('Error', `Failed to load challenges: ${error}`);
      setAllChallenges([]);
    } finally {
      setLoading(false);
      console.log('[ChallengeSelectorModal] Loading complete');
    }
  }, [getAuthHeader, cookieOrigin]);

  // Fetch challenges when modal opens
  useEffect(() => {
    if (visible) {
      fetchAllChallenges();
      setSearchQuery(''); // Reset search when modal opens
    }
  }, [visible, fetchAllChallenges]);

  // Filter challenges client-side based on search query
  const challenges = useMemo(() => {
    if (!searchQuery.trim()) {
      return allChallenges;
    }
    
    const lowerQuery = searchQuery.toLowerCase().trim();
    return allChallenges.filter(challenge => {
      const titleMatch = challenge.title?.toLowerCase().includes(lowerQuery);
      const typeMatch = challenge.challenge_type?.toLowerCase().includes(lowerQuery);
      return titleMatch || typeMatch;
    });
  }, [allChallenges, searchQuery]);

  const handleSelect = (challengeId: number) => {
    console.log('[ChallengeSelectorModal] ========== CHALLENGE SELECTED IN MODAL ==========');
    console.log('[ChallengeSelectorModal] Challenge ID:', challengeId);
    console.log('[ChallengeSelectorModal] Challenge ID type:', typeof challengeId);
    console.log('[ChallengeSelectorModal] Is valid:', !isNaN(challengeId) && challengeId > 0);
    onSelect(challengeId);
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <CustomText style={[styles.modalButton, { color: colors.active }]}>
              Cancel
            </CustomText>
          </TouchableOpacity>
          <CustomText style={[styles.modalTitle, { color: colors.text }]}>
            Send Challenge
          </CustomText>
          <View style={{ width: 60 }} />
        </View>

        <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
          <TextInput
            style={[styles.searchInput, { 
              backgroundColor: colors.navBar, 
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="Search challenges (e.g., 'push', 'yoga')..."
            placeholderTextColor={colors.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.active} />
          </View>
        ) : (
          <FlatList
            data={challenges}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.challengeItem, { 
                  backgroundColor: colors.navBar,
                  borderColor: colors.border 
                }]}
                onPress={() => handleSelect(item.id)}
              >
                <View style={styles.challengeItemContent}>
                  <CustomText style={[styles.challengeTitle, { color: colors.text }]}>
                    {item.title}
                  </CustomText>
                  {item.challenge_type && (
                    <CustomText style={[styles.challengeType, { color: colors.subText }]}>
                      {item.challenge_type}
                    </CustomText>
                  )}
                  {item.difficulty_level && (
                    <CustomText style={[styles.challengeDifficulty, { color: colors.subText }]}>
                      {item.difficulty_level}
                    </CustomText>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <CustomText style={[styles.emptyText, { color: colors.subText }]}>
                  {searchQuery.trim() 
                    ? `No challenges found matching "${searchQuery}"`
                    : 'No challenges available'}
                </CustomText>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
};

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
  const { isAuthenticated, currentUser, getAuthHeader } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [showChallengeModal, setShowChallengeModal] = useState(false);
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
      console.log('[ChatDetail] Messages updated, count:', messages.length);
      console.log('[ChatDetail] Last message:', messages[messages.length - 1]);
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

  // Helper function to check if message is a challenge
  const isChallengeMessage = (body: string): number | null => {
    console.log('[ChatDetail] Checking if message is challenge:', body);
    console.log('[ChatDetail] Message body type:', typeof body);
    console.log('[ChatDetail] Message body length:', body?.length);
    
    if (!body || typeof body !== 'string') {
      console.log('[ChatDetail] Invalid message body, not a challenge');
      return null;
    }
    
    // Format: CHALLENGE:{id}
    const match = body.match(/^CHALLENGE:(\d+)$/);
    console.log('[ChatDetail] Regex match result:', match);
    
    if (match) {
      const challengeId = parseInt(match[1], 10);
      console.log('[ChatDetail] Parsed challenge ID:', challengeId);
      console.log('[ChatDetail] Is valid ID:', !isNaN(challengeId) && challengeId > 0);
      
      if (isNaN(challengeId) || challengeId <= 0) {
        console.error('[ChatDetail] ERROR: Invalid challenge ID parsed:', match[1], '->', challengeId);
        Toast.show({
          type: 'error',
          text1: 'Invalid Challenge ID',
          text2: `Could not parse challenge ID from: ${body}`,
        });
        return null;
      }
      console.log('[ChatDetail] Valid challenge ID found:', challengeId);
      return challengeId;
    }
    
    console.log('[ChatDetail] Message is not a challenge message');
    return null;
  };

  // Handle challenge selection
  const handleChallengeSelect = (challengeId: number) => {
    console.log('[ChatDetail] ========== CHALLENGE SELECTED ==========');
    console.log('[ChatDetail] Challenge ID:', challengeId);
    console.log('[ChatDetail] Challenge ID type:', typeof challengeId);
    console.log('[ChatDetail] Is valid number:', !isNaN(challengeId) && challengeId > 0);
    console.log('[ChatDetail] WebSocket connected:', isConnected);
    console.log('[ChatDetail] Chat ID:', chatId);
    
    if (!challengeId || isNaN(challengeId) || challengeId <= 0) {
      const errorMsg = `Invalid challenge ID: ${challengeId}`;
      console.error('[ChatDetail] ERROR:', errorMsg);
      Toast.show({
        type: 'error',
        text1: 'Invalid Challenge',
        text2: errorMsg,
      });
      return;
    }

    if (isConnected) {
      // Send challenge as special message format
      const messageBody = `CHALLENGE:${challengeId}`;
      console.log('[ChatDetail] Sending challenge message:', messageBody);
      console.log('[ChatDetail] Message format check:', /^CHALLENGE:\d+$/.test(messageBody));
      
      try {
        sendMessage(messageBody);
        console.log('[ChatDetail] Message sent successfully via sendMessage');
        Toast.show({
          type: 'success',
          text1: 'Challenge Sent',
          text2: `Challenge #${challengeId} sent! Check console for details.`,
        });
      } catch (error) {
        console.error('[ChatDetail] ERROR sending message:', error);
        Toast.show({
          type: 'error',
          text1: 'Send Failed',
          text2: `Failed to send challenge: ${error}`,
        });
      }
    } else {
      const errorMsg = 'WebSocket not connected';
      console.error('[ChatDetail] ERROR:', errorMsg);
      Toast.show({
        type: 'error',
        text1: 'Connection Error',
        text2: errorMsg,
      });
    }
  };

  // Handle join challenge from chat
  const handleJoinChallenge = useCallback((challengeId: number) => {
    // This will be handled by ChallengeCard's join functionality
    // Show success message and stay in chat
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'You have joined the challenge!',
    });
  }, []);

  // Handle view challenge details
  const handleViewChallengeDetails = useCallback((challengeId: number) => {
    console.log('[ChatDetail] ========== NAVIGATING TO CHALLENGE DETAILS ==========');
    console.log('[ChatDetail] Challenge ID:', challengeId);
    
    try {
      // Use CommonActions to navigate to Main tab, then to Challenges screen
      // This works even when navigating from a Stack screen to a nested Tab screen
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Main',
          params: {
            screen: 'Challenges',
            params: { challengeId },
          },
        })
      );
      
      console.log('[ChatDetail] Navigation dispatched successfully');
    } catch (error: any) {
      console.error('[ChatDetail] Navigation error:', error);
      console.error('[ChatDetail] Error message:', error?.message);
      
      // Fallback: try simple navigate
      try {
        navigation.navigate('Main', {
          screen: 'Challenges',
          params: { challengeId },
        });
        console.log('[ChatDetail] Fallback navigation succeeded');
      } catch (fallbackError: any) {
        console.error('[ChatDetail] Fallback navigation also failed:', fallbackError);
        Toast.show({
          type: 'error',
          text1: 'Navigation Error',
          text2: 'Could not navigate. Please go back and open Challenges tab manually.',
        });
      }
    }
  }, [navigation]);

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    // Check if this message is from the current user
    const isMyMessage = currentUser && item.sender === currentUser.username;
    const showTime = index === messages.length - 1 || 
      new Date(item.created).getTime() - new Date(messages[index + 1]?.created).getTime() > 300000; // 5 minutes

    // Check if this is a challenge message
    const challengeId = isChallengeMessage(item.body);

    if (challengeId) {
      console.log('[ChatDetail] ========== RENDERING CHALLENGE CARD ==========');
      console.log('[ChatDetail] Challenge ID:', challengeId);
      console.log('[ChatDetail] Message body:', item.body);
      console.log('[ChatDetail] Message ID:', item.id);
      console.log('[ChatDetail] Sender:', item.sender);
      console.log('[ChatDetail] Is my message:', isMyMessage);
      console.log('[ChatDetail] API_URL:', API_URL);
      
      // Render challenge card
      return (
        <View style={[
          styles.messageContainer,
          { alignItems: isMyMessage ? 'flex-end' : 'flex-start' }
        ]}>
          <View style={{ maxWidth: '85%' }}>
            <ChallengeCard
              key={`challenge-${challengeId}-${item.id}`}
              challengeId={challengeId}
              baseUrl={API_URL}
              onViewDetails={() => {
                console.log('[ChatDetail] View details clicked for challenge:', challengeId);
                handleViewChallengeDetails(challengeId);
              }}
              onMembershipChange={(id, joined) => {
                console.log('[ChatDetail] Membership change:', { id, joined });
                if (joined) {
                  handleJoinChallenge(id);
                }
              }}
            />
            {showTime && (
              <CustomText
                style={[
                  styles.messageTime,
                  { 
                    color: colors.subText,
                    textAlign: isMyMessage ? 'right' : 'left',
                    marginTop: 4,
                    fontSize: 12
                  }
                ]}
              >
                {formatMessageTime(item.created)}
              </CustomText>
            )}
          </View>
        </View>
      );
    }

    // Regular text message
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
        <TouchableOpacity
          style={styles.headerTitleContainer}
          onPress={() => {
            if (currentChat?.other_user?.username) {
              navigation.navigate('Profile', { 
                username: currentChat.other_user.username 
              });
            }
          }}
        >
          <CustomText style={[styles.headerTitle, { color: colors.text }]}>
            {otherUserName}
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sendChallengeButton}
          onPress={() => setShowChallengeModal(true)}
        >
          <CustomText style={[styles.sendChallengeText, { color: colors.active }]}>
            Send Challenge
          </CustomText>
        </TouchableOpacity>
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

      {/* Challenge Selector Modal */}
      <ChallengeSelectorModal
        visible={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        onSelect={handleChallengeSelect}
        colors={colors}
        getAuthHeader={getAuthHeader}
      />
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
  headerTitleContainer: {
    flex: 1,
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
  sendChallengeButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  sendChallengeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  challengeItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  challengeItemContent: {
    gap: 4,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  challengeType: {
    fontSize: 14,
  },
  challengeDifficulty: {
    fontSize: 12,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ChatDetail;
