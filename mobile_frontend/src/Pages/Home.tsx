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

  // Context hooks for theming and authentication
  const { colors } = useTheme();
  const { getAuthHeader } = useAuth();

  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

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
        const response = await fetch(`http://10.0.2.2:8000/api/profile/other/picture/${username}/`, {
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
   * Renders individual thread items in the FlatList.
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

      return (
        <Thread
          key={item.id || index}
          forumName={item.forum?.title || item.forum || 'Forum'}
          content={`${item.title ? item.title + '\n' : ''}${item.content || ''}`}
          profilePic={profilePicSource}
          username={username}
          threadId={item.id}
          likeCount={item.like_count || 0}
          commentCount={item.comment_count || 0}
        />
      );
    },
    [profilePics]
  );

  /**
   * Renders the empty state component for FlatList.
   * Shows loading spinner, error message, or empty state based on current state.
   * @returns {JSX.Element} Empty state component
   */
  const listEmpty = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.mentionText} />
        </View>
      );
    }

    const content = error ? 'Failed to load threads. Pull to refresh.' : 'There is no such post.';

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.subText }]}>{content}</Text>
      </View>
    );
  }, [colors.mentionText, colors.subText, error, loading]);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={threads}
        keyExtractor={(item, index) => String(item?.id ?? index)}
        renderItem={renderItem}
        ListEmptyComponent={listEmpty}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
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
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
  },
});

export default Home;
