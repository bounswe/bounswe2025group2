import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Animated,
  Easing,
  ImageSourcePropType,
  TouchableOpacity,
  ScrollView,
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
import CustomText from '@components/CustomText';
import { useTheme as useCustomTheme } from '../context/ThemeContext';

const DEFAULT_PROFILE_PIC = require('../assets/temp_images/profile.png');

// Types for calendar and login stats
interface LoginStats {
  current_streak: number;
  longest_streak: number;
  total_login_days: number;
  last_login_date: string | null;
  streak_active: boolean;
  days_until_break: number | null;
  login_calendar: Array<{
    date: string;
    logged_in: boolean;
  }>;
  logged_in_today: boolean;
}

interface Goal {
  id: number;
  title: string;
  target_date: string;
  status: 'ACTIVE' | 'COMPLETED' | 'RESTARTED';
}

interface Challenge {
  id: number;
  title: string;
  end_date: string;
  is_active: boolean;
  is_joined: boolean;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  hasLogin: boolean;
  events: Array<{
    type: 'goal' | 'challenge';
    title: string;
    id: number;
    daysUntil: number;
  }>;
}

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

  // New state for calendar and stats
  const [loginStats, setLoginStats] = useState<LoginStats | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showCalendar, setShowCalendar] = useState(true);

  // Context hooks
  const theme = useTheme();
  const customTheme = useCustomTheme();
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
        const response = await fetch(`${API_URL}/profile/other/picture/${username}/`, {
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
   * Fetches login stats
   */
  const fetchLoginStats = useCallback(async () => {
    try {
      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies.csrftoken?.value;
      const origin = API_URL.replace(/\/api\/?$/, '');

      const response = await fetch(`${API_URL}user/login-stats/`, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          'Referer': origin,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setLoginStats(data);
      }
    } catch (e) {
      console.error('Failed to fetch login stats:', e);
    }
  }, [getAuthHeader]);

  /**
   * Fetches goals
   */
  const fetchGoals = useCallback(async () => {
    try {
      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies.csrftoken?.value;
      const origin = API_URL.replace(/\/api\/?$/, '');

      const response = await fetch(`${API_URL}goals/`, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          'Referer': origin,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      }
    } catch (e) {
      console.error('Failed to fetch goals:', e);
    }
  }, [getAuthHeader]);

  /**
   * Fetches challenges
   */
  const fetchChallenges = useCallback(async () => {
    try {
      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies.csrftoken?.value;
      const origin = API_URL.replace(/\/api\/?$/, '');

      const response = await fetch(`${API_URL}challenges/search/?is_active=true`, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          'Referer': origin,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const challengesList = Array.isArray(data) ? data : (data.results || []);
        // Filter to only joined challenges
        const joinedChallenges = challengesList.filter((c: Challenge) => c.is_joined);
        setChallenges(joinedChallenges);
      }
    } catch (e) {
      console.error('Failed to fetch challenges:', e);
    }
  }, [getAuthHeader]);

  /**
   * Fetches all stats
   */
  const fetchAllStats = useCallback(async () => {
    setLoadingStats(true);
    await Promise.all([
      fetchLoginStats(),
      fetchGoals(),
      fetchChallenges(),
    ]);
    setLoadingStats(false);
  }, [fetchLoginStats, fetchGoals, fetchChallenges]);

  // Helper function to format date as YYYY-MM-DD
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to parse backend date string as local date
  const parseLocalDate = (dateString: string): Date => {
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Generate calendar for current month
  const calendarDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysFromPrevMonth = firstDayOfWeek;
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const totalDays = lastDay.getDate();
    const totalCells = Math.ceil((daysFromPrevMonth + totalDays) / 7) * 7;
    const daysFromNextMonth = totalCells - daysFromPrevMonth - totalDays;
    
    const days: CalendarDay[] = [];
    
    // Add previous month days
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        hasLogin: false,
        events: []
      });
    }
    
    // Add current month days
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      const dateStr = formatDateLocal(date);
      
      const isPastOrToday = date <= today;
      const hasLogin = isPastOrToday && (loginStats?.login_calendar.some(
        cal => cal.date === dateStr && cal.logged_in
      ) || false);
      
      const events: CalendarDay['events'] = [];
      
      // Check goals
      goals.forEach(goal => {
        const targetDate = parseLocalDate(goal.target_date);
        const goalDateStr = formatDateLocal(targetDate);
        if (goalDateStr === dateStr && goal.status === 'ACTIVE') {
          const daysUntil = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          events.push({
            type: 'goal',
            title: goal.title,
            id: goal.id,
            daysUntil
          });
        }
      });
      
      // Check challenges
      challenges.forEach(challenge => {
        const endDate = parseLocalDate(challenge.end_date);
        const challengeDateStr = formatDateLocal(endDate);
        if (challengeDateStr === dateStr && challenge.is_active && challenge.is_joined) {
          const daysUntil = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          events.push({
            type: 'challenge',
            title: challenge.title,
            id: challenge.id,
            daysUntil
          });
        }
      });
      
      days.push({
        date,
        isCurrentMonth: true,
        hasLogin,
        events
      });
    }
    
    // Add next month days
    for (let i = 1; i <= daysFromNextMonth; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        hasLogin: false,
        events: []
      });
    }
    
    return days;
  }, [loginStats, goals, challenges]);

  // Get upcoming deadlines (next 7 days)
  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const deadlines: Array<{
      type: 'goal' | 'challenge';
      title: string;
      date: Date;
      daysUntil: number;
      id: number;
    }> = [];
    
    goals.forEach(goal => {
      if (goal.status === 'ACTIVE') {
        const targetDate = parseLocalDate(goal.target_date);
        if (targetDate >= today && targetDate <= sevenDaysFromNow) {
          const daysUntil = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          deadlines.push({
            type: 'goal',
            title: goal.title,
            date: targetDate,
            daysUntil,
            id: goal.id
          });
        }
      }
    });
    
    challenges.forEach(challenge => {
      if (challenge.is_active && challenge.is_joined) {
        const endDate = parseLocalDate(challenge.end_date);
        if (endDate >= today && endDate <= sevenDaysFromNow) {
          const daysUntil = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          deadlines.push({
            type: 'challenge',
            title: challenge.title,
            date: endDate,
            daysUntil,
            id: challenge.id
          });
        }
      }
    });
    
    return deadlines.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [goals, challenges]);

  // Fetch stats on mount and focus
  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  useFocusEffect(
    useCallback(() => {
      fetchAllStats();
    }, [fetchAllStats])
  );

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
   * Renders the calendar and stats section
   */
  const renderStatsSection = () => {
    const today = new Date();
    const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const activeGoals = goals.filter(g => g.status === 'ACTIVE').length;
    const joinedChallengesCount = challenges.length;

    return (
      <View style={styles.statsContainer}>
        {/* Login Streak Card */}
        <Card mode="elevated" style={styles.streakCard}>
          <Card.Content>
            <View style={styles.streakHeader}>
              <IconButton
                icon="fire"
                size={24}
                iconColor={customTheme.colors.active || '#800000'}
              />
              <CustomText style={[styles.streakTitle, { color: customTheme.colors.text }]}>
                Login Streak
              </CustomText>
              {loginStats?.streak_active && (
                <Chip mode="flat" compact style={styles.activeBadge}>
                  Active
                </Chip>
              )}
            </View>
            {loadingStats ? (
              <ActivityIndicator size="small" color={customTheme.colors.active} />
            ) : (
              <>
                <CustomText style={[styles.streakNumber, { color: customTheme.colors.active }]}>
                  {loginStats?.current_streak || 0}
                </CustomText>
                <View style={styles.streakSecondary}>
                  <CustomText style={[styles.streakText, { color: customTheme.colors.subText }]}>
                    Best: {loginStats?.longest_streak || 0}
                  </CustomText>
                  <CustomText style={[styles.streakText, { color: customTheme.colors.subText }]}>
                    •
                  </CustomText>
                  <CustomText style={[styles.streakText, { color: customTheme.colors.subText }]}>
                    Total: {loginStats?.total_login_days || 0} days
                  </CustomText>
                </View>
                {loginStats && !loginStats.logged_in_today && (
                  <View style={styles.streakWarning}>
                    <IconButton
                      icon="alert-circle"
                      size={16}
                      iconColor="#dc2626"
                      style={{ margin: 0 }}
                    />
                    <CustomText style={[styles.warningText, { color: '#dc2626' }]}>
                      Log in today to continue your streak!
                    </CustomText>
                  </View>
                )}
              </>
            )}
          </Card.Content>
        </Card>

        {/* Quick Stats */}
        <View style={styles.quickStatsRow}>
          <Card mode="elevated" style={[styles.statCard, { flex: 1 }]}>
            <Card.Content style={styles.statCardContent}>
              <CustomText style={[styles.statNumber, { color: customTheme.colors.active }]}>
                {activeGoals}
              </CustomText>
              <CustomText style={[styles.statLabel, { color: customTheme.colors.subText }]}>
                Active Goals
              </CustomText>
            </Card.Content>
          </Card>
          <Card mode="elevated" style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
            <Card.Content style={styles.statCardContent}>
              <CustomText style={[styles.statNumber, { color: customTheme.colors.active }]}>
                {joinedChallengesCount}
              </CustomText>
              <CustomText style={[styles.statLabel, { color: customTheme.colors.subText }]}>
                Challenges
              </CustomText>
            </Card.Content>
          </Card>
        </View>

        {/* Calendar Card */}
        <Card mode="elevated" style={styles.calendarCard}>
          <Card.Content>
            <View style={styles.calendarHeader}>
              <IconButton
                icon="calendar"
                size={20}
                iconColor={customTheme.colors.active}
                style={{ margin: 0 }}
              />
              <CustomText style={[styles.calendarTitle, { color: customTheme.colors.text }]}>
                {monthName}
              </CustomText>
              <TouchableOpacity
                onPress={() => setShowCalendar(!showCalendar)}
                style={styles.toggleButton}
              >
                <IconButton
                  icon={showCalendar ? "chevron-up" : "chevron-down"}
                  size={20}
                  iconColor={customTheme.colors.subText}
                  style={{ margin: 0 }}
                />
              </TouchableOpacity>
            </View>

            {showCalendar && (
              <>
                {/* Legend */}
                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} />
                    <CustomText style={[styles.legendText, { color: customTheme.colors.subText }]}>
                      Login
                    </CustomText>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                    <CustomText style={[styles.legendText, { color: customTheme.colors.subText }]}>
                      Goal
                    </CustomText>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                    <CustomText style={[styles.legendText, { color: customTheme.colors.subText }]}>
                      Challenge
                    </CustomText>
                  </View>
                </View>

                {/* Calendar Grid */}
                <View style={styles.calendarGrid}>
                  {/* Day names */}
                  <View style={styles.calendarHeaderRow}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                      <View key={idx} style={styles.dayName}>
                        <CustomText style={[styles.dayNameText, { color: customTheme.colors.subText }]}>
                          {day}
                        </CustomText>
                      </View>
                    ))}
                  </View>

                  {/* Calendar days */}
                  <View style={styles.calendarBody}>
                    {calendarDays.map((day, index) => {
                      const isToday = day.date.toDateString() === today.toDateString();
                      return (
                        <View
                          key={index}
                          style={[
                            styles.calendarDay,
                            !day.isCurrentMonth && styles.otherMonthDay,
                            isToday && { borderColor: customTheme.colors.active, borderWidth: 2 },
                          ]}
                        >
                          <CustomText
                            style={[
                              styles.dayNumber,
                              { color: day.isCurrentMonth ? customTheme.colors.text : customTheme.colors.subText },
                              isToday && { fontWeight: 'bold', color: customTheme.colors.active },
                            ]}
                          >
                            {day.date.getDate()}
                          </CustomText>
                          <View style={styles.dayIndicators}>
                            {day.hasLogin && (
                              <View style={[styles.indicator, { backgroundColor: '#dc2626' }]} />
                            )}
                            {day.events.filter(e => e.type === 'goal').length > 0 && (
                              <View style={[styles.indicator, { backgroundColor: '#10b981' }]} />
                            )}
                            {day.events.filter(e => e.type === 'challenge').length > 0 && (
                              <View style={[styles.indicator, { backgroundColor: '#3b82f6' }]} />
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Upcoming Deadlines */}
        {upcomingDeadlines.length > 0 && (
          <Card mode="elevated" style={styles.deadlinesCard}>
            <Card.Content>
              <View style={styles.deadlinesHeader}>
                <IconButton
                  icon="alert-circle"
                  size={20}
                  iconColor={customTheme.colors.active}
                  style={{ margin: 0 }}
                />
                <CustomText style={[styles.deadlinesTitle, { color: customTheme.colors.text }]}>
                  Upcoming Deadlines
                </CustomText>
              </View>
              {upcomingDeadlines.slice(0, 5).map((deadline) => (
                <TouchableOpacity
                  key={`${deadline.type}-${deadline.id}`}
                  style={styles.deadlineItem}
                  onPress={() => navigation.navigate(deadline.type === 'goal' ? 'Goals' : 'Challenges' as never)}
                >
                  <IconButton
                    icon={deadline.type === 'goal' ? 'target' : 'trophy'}
                    size={18}
                    iconColor={customTheme.colors.active}
                    style={{ margin: 0 }}
                  />
                  <View style={styles.deadlineContent}>
                    <CustomText style={[styles.deadlineTitle, { color: customTheme.colors.text }]}>
                      {deadline.title}
                    </CustomText>
                    <View style={styles.deadlineMeta}>
                      <Chip mode="flat" compact style={styles.deadlineTypeChip}>
                        {deadline.type}
                      </Chip>
                      <CustomText style={[styles.deadlineDate, { color: customTheme.colors.subText }]}>
                        {deadline.daysUntil === 0 ? 'Today' :
                         deadline.daysUntil === 1 ? 'Tomorrow' :
                         `${deadline.daysUntil}d`}
                      </CustomText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>
        )}
      </View>
    );
  };

  /**
   * Renders the exercises info card at the top of the feed
   */
  const renderHeader = () => {
    return (
      <>
        {renderStatsSection()}
        {/* Tap indicator - visible when card is hidden */}
        {!isExerciseCardVisible && (
          <TouchableOpacity onPress={toggleExerciseCard} style={styles.pullIndicator} activeOpacity={0.7}>
            <IconButton
              icon="dumbbell"
              size={16}
              iconColor={theme.colors.primary}
              style={{ margin: 0 }}
            />
            <CustomText variant="labelSmall" style={{ color: theme.colors.primary }}>
              Exercise Library
            </CustomText>
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
                  <CustomText variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 4 }}>
                    Exercise Library
                  </CustomText>
                  <CustomText variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Explore our comprehensive exercise database
                  </CustomText>
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
          <CustomText variant="titleSmall" style={{ color: theme.colors.onSurface, flex: 1 }}>
            Threads
          </CustomText>
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
                <CustomText variant="labelLarge" style={{ marginRight: 4 }}>
                  {sortBy === 'top' ? 'Top' : 'Newest'}
                </CustomText>
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
        <CustomText variant="titleMedium" style={{ color: theme.colors.onSurface, marginTop: 8 }}>
          {error ? 'Failed to load threads' : 'No threads yet'}
        </CustomText>
        <CustomText variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
          {error ? 'Pull down to refresh' : 'Be the first to post!'}
        </CustomText>
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
  statsContainer: {
    marginBottom: 16,
  },
  streakCard: {
    marginBottom: 12,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  activeBadge: {
    height: 24,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  streakSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  streakText: {
    fontSize: 14,
  },
  streakWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
  },
  warningText: {
    fontSize: 12,
    flex: 1,
  },
  quickStatsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
  },
  statCardContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  calendarCard: {
    marginBottom: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  toggleButton: {
    marginLeft: 'auto',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  calendarGrid: {
    marginTop: 8,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayName: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  dayNumber: {
    fontSize: 12,
    marginBottom: 2,
  },
  dayIndicators: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  deadlinesCard: {
    marginBottom: 12,
  },
  deadlinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deadlinesTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  deadlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  deadlineContent: {
    flex: 1,
    marginLeft: 8,
  },
  deadlineTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  deadlineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deadlineTypeChip: {
    height: 20,
  },
  deadlineDate: {
    fontSize: 12,
  },
});

export default Home;
