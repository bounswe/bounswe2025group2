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
import { EXERCISES, Exercise } from './Exercises';

// Challenge selector modal component
interface ChallengeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (challengeId: number, challengeTitle: string) => void;  // Updated to include challengeTitle
  colors: any;
  getAuthHeader: () => { Authorization: string } | {};
}

// Exercise selector modal component
interface ExerciseSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exerciseId: number, exerciseName: string) => void;
  colors: any;
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

  const handleSelect = (challengeId: number, challengeTitle: string) => {  // Updated to accept challengeTitle
    console.log('[ChallengeSelectorModal] ========== CHALLENGE SELECTED IN MODAL ==========');
    console.log('[ChallengeSelectorModal] Challenge ID:', challengeId);
    console.log('[ChallengeSelectorModal] Challenge Title:', challengeTitle);
    console.log('[ChallengeSelectorModal] Challenge ID type:', typeof challengeId);
    console.log('[ChallengeSelectorModal] Is valid:', !isNaN(challengeId) && challengeId > 0);
    onSelect(challengeId, challengeTitle);  // Pass both parameters
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
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
                onPress={() => handleSelect(item.id, item.title)}  // Pass both id and title
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
      </SafeAreaView>
    </Modal>
  );
};

const ExerciseSelectorModal: React.FC<ExerciseSelectorModalProps> = ({
  visible,
  onClose,
  onSelect,
  colors,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter exercises based on search query
  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) {
      return EXERCISES;
    }
    
    const lowerQuery = searchQuery.toLowerCase().trim();
    return EXERCISES.filter((exercise: Exercise) => {
      const nameMatch = exercise.name.toLowerCase().includes(lowerQuery);
      const descriptionMatch = exercise.description.toLowerCase().includes(lowerQuery);
      const muscleMatch = exercise.muscleGroups.some((mg: string) => 
        mg.toLowerCase().includes(lowerQuery)
      );
      const difficultyMatch = exercise.difficulty.toLowerCase().includes(lowerQuery);
      const equipmentMatch = exercise.equipment?.toLowerCase().includes(lowerQuery);
      
      return nameMatch || descriptionMatch || muscleMatch || difficultyMatch || equipmentMatch;
    });
  }, [searchQuery]);

  const handleSelect = (exerciseId: number, exerciseName: string) => {
    onSelect(exerciseId, exerciseName);
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <CustomText style={[styles.modalButton, { color: colors.active }]}>
              Cancel
            </CustomText>
          </TouchableOpacity>
          <CustomText style={[styles.modalTitle, { color: colors.text }]}>
            Send Exercise
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
            placeholder="Search exercises (e.g., 'push', 'squat', 'cardio')..."
            placeholderTextColor={colors.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.exerciseItem, { 
                backgroundColor: colors.navBar,
                borderColor: colors.border 
              }]}
              onPress={() => handleSelect(item.id, item.name)}
            >
              <View style={styles.exerciseItemContent}>
                <CustomText style={[styles.exerciseTitle, { color: colors.text }]}>
                  {item.name}
                </CustomText>
                <CustomText 
                  style={[styles.exerciseDescription, { color: colors.subText }]}
                  numberOfLines={2}
                >
                  {item.description}
                </CustomText>
                <View style={styles.exerciseMeta}>
                  <View style={[styles.exerciseBadge, { backgroundColor: colors.border }]}>
                    <CustomText style={[styles.exerciseBadgeText, { color: colors.subText }]}>
                      {item.difficulty}
                    </CustomText>
                  </View>
                  {item.muscleGroups.slice(0, 2).map((muscle, index) => (
                    <View 
                      key={index}
                      style={[styles.exerciseBadge, { backgroundColor: colors.border }]}
                    >
                      <CustomText style={[styles.exerciseBadgeText, { color: colors.subText }]}>
                        {muscle}
                      </CustomText>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CustomText style={[styles.emptyText, { color: colors.subText }]}>
                {searchQuery.trim() 
                  ? `No exercises found matching "${searchQuery}"`
                  : 'No exercises available'}
              </CustomText>
            </View>
          }
        />
      </SafeAreaView>
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
    chats,
    contacts,
    fetchContacts 
  } = useChat();
  const { isAuthenticated, currentUser, getAuthHeader } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<Array<{id: number, username: string}>>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const flatListRef = useRef<FlatList>(null);

  // Find the current chat to get the other user's name
  const currentChat = chats.find(chat => chat.id === chatId);
  const otherUserName = currentChat?.other_user?.username || 'Unknown User';

  useEffect(() => {
    if (isAuthenticated && chatId) {
      connectToChat(chatId);
      fetchContacts(); // Fetch contacts for mention autocomplete
    }

    return () => {
      disconnectFromChat();
    };
  }, [chatId, isAuthenticated, connectToChat, fetchContacts]);

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

  // Handle mention autocomplete
  const handleMessageTextChange = (text: string) => {
    setMessageText(text);
    
    // Check if user is typing a mention (starts with @)
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      // Check if there's a space after @ or if it's at the end
      const afterAt = text.substring(lastAtIndex + 1);
      const spaceIndex = afterAt.indexOf(' ');
      
      if (spaceIndex === -1) {
        // No space found, user is still typing the username
        const query = afterAt.toLowerCase();
        setMentionQuery(query);
        setMentionStartIndex(lastAtIndex);
        
        // Filter contacts based on query
        const filtered = contacts
          .filter(contact => 
            contact.username.toLowerCase().startsWith(query) &&
            contact.username !== currentUser?.username
          )
          .slice(0, 5)
          .map(contact => ({ id: contact.id, username: contact.username }));
        
        setMentionSuggestions(filtered);
        setShowMentionSuggestions(filtered.length > 0);
      } else {
        // Space found, mention is complete
        setShowMentionSuggestions(false);
      }
    } else {
      // No @ found, hide suggestions
      setShowMentionSuggestions(false);
    }
  };

  // Handle selecting a mention from suggestions
  const handleSelectMention = (username: string) => {
    if (mentionStartIndex !== -1) {
      const beforeMention = messageText.substring(0, mentionStartIndex);
      const afterMention = messageText.substring(mentionStartIndex + 1 + mentionQuery.length);
      const newText = `${beforeMention}@${username}${afterMention}`;
      setMessageText(newText);
      setShowMentionSuggestions(false);
      setMentionQuery('');
      setMentionStartIndex(-1);
    }
  };

  // Parse mentions in message text
  const parseMessageWithMentions = (text: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts: Array<{ type: 'text' | 'mention'; content: string; username?: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }

      // Add mention
      const username = match[1];
      parts.push({
        type: 'mention',
        content: match[0],
        username: username
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }

    // If no mentions found, return the whole text as one part
    if (parts.length === 0) {
      parts.push({ type: 'text', content: text });
    }

    return parts;
  };

  const handleSendMessage = () => {
    if (messageText.trim() && isConnected) {
      sendMessage(messageText.trim());
      setMessageText('');
      setShowMentionSuggestions(false);
      setMentionQuery('');
      setMentionStartIndex(-1);
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

  // Helper function to check if message is an exercise
  const isExerciseMessage = (body: string): number | null => {
    if (!body || typeof body !== 'string') {
      return null;
    }
    
    // Format: exercise://{id} (can appear in text like "Check out 'Name' - exercise://123")
    const exerciseMatch = body.match(/exercise:\/\/(\d+)/);
    if (exerciseMatch) {
      const exerciseId = parseInt(exerciseMatch[1], 10);
      if (!isNaN(exerciseId) && exerciseId > 0) {
        return exerciseId;
      }
    }
    
    return null;
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
    
    // New format: challenge://{id} (can appear in text like "Check out 'Title' - challenge://123")
    const newFormatMatch = body.match(/challenge:\/\/(\d+)/);
    if (newFormatMatch) {
      const challengeId = parseInt(newFormatMatch[1], 10);
      console.log('[ChatDetail] Parsed challenge ID from new format:', challengeId);
      
      if (isNaN(challengeId) || challengeId <= 0) {
        console.error('[ChatDetail] ERROR: Invalid challenge ID parsed:', newFormatMatch[1], '->', challengeId);
        return null;
      }
      console.log('[ChatDetail] Valid challenge ID found (new format):', challengeId);
      return challengeId;
    }
    
    // Old format: CHALLENGE:{id} (for backward compatibility)
    const oldFormatMatch = body.match(/^CHALLENGE:(\d+)$/);
    console.log('[ChatDetail] Regex match result (old format):', oldFormatMatch);
    
    if (oldFormatMatch) {
      const challengeId = parseInt(oldFormatMatch[1], 10);
      console.log('[ChatDetail] Parsed challenge ID from old format:', challengeId);
      console.log('[ChatDetail] Is valid ID:', !isNaN(challengeId) && challengeId > 0);
      
      if (isNaN(challengeId) || challengeId <= 0) {
        console.error('[ChatDetail] ERROR: Invalid challenge ID parsed:', oldFormatMatch[1], '->', challengeId);
        return null;
      }
      console.log('[ChatDetail] Valid challenge ID found (old format):', challengeId);
      return challengeId;
    }
    
    console.log('[ChatDetail] Message is not a challenge message');
    return null;
  };

  // Handle exercise selection
  const handleExerciseSelect = (exerciseId: number, exerciseName: string) => {
    console.log('[ChatDetail] ========== EXERCISE SELECTED ==========');
    console.log('[ChatDetail] Exercise ID:', exerciseId);
    console.log('[ChatDetail] Exercise Name:', exerciseName);
    
    if (!exerciseId || isNaN(exerciseId) || exerciseId <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Exercise',
        text2: `Invalid exercise ID: ${exerciseId}`,
      });
      return;
    }

    if (isConnected) {
      const exerciseLink = `exercise://${exerciseId}`;
      const messageBody = `Check out "${exerciseName}" - ${exerciseLink}`;
      console.log('[ChatDetail] Sending exercise message:', messageBody);
      
      try {
        sendMessage(messageBody);
        Toast.show({
          type: 'success',
          text1: 'Exercise Sent',
          text2: `Exercise "${exerciseName}" sent!`,
        });
      } catch (error) {
        console.error('[ChatDetail] ERROR sending exercise message:', error);
        Toast.show({
          type: 'error',
          text1: 'Send Failed',
          text2: `Failed to send exercise: ${error}`,
        });
      }
    } else {
      Toast.show({
        type: 'error',
        text1: 'Connection Error',
        text2: 'WebSocket not connected',
      });
    }
  };

  // Handle challenge selection
  const handleChallengeSelect = (challengeId: number, challengeTitle: string) => {  // Updated to accept challengeTitle
    console.log('[ChatDetail] ========== CHALLENGE SELECTED ==========');
    console.log('[ChatDetail] Challenge ID:', challengeId);
    console.log('[ChatDetail] Challenge Title:', challengeTitle);
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
      // Send challenge using web frontend format: "Check out "{title}" - challenge://{id}"
      const challengeLink = `challenge://${challengeId}`;
      const messageBody = `Check out "${challengeTitle}" - ${challengeLink}`;
      console.log('[ChatDetail] Sending challenge message:', messageBody);
      console.log('[ChatDetail] Message format check:', /challenge:\/\/(\d+)/.test(messageBody));
      
      try {
        sendMessage(messageBody);
        console.log('[ChatDetail] Message sent successfully via sendMessage');
        Toast.show({
          type: 'success',
          text1: 'Challenge Sent',
          text2: `Challenge "${challengeTitle}" sent!`,
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

    // Check if this is an exercise message
    const exerciseId = isExerciseMessage(item.body);
    
    // Check if this is a challenge message
    const challengeId = isChallengeMessage(item.body);

    if (exerciseId) {
      const exercise = EXERCISES.find(e => e.id === exerciseId);
      if (exercise) {
        return (
          <View style={[
            styles.messageContainer,
            { alignItems: isMyMessage ? 'flex-end' : 'flex-start' }
          ]}>
            <View style={{ maxWidth: '85%' }}>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('ExerciseDetail' as never, { exercise } as never);
                }}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.exerciseCard,
                  {
                    backgroundColor: isMyMessage ? colors.active : colors.navBar,
                    borderColor: colors.border
                  }
                ]}>
                  <CustomText style={[
                    styles.exerciseCardTitle,
                    { color: isMyMessage ? colors.userMessageText : colors.text }
                  ]}>
                    💪 {exercise.name}
                  </CustomText>
                  <CustomText 
                    style={[
                      styles.exerciseCardDescription,
                      { color: isMyMessage ? colors.userMessageText : colors.subText }
                    ]}
                    numberOfLines={2}
                  >
                    {exercise.description}
                  </CustomText>
                  <View style={styles.exerciseCardMeta}>
                    <View style={[styles.exerciseCardBadge, { backgroundColor: colors.border }]}>
                      <CustomText style={[
                        styles.exerciseCardBadgeText,
                        { color: isMyMessage ? colors.userMessageText : colors.subText }
                      ]}>
                        {exercise.difficulty}
                      </CustomText>
                    </View>
                    {exercise.muscleGroups.slice(0, 2).map((muscle: string, index: number) => (
                      <View 
                        key={index}
                        style={[styles.exerciseCardBadge, { backgroundColor: colors.border }]}
                      >
                        <CustomText style={[
                          styles.exerciseCardBadgeText,
                          { color: isMyMessage ? colors.userMessageText : colors.subText }
                        ]}>
                          {muscle}
                        </CustomText>
                      </View>
                    ))}
                  </View>
                  <CustomText style={[
                    styles.exerciseCardLink,
                    { color: isMyMessage ? colors.userMessageText : colors.active }
                  ]}>
                    Tap to view details →
                  </CustomText>
                </View>
              </TouchableOpacity>
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
    }

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
          {(() => {
            const messageParts = parseMessageWithMentions(item.body);
            return (
              <CustomText
                style={[
                  styles.messageText,
                  { color: isMyMessage ? colors.userMessageText : colors.text }
                ]}
              >
                {messageParts.map((part, index) => {
                  if (part.type === 'mention') {
                    return (
                      <CustomText
                        key={index}
                        onPress={() => {
                          navigation.navigate('Profile' as never, { username: part.username } as never);
                        }}
                        style={[
                          styles.mentionText,
                          { color: '#3b82f6' } // Blue color for mentions
                        ]}
                      >
                        {part.content}
                      </CustomText>
                    );
                  }
                  return part.content;
                })}
              </CustomText>
            );
          })()}
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
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerSendButton}
            onPress={() => setShowExerciseModal(true)}
          >
            <CustomText style={[styles.headerSendButtonText, { color: colors.active }]}>
              Send Exercise
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerSendButton}
            onPress={() => setShowChallengeModal(true)}
          >
            <CustomText style={[styles.headerSendButtonText, { color: colors.active }]}>
              Send Challenge
            </CustomText>
          </TouchableOpacity>
        </View>
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
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.messageInput, { 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border 
              }]}
              value={messageText}
              onChangeText={handleMessageTextChange}
              placeholder="Type a message..."
              placeholderTextColor={colors.subText}
              multiline
              maxLength={1000}
            />
            {/* Mention Suggestions */}
            {showMentionSuggestions && mentionSuggestions.length > 0 && (
              <View style={[styles.mentionSuggestionsContainer, { 
                backgroundColor: colors.background,
                borderColor: colors.border 
              }]}>
                <FlatList
                  data={mentionSuggestions}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.mentionSuggestionItem, {
                        backgroundColor: colors.navBar,
                        borderBottomColor: colors.border
                      }]}
                      onPress={() => handleSelectMention(item.username)}
                    >
                      <CustomText style={[styles.mentionSuggestionText, { color: colors.text }]}>
                        {item.username}
                      </CustomText>
                    </TouchableOpacity>
                  )}
                  nestedScrollEnabled
                />
              </View>
            )}
          </View>
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
        onSelect={handleChallengeSelect}  // Now passes both challengeId and challengeTitle
        colors={colors}
        getAuthHeader={getAuthHeader}
      />
      
      {/* Exercise Selector Modal */}
      <ExerciseSelectorModal
        visible={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        onSelect={handleExerciseSelect}
        colors={colors}
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
  inputWrapper: {
    flex: 1,
    position: 'relative',
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
  mentionSuggestionsContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    marginBottom: 4,
    marginRight: 12,
    maxHeight: 200,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  mentionSuggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  mentionSuggestionText: {
    fontSize: 16,
  },
  mentionText: {
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerSendButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  headerSendButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  exerciseItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  exerciseItemContent: {
    gap: 8,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  exerciseDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  exerciseMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  exerciseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exerciseBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  exerciseCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  exerciseCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  exerciseCardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  exerciseCardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  exerciseCardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exerciseCardBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  exerciseCardLink: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
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
});

export default ChatDetail;
