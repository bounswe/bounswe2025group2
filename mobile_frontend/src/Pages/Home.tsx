import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  Animated,
  Easing,
  ImageSourcePropType,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Thread from '../components/Thread';
import { useTheme } from '../context/ThemeContext';
import Cookies from '@react-native-cookies/cookies';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

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
  const [threads, setThreads] = useState<any[]>([]); // Array of thread objects from API
  const [loading, setLoading] = useState<boolean>(true); // Initial loading state
  const [refreshing, setRefreshing] = useState<boolean>(false); // Pull-to-refresh state
  const [error, setError] = useState<string | null>(null); // Error message for failed requests
  const [profilePics, setProfilePics] = useState<Record<string, string>>({}); // Cached profile images keyed by username
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false); // Show scroll-to-top button

  // Context hooks for theming and authentication
  const { colors } = useTheme();
  const { getAuthHeader } = useAuth();

  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const itemAnimations = useRef<Animated.Value[]>([]).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const scrollButtonAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  // Profile image cache helpers
  const profilePicCache = useRef<Record<string, string>>({});
  const profilePicRequests = useRef<Set<string>>(new Set());

  /**
   * Safely sorts thread list by creation date (newest first).
   */
  const sortThreadsByDate = useCallback((items: any[]) => {
    if (!Array.isArray(items)) {
      return [];
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
  }, []);

  const animateContent = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(16);
    scaleAnim.setValue(0.95);

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
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

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
      const cookies = await Cookies.get('http://164.90.166.81:8000');
      const csrfToken = cookies.csrftoken?.value;

      // Make authenticated request to threads API
      const response = await fetch('http://164.90.166.81:8000/api/threads/', {
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

  useEffect(() => {
    animateContent();
  }, [animateContent, threads]);

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
        const response = await fetch(`http://164.90.166.81:8000/api/profile/other/picture/${username}/`, {
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
   * Handles scroll event to show/hide scroll-to-top button
   */
  const handleScroll = useCallback((event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    const shouldShow = offset > 300; // Show button after scrolling 300 pixels

    if (shouldShow && !showScrollButton) {
      setShowScrollButton(true);
      Animated.timing(scrollButtonAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (!shouldShow && showScrollButton) {
      setShowScrollButton(false);
      Animated.timing(scrollButtonAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showScrollButton, scrollButtonAnim]);

  /**
   * Scrolls to the top of the thread list (latest posts)
   */
  const scrollToTop = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, []);

  /**
   * Initializes and animates item animations when threads change
   */
  useEffect(() => {
    if (threads.length > 0) {
      // Clear old animations
      itemAnimations.length = 0;

      // Create and start animations for each thread
      const animations = threads.map((_, index) => {
        const anim = new Animated.Value(0);

        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: index * 80, // Stagger each item by 80ms
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();

        return anim;
      });

      itemAnimations.push(...animations);
    }
  }, [threads, itemAnimations]);

  /**
   * Renders individual thread items in the FlatList with staggered animations.
   * Handles data mapping and fallback values for missing thread properties.
   */
  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const username =
        item.author?.username || item.author || item.username || 'User';

      const profilePicSource: ImageSourcePropType = (() => {
        if (username && profilePics[username]) {
          return { uri: profilePics[username] };
        }
        if (item.profilePic) {
          return item.profilePic;
        }
        return DEFAULT_PROFILE_PIC;
      })();

      const itemAnim = itemAnimations[index] || new Animated.Value(1);

      const animatedStyle = {
        opacity: itemAnim,
        transform: [
          {
            translateY: itemAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
          {
            scale: itemAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.95, 1],
            }),
          },
        ],
      };

      return (
        <Animated.View style={animatedStyle} key={item.id || index}>
          <Thread
            forumName={item.forum?.title || item.forum || 'Forum'}
            content={`${item.title ? item.title + '\n' : ''}${item.content || ''}`}
            profilePic={profilePicSource}
            username={username}
            threadId={item.id}
            likeCount={item.like_count || 0}
            commentCount={item.comment_count || 0}
          />
        </Animated.View>
      );
    },
    [profilePics, itemAnimations]
  );

  /**
   * Renders the empty state component for FlatList.
   * Shows loading spinner with shimmer animation, error message, or empty state.
   * @returns {JSX.Element} Empty state component
   */
  const listEmpty = useMemo(() => {
    if (loading) {
      // Shimmer animation during loading
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ).start();

      const shimmerOpacity = shimmerAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.3, 0.8, 0.3],
      });

      return (
        <Animated.View style={[styles.loadingContainer, { opacity: shimmerOpacity }]}>
          <ActivityIndicator size="large" color={colors.mentionText} />
          <Text style={[styles.loadingText, { color: colors.subText, marginTop: 12 }]}>
            Loading threads...
          </Text>
        </Animated.View>
      );
    }

    const content = error ? 'Failed to load threads. Pull to refresh.' : 'There is no such post.';

    return (
      <Animated.View
        style={[
          styles.emptyContainer,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          },
        ]}
      >
        <Text style={[styles.emptyText, { color: colors.subText }]}>{content}</Text>
      </Animated.View>
    );
  }, [colors.mentionText, colors.subText, error, loading, shimmerAnim, fadeAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <FlatList
        ref={flatListRef}
        style={styles.list}
        contentContainerStyle={styles.content}
        data={threads}
        keyExtractor={(item, index) => String(item?.id ?? index)}
        renderItem={renderItem}
        ListEmptyComponent={listEmpty}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Scroll to Top Button */}
      <Animated.View
        style={[
          styles.scrollToTopButton,
          {
            opacity: scrollButtonAnim,
            transform: [
              {
                scale: scrollButtonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ],
            pointerEvents: showScrollButton ? 'auto' : 'none',
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.scrollButton, { backgroundColor: colors.active }]}
          onPress={scrollToTop}
          activeOpacity={0.7}
        >
          <Text style={[styles.scrollButtonText, { color: colors.background }]}>
            ↑
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

/**
 * StyleSheet for Home component
 * Defines layout and spacing for the main container and content area
 */
const styles = StyleSheet.create({
  container: {
    flex: 1, // Take full available height
  },
  list: {
    flex: 1,
  },
  content: {
    padding: 16, // Add padding around the content
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
  },
  scrollToTopButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 10,
  },
  scrollButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Home;
