import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { 
  Card, 
  Button, 
  useTheme,
  ActivityIndicator,
  IconButton,
  Chip,
} from 'react-native-paper';
import Cookies from '@react-native-cookies/cookies';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { API_URL } from '@constants/api';
import CustomText from '@components/CustomText';
import { useTheme as useCustomTheme } from '../context/ThemeContext';

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
  // Keep only calendar and stats state
  const [loginStats, setLoginStats] = useState<LoginStats | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showCalendar, setShowCalendar] = useState(true);
  const [showDeadlines, setShowDeadlines] = useState(false); // Collapsed by default

  // Context hooks
  const theme = useTheme();
  const customTheme = useCustomTheme();
  const { getAuthHeader } = useAuth();
  const navigation = useNavigation();

  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

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

  // Run animation on mount
  useEffect(() => {
    animateContent();
  }, [animateContent]);

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
   * Renders the calendar and stats section
   */
  const renderStatsSection = () => {
    const today = new Date();
    const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const activeGoals = goals.filter(g => g.status === 'ACTIVE').length;
    const joinedChallengesCount = challenges.length;

    return (
      <View style={styles.statsContainer}>
        {/* Login Streak Card - Compact */}
        <Card mode="elevated" style={styles.streakCardCompact}>
          <Card.Content style={styles.streakCardContentCompact}>
            <View style={styles.streakHeaderCompact}>
                    <IconButton
                icon="fire"
                size={50}
                iconColor={customTheme.colors.active || '#800000'}
                      style={{ margin: 0 }}
                    />
              <View style={styles.streakInfoCompact}>
                <View style={styles.streakTitleRow}>
                  <CustomText style={[styles.streakTitleCompact, { color: customTheme.colors.text }]}>
                    Login Streak
                  </CustomText>
                  {loginStats?.streak_active && (
                    <View style={[styles.activeBadge, { backgroundColor: customTheme.colors.active + '15' }]}>
                      <View style={[styles.activeBadgeDot, { backgroundColor: customTheme.colors.active }]} />
                      <CustomText style={[styles.activeBadgeText, { color: customTheme.colors.active }]}>
                        Active
                      </CustomText>
                  </View>
                  )}
                </View>
                {loadingStats ? (
                  <ActivityIndicator size="small" color={customTheme.colors.active} />
                ) : (
                  <View style={styles.streakStatsRow}>
                    <CustomText style={[styles.streakNumberCompact, { color: customTheme.colors.active }]}>
                      {loginStats?.current_streak || 0}
                    </CustomText>
                    <CustomText style={[styles.streakTextCompact, { color: customTheme.colors.subText }]}>
                      Best: {loginStats?.longest_streak || 0} • Total: {loginStats?.total_login_days || 0} days
                    </CustomText>
                  </View>
                )}
              </View>
            </View>
            {loginStats && !loginStats.logged_in_today && !loadingStats && (
              <View style={styles.streakWarningCompact}>
              <IconButton
                  icon="alert-circle"
                  size={14}
                  iconColor="#dc2626"
                  style={{ margin: 0 }}
                />
                <CustomText style={[styles.warningTextCompact, { color: '#dc2626' }]}>
                  Log in today to continue your streak!
                </CustomText>
            </View>
            )}
          </Card.Content>
        </Card>

        {/* Quick Stats - Active Goals and Challenges */}
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

        {/* Upcoming Deadlines - Collapsible */}
        {upcomingDeadlines.length > 0 && (
          <Card mode="elevated" style={styles.deadlinesCard}>
            <Card.Content>
              <TouchableOpacity
                onPress={() => setShowDeadlines(!showDeadlines)}
                style={[styles.deadlinesHeader, !showDeadlines && styles.deadlinesHeaderCollapsed]}
                activeOpacity={0.7}
              >
                <View style={styles.deadlinesHeaderLeft}>
                <IconButton 
                    icon="alert-circle"
                  size={20} 
                    iconColor={customTheme.colors.active}
                  style={{ margin: 0 }}
                />
                  <CustomText style={[styles.deadlinesTitle, { color: customTheme.colors.text }]}>
                    Upcoming Deadlines ({upcomingDeadlines.length})
                  </CustomText>
                </View>
                <IconButton 
                  icon={showDeadlines ? "chevron-up" : "chevron-down"}
                  size={20} 
                  iconColor={customTheme.colors.subText}
                  style={{ margin: 0 }}
                />
              </TouchableOpacity>
              {showDeadlines && (
                <>
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
                          <View style={[styles.deadlineTypeBadge, { backgroundColor: customTheme.colors.navBar }]}>
                            <CustomText style={[styles.deadlineTypeText, { color: customTheme.colors.subText }]}>
                              {deadline.type}
                            </CustomText>
                          </View>
                          <CustomText style={[styles.deadlineDate, { color: customTheme.colors.subText }]}>
                            {deadline.daysUntil === 0 ? 'Today' :
                             deadline.daysUntil === 1 ? 'Tomorrow' :
                             `${deadline.daysUntil}d`}
                          </CustomText>
        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
      </>
              )}
            </Card.Content>
          </Card>
        )}
      </View>
    );
  };

  /**
   * Renders the exercises info card at the top of the feed
   */

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loadingStats}
            onRefresh={fetchAllStats}
            colors={[customTheme.colors.active || '#800000']}
      />
        }
      >
        {renderStatsSection()}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
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
    marginBottom: 16,
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
  streakCard: {
    marginBottom: 12,
  },
  streakCardCompact: {
    marginBottom: 8,
  },
  streakCardContentCompact: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakHeaderCompact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakInfoCompact: {
    flex: 1,
    marginLeft: 4,
  },
  streakTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  streakTitleCompact: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  streakStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakNumberCompact: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  streakTextCompact: {
    fontSize: 12,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  activeBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
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
  streakWarningCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    padding: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
  },
  warningText: {
    fontSize: 12,
    flex: 1,
  },
  warningTextCompact: {
    fontSize: 11,
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  deadlinesHeaderCollapsed: {
    marginBottom: 0,
  },
  deadlinesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  deadlineTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  deadlineTypeText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  deadlineDate: {
    fontSize: 12,
  },
});

export default Home;
