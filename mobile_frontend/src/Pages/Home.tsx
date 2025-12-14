import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Animated,
  Easing,
  ImageSourcePropType,
  TouchableOpacity,
} from 'react-native';
import { 
  Card, 
  Button, 
  useTheme,
  Text,
  ActivityIndicator,
  Avatar,
  IconButton,
  Chip,
  SegmentedButtons,
  Divider,
  Menu,
} from 'react-native-paper';
import Cookies from '@react-native-cookies/cookies';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { API_URL } from '@constants/api';

const DEFAULT_PROFILE_PIC = require('../assets/temp_images/profile.png');

/**
 * Home component displays a list of forum threads in a scrollable feed.
 * Features include:
 * - Pull-to-refresh functionality
 * - Loading states with activity indicators
 * - Error handling with user-friendly messages
 * - Automatic refresh when screen comes into focus
 * - Individual thread voting and commenting capabilities
 */
const Home = () => {
  // State management for threads data and UI states
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [profilePics, setProfilePics] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('top');
  const [threadComments, setThreadComments] = useState<Record<number, any[]>>({});
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [threadVotes, setThreadVotes] = useState<Record<number, 'UPVOTE' | 'DOWNVOTE' | null>>({});

  // Context hooks
  const theme = useTheme();
  const { getAuthHeader } = useAuth();
  const navigation = useNavigation();

  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  
  // Exercise card visibility
  const [isExerciseCardVisible, setIsExerciseCardVisible] = useState(false);

  // Profile image cache helpers
  const profilePicCache = useRef<Record<string, string>>({});
  const profilePicRequests = useRef<Set<string>>(new Set());

  /**
   * Safely sorts thread list by creation date (newest first) or likes (top first).
   */
  const sortThreadsByDate = useCallback((items: any[]) => {
    if (!Array.isArray(items)) {
      return [];
    }

    if (sortBy === 'top') {
      return [...items].sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
    }

    const getTimestamp = (thread: any) => {
      const dateFields = ['created_at', 'createdAt', 'created', 'creation_date', 'date'];

      for (const field of dateFields) {
        const value = thread?.[field];
        if (!value) {
          continue;
        }

        const timestamp = new Date(value).getTime();
        if (!Number.isNaN(timestamp)) {
          return timestamp;
        }
      }

      return 0;
    };

    return [...items].sort((a, b) => getTimestamp(b) - getTimestamp(a));
  }, [sortBy]);

  const animateContent = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(16);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  /**
   * Fetches threads from the API endpoint.
   * Handles CSRF token retrieval, authentication headers, and error states.
   * @async
   * @function fetchThreads
   */
  const fetchThreads = useCallback(async () => {
    // If already pulling-to-refresh, avoid toggling the main loading spinner
    if (!refreshing) setLoading(true);
    try {
      setError(null);

      // Get CSRF token from cookies for Django backend security
      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies.csrftoken?.value;

      // Make authenticated request to threads API
      const response = await fetch(`${API_URL}threads/`, {
        headers: {
          ...getAuthHeader(), // Include authentication headers
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}), // Include CSRF token if available
        },
        credentials: 'include', // Include cookies in request
      });

      if (response.ok) {
        const data = await response.json();
        setThreads(sortThreadsByDate(data));
        
        // Fetch top 2 comments for each thread
        data.slice(0, 10).forEach((thread: any) => {
          fetchThreadComments(thread.id);
        });
      } else {
        setError('Failed to load threads');
        setThreads([]);
      }
    } catch (e) {
      setError('Network error while loading threads');
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, refreshing, sortThreadsByDate]);

  // Fetch threads on component mount
  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Refresh threads when screen comes into focus (e.g., returning from another screen)
  useFocusEffect(
    useCallback(() => {
      fetchThreads();
    }, [fetchThreads])
  );

  // Run animation only once on mount
  useEffect(() => {
    animateContent();
  }, []);

  /**
   * Caches profile picture URI for quick lookup.
   */
  const cacheProfilePic = useCallback((username: string, uri: string) => {
    profilePicCache.current[username] = uri;
    setProfilePics((prev) => ({ ...prev, [username]: uri }));
  }, []);

  /**
   * Fetches profile picture for a given username.
   */
  const fetchProfilePicture = useCallback(
    async (username: string) => {
      if (!username) {
        return;
      }

      if (profilePicCache.current[username] || profilePicRequests.current.has(username)) {
        return;
      }

      profilePicRequests.current.add(username);

      try {
        const response = await fetch(`${API_URL}profile/other/picture/${username}/`, {
          headers: {
            ...getAuthHeader(),
          },
          credentials: 'include',
        });

        if (response.ok) {
          // The backend returns binary image data, so we need to create a blob URL
          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);
          cacheProfilePic(username, imageUrl);
        }
      } catch (err) {
        // Ignore errors and continue with fallback image.
      } finally {
        profilePicRequests.current.delete(username);
      }
    },
    [cacheProfilePic, getAuthHeader]
  );

  /**
   * Prefetch profile images for all usernames in the thread list.
   */
  useEffect(() => {
    const usernames = new Set<string>();
    threads.forEach((thread) => {
      const username =
        thread?.author?.username || thread?.author || thread?.username || '';
      if (username) {
        usernames.add(String(username));
      }
    });

    usernames.forEach((username) => {
      fetchProfilePicture(username);
    });
  }, [fetchProfilePicture, threads]);

  /**
   * Fetches top comments for a thread
   */
  const fetchThreadComments = useCallback(
    async (threadId: number) => {
      try {
        const cookies = await Cookies.get(API_URL);
        const csrfToken = cookies.csrftoken?.value;

        const response = await fetch(`${API_URL}comments/thread/${threadId}/`, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          // Store top 2 comments
          setThreadComments(prev => ({
            ...prev,
            [threadId]: data.slice(0, 2)
          }));
        }
      } catch (err) {
        // Silently fail for comments
      }
    },
    [getAuthHeader]
  );

  /**
   * Fetches vote status for a specific thread
   */
  const fetchVoteStatus = useCallback(
    async (threadId: number) => {
      try {
        const cookies = await Cookies.get(API_URL);
        const csrfToken = cookies.csrftoken?.value;
        const res = await fetch(`${API_URL}forum/vote/thread/${threadId}/status/`, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setThreadVotes(prev => ({ ...prev, [threadId]: data.vote_type || null }));
        } else {
          setThreadVotes(prev => ({ ...prev, [threadId]: null }));
        }
      } catch (e) {
        // Silently fail
      }
    },
    [getAuthHeader]
  );

  /**
   * Handles voting on a thread
   */
  const handleVote = useCallback(
    async (threadId: number) => {
      try {
        const cookies = await Cookies.get(API_URL);
        const csrfToken = cookies.csrftoken?.value;
        const origin = API_URL.replace(/\/api\/?$/, '');
        const currentVote = threadVotes[threadId];

        if (currentVote === 'UPVOTE') {
          // Remove vote
          const res = await fetch(`${API_URL}forum/vote/thread/${threadId}/`, {
            method: 'DELETE',
            headers: {
              ...getAuthHeader(),
              'Content-Type': 'application/json',
              'Referer': origin,
              ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
            },
            credentials: 'include',
          });
          if (res.ok) {
            setThreadVotes(prev => ({ ...prev, [threadId]: null }));
            // Update like count locally
            setThreads(prev =>
              prev.map(t =>
                t.id === threadId ? { ...t, like_count: Math.max(0, (t.like_count || 0) - 1) } : t
              )
            );
          }
        } else {
          // Add upvote
          const res = await fetch(`${API_URL}forum/vote/`, {
            method: 'POST',
            headers: {
              ...getAuthHeader(),
              'Content-Type': 'application/json',
              'Referer': origin,
              ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
            },
            credentials: 'include',
            body: JSON.stringify({
              content_type: 'THREAD',
              object_id: threadId,
              vote_type: 'UPVOTE',
            }),
          });
          if (res.ok) {
            const wasDownvoted = currentVote === 'DOWNVOTE';
            setThreadVotes(prev => ({ ...prev, [threadId]: 'UPVOTE' }));
            // Update like count locally
            setThreads(prev =>
              prev.map(t =>
                t.id === threadId
                  ? { ...t, like_count: (t.like_count || 0) + 1 }
                  : t
              )
            );
          }
        }
      } catch (e) {
        console.error('Vote error:', e);
      }
    },
    [getAuthHeader, threadVotes]
  );

  /**
   * Fetch vote statuses when threads change
   */
  useEffect(() => {
    threads.forEach(thread => {
      if (thread.id && threadVotes[thread.id] === undefined) {
        fetchVoteStatus(thread.id);
      }
    });
  }, [threads, fetchVoteStatus, threadVotes]);

  /**
   * Re-sort threads when sort option changes
   */
  useEffect(() => {
    if (threads.length > 0) {
      const sorted = sortThreadsByDate(threads);
      setThreads(sorted);
    }
  }, [sortBy, sortThreadsByDate]);

  /**
   * Handles pull-to-refresh functionality.
   * Sets refreshing state and fetches fresh data from API.
   * @async
   * @function onRefresh
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchThreads();
    setRefreshing(false);
  }, [fetchThreads]);

  /**
   * Renders individual thread items as modern cards
   */
  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const username = item.author?.username || item.author || item.username || 'User';
      const forumName = item.forum?.title || item.forum || 'Forum';
      const content = `${item.title ? item.title + '\n' : ''}${item.content || ''}`;
      const comments = threadComments[item.id] || [];

      const profilePicSource: ImageSourcePropType = (() => {
        if (username && profilePics[username]) {
          return { uri: profilePics[username] };
        }
        if (item.profilePic) {
          return item.profilePic;
        }
        return DEFAULT_PROFILE_PIC;
      })();

      return (
        <Card 
          key={item.id || index} 
          mode="elevated" 
          style={styles.threadCard}
          onPress={() => navigation.navigate('ThreadDetail' as never, { threadId: item.id } as never)}
        >
          {/* Forum Badge */}
          <Card.Content style={styles.cardHeader}>
            <Chip 
              icon="forum" 
              compact 
              mode="flat"
              style={styles.forumChip}
              textStyle={{ fontSize: 12 }}
            >
              {forumName}
            </Chip>
          </Card.Content>

          {/* Author Section */}
          <Card.Content style={styles.authorSection}>
            <Avatar.Image 
              size={40} 
              source={profilePicSource}
            />
            <View style={styles.authorInfo}>
              <Text 
                variant="labelLarge" 
                style={{ color: theme.colors.onSurface }}
                onPress={() => navigation.navigate('Profile' as never, { username } as never)}
              >
                {username}
              </Text>
            </View>
          </Card.Content>

          {/* Content */}
          <Card.Content style={styles.contentSection}>
            <Text 
              variant="bodyLarge" 
              style={{ color: theme.colors.onSurface, lineHeight: 24 }}
              numberOfLines={4}
            >
              {content}
            </Text>
          </Card.Content>

          {/* Top Comments Preview */}
          {comments.length > 0 && (
            <Card.Content style={styles.commentsPreview}>
              {comments.map((comment, idx) => (
                <View key={comment.id || idx} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <IconButton
                      icon="comment-outline"
                      size={14}
                      iconColor={theme.colors.primary}
                      style={{ margin: 0 }}
                    />
                    <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                      {comment.author_username || 'User'}
                    </Text>
                  </View>
                  <Text 
                    variant="bodySmall" 
                    style={{ color: theme.colors.onSurface, marginLeft: 28, marginTop: -4 }}
                    numberOfLines={2}
                  >
                    {comment.content}
                  </Text>
                </View>
              ))}
            </Card.Content>
          )}

          {/* Actions */}
          <Card.Actions style={styles.cardActions}>
            <View style={styles.statsContainer}>
              <IconButton
                icon={threadVotes[item.id] === 'UPVOTE' ? 'thumb-up' : 'thumb-up-outline'}
                size={20}
                iconColor={threadVotes[item.id] === 'UPVOTE' ? theme.colors.primary : theme.colors.onSurfaceVariant}
                onPress={() => handleVote(item.id)}
              />
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {item.like_count || 0}
              </Text>
              
              <IconButton
                icon="comment-outline"
                size={20}
                iconColor={theme.colors.primary}
                style={{ marginLeft: 8 }}
                onPress={() => navigation.navigate('ThreadDetail' as never, { threadId: item.id } as never)}
              />
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {item.comment_count || 0}
              </Text>
            </View>
            
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('ThreadDetail' as never, { threadId: item.id } as never)}
              compact
            >
              View Thread
            </Button>
          </Card.Actions>
        </Card>
      );
    },
    [profilePics, theme, navigation, threadComments, threadVotes, handleVote]
  );

  /**
   * Toggle exercise card visibility
   */
  const toggleExerciseCard = useCallback(() => {
    setIsExerciseCardVisible(prev => !prev);
  }, []);

  /**
   * Renders the exercises info card at the top of the feed
   */
  const renderHeader = () => {
    return (
      <>
        {/* Tap indicator - visible when card is hidden */}
        {!isExerciseCardVisible && (
          <TouchableOpacity onPress={toggleExerciseCard} style={styles.pullIndicator} activeOpacity={0.7}>
            <IconButton
              icon="dumbbell"
              size={16}
              iconColor={theme.colors.primary}
              style={{ margin: 0 }}
            />
            <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
              Exercise Library
            </Text>
            <IconButton
              icon="chevron-down"
              size={16}
              iconColor={theme.colors.primary}
              style={{ margin: 0 }}
            />
          </TouchableOpacity>
        )}

        {/* Exercise Library Card */}
        {isExerciseCardVisible && (
          <Card mode="elevated" style={styles.headerCard}>
            <Card.Content>
              <View style={styles.headerContent}>
                <IconButton
                  icon="dumbbell"
                  size={32}
                  iconColor={theme.colors.primary}
                  containerColor={theme.colors.primaryContainer}
                />
                <View style={styles.headerText}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 4 }}>
                    Exercise Library
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Explore our comprehensive exercise database
                  </Text>
                </View>
                <IconButton
                  icon="chevron-up"
                  size={24}
                  onPress={toggleExerciseCard}
                  iconColor={theme.colors.onSurfaceVariant}
                />
              </View>
              <Button
                mode="contained"
                icon="arrow-right"
                onPress={() => navigation.navigate('Exercises' as never)}
                style={{ marginTop: 12 }}
              >
                Browse Exercises
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Sort Filter */}
        <View style={styles.filterContainer}>
          <Text variant="titleSmall" style={{ color: theme.colors.onSurface, flex: 1 }}>
            Threads
          </Text>
          <Menu
            visible={dropdownVisible}
            onDismiss={() => setDropdownVisible(false)}
            anchor={
              <TouchableOpacity
                onPress={() => setDropdownVisible(true)}
                style={styles.dropdownButton}
              >
                <IconButton 
                  icon={sortBy === 'top' ? 'fire' : 'clock-outline'} 
                  size={20} 
                  style={{ margin: 0 }}
                />
                <Text variant="labelLarge" style={{ marginRight: 4 }}>
                  {sortBy === 'top' ? 'Top' : 'Newest'}
                </Text>
                <IconButton 
                  icon="chevron-down" 
                  size={20} 
                  style={{ margin: 0 }}
                />
              </TouchableOpacity>
            }
            contentStyle={{ backgroundColor: theme.colors.elevation.level2 }}
          >
            <Menu.Item 
              onPress={() => { setSortBy('top'); setDropdownVisible(false); }} 
              title="Top"
              leadingIcon="fire"
            />
            <Divider />
            <Menu.Item 
              onPress={() => { setSortBy('newest'); setDropdownVisible(false); }} 
              title="Newest"
              leadingIcon="clock-outline"
            />
          </Menu>
        </View>
      </>
    );
  };

  /**
   * Renders the empty state component for FlatList.
   */
  const listEmpty = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <IconButton
          icon={error ? "alert-circle-outline" : "post-outline"}
          size={64}
          iconColor={theme.colors.onSurfaceVariant}
        />
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginTop: 8 }}>
          {error ? 'Failed to load threads' : 'No threads yet'}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
          {error ? 'Pull down to refresh' : 'Be the first to post!'}
        </Text>
      </View>
    );
  }, [theme, error, loading]);

  return (
    <Animated.View
      style={[
        styles.container,
        { 
          opacity: fadeAnim, 
          transform: [{ translateY: slideAnim }],
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={threads}
        keyExtractor={(item, index) => String(item?.id ?? index)}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={listEmpty}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  pullIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    marginBottom: 8,
    backgroundColor: 'rgba(128, 0, 0, 0.08)',
    borderRadius: 16,
    alignSelf: 'center',
    paddingHorizontal: 8,
  },
  headerCard: {
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  threadCard: {
    marginBottom: 16,
  },
  cardHeader: {
    paddingBottom: 8,
  },
  forumChip: {
    alignSelf: 'flex-start',
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  authorInfo: {
    flex: 1,
  },
  contentSection: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  cardActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentsPreview: {
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  commentItem: {
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
    paddingRight: 8,
    backgroundColor: 'transparent',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
});

export default Home;
