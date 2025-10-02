import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import Thread from '../components/Thread';
import { useTheme } from '../context/ThemeContext';
import Cookies from '@react-native-cookies/cookies';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

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
  
  // Context hooks for theming and authentication
  const { colors } = useTheme();
  const { getAuthHeader } = useAuth();

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
      const cookies = await Cookies.get('http://10.0.2.2:8000');
      const csrfToken = cookies.csrftoken?.value;
      
      // Make authenticated request to threads API
      const response = await fetch('http://10.0.2.2:8000/api/threads/', {
        headers: {
          ...getAuthHeader(), // Include authentication headers
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}), // Include CSRF token if available
        },
        credentials: 'include', // Include cookies in request
      });
      
      if (response.ok) {
        const data = await response.json();
        setThreads(data);
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
  }, [getAuthHeader, refreshing]);

  // Fetch threads on component mount
  useEffect(() => {
    fetchThreads();
  }, []);

  // Refresh threads when screen comes into focus (e.g., returning from another screen)
  useFocusEffect(
    useCallback(() => {
      fetchThreads();
    }, [fetchThreads])
  );

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
   * @param {Object} param0 - FlatList render props
   * @param {any} param0.item - Thread data object
   * @param {number} param0.index - Item index in the list
   * @returns {JSX.Element} Thread component
   */
  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
    <Thread
      key={item.id || index}
      forumName={item.forum?.title || item.forum || 'Forum'}
      content={`${item.title ? item.title + '\n' : ''}${item.content || ''}`}
      profilePic={item.profilePic || require('../assets/temp_images/profile.png')}
      username={item.author?.username || item.author || item.username || 'User'}
      threadId={item.id}
      likeCount={item.like_count || 0}
      commentCount={item.comment_count || 0}
    />
  ), []);

  /**
   * Renders the empty state component for FlatList.
   * Shows loading spinner, error message, or empty state based on current state.
   * @returns {JSX.Element} Empty state component
   */
  const listEmpty = useMemo(() => {
    if (loading) {
      return (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <ActivityIndicator size="large" color={colors.mentionText} />
        </View>
      );
    }
    
    // Determine message based on error state
    const content = error ? 'Failed to load threads. Pull to refresh.' : 'No threads found. Be the first to post!';
    
    return (
      <View style={{ alignItems: 'center', marginTop: 40 }}>
        <Thread
          key="placeholder"
          forumName=""
          content={content}
          profilePic={require('../assets/temp_images/profile.png')}
          username=""
          threadId={-1}
          likeCount={0}
          commentCount={0}
        />
      </View>
    );
  }, [colors.mentionText, error, loading]);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={threads}
      keyExtractor={(item, index) => String(item?.id ?? index)}
      renderItem={renderItem}
      ListEmptyComponent={listEmpty}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
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
  content: {
    padding: 16, // Add padding around the content
  },
});

export default Home;
