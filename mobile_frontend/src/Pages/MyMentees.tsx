/**
 * MyMentees Page
 * 
 * Displays all mentees that the current user is mentoring.
 * Mentors can view mentee details, track their progress, set goals, and provide feedback.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Avatar, Card, Button, Divider, FAB } from 'react-native-paper';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  getMyMentees,
  endMentorship,
} from '../services/MentorService';
import { MentorshipRelationship } from '../types/mentor';

const API_BASE = 'http://164.90.166.81:8000';

/**
 * Main MyMentees Component
 */
const MyMentees: React.FC = () => {
  const { colors } = useTheme();
  const { getAuthHeader, isAuthenticated } = useAuth();
  const navigation = useNavigation();

  // State management
  const [mentees, setMentees] = useState<MentorshipRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Fetches all mentees
   */
  const fetchMentees = useCallback(async () => {
    if (!isAuthenticated) {
      setMentees([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const authHeader = getAuthHeader();
      const data = await getMyMentees(authHeader);
      setMentees(data);
    } catch (error) {
      console.error('Failed to fetch mentees:', error);
      Alert.alert('Error', 'Failed to load mentees. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, getAuthHeader]);

  /**
   * Handles refresh action
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMentees();
  }, [fetchMentees]);

  /**
   * Handles ending a mentorship
   */
  const handleEndMentorship = async (relationship: MentorshipRelationship) => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'You must be logged in to perform this action.');
      return;
    }

    const menteeName = relationship.mentee.name && relationship.mentee.surname
      ? `${relationship.mentee.name} ${relationship.mentee.surname}`
      : relationship.mentee.username;

    Alert.alert(
      'End Mentorship',
      `Are you sure you want to end your mentorship with ${menteeName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Mentorship',
          style: 'destructive',
          onPress: async () => {
            try {
              await endMentorship(relationship.id, getAuthHeader());
              Alert.alert('Success', 'Mentorship ended successfully.');
              await fetchMentees();
            } catch (error: any) {
              console.error('Failed to end mentorship:', error);
              Alert.alert('Error', error.message || 'Failed to end mentorship.');
            }
          },
        },
      ]
    );
  };

  /**
   * Navigates to mentee profile
   */
  const viewMenteeProfile = (username: string) => {
    // @ts-ignore
    navigation.navigate('Profile', { username });
  };

  /**
   * Opens goal management for a mentee
   */
  const manageGoals = (relationship: MentorshipRelationship) => {
    // @ts-ignore
    navigation.navigate('MenteeGoalManagement', {
      menteeId: relationship.mentee.id,
      menteeName: relationship.mentee.name && relationship.mentee.surname
        ? `${relationship.mentee.name} ${relationship.mentee.surname}`
        : relationship.mentee.username,
    });
  };

  // Fetch mentees on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchMentees();
    }, [fetchMentees])
  );

  // Render loading state
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.active} />
        <CustomText style={[styles.loadingText, { color: colors.subText }]}>
          Loading mentees...
        </CustomText>
      </View>
    );
  }

  // Render not authenticated state
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <CustomText style={[styles.emptyTitle, { color: colors.text }]}>
          Please Log In
        </CustomText>
        <CustomText style={[styles.emptyDescription, { color: colors.subText }]}>
          You need to be logged in to view your mentees.
        </CustomText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <CustomText style={[styles.headerTitle, { color: colors.text }]}>
          My Mentees
        </CustomText>
      </View>

      {/* Stats */}
      {mentees.length > 0 && (
        <View style={[styles.statsContainer, { backgroundColor: colors.navBar }]}>
          <View style={styles.statItem}>
            <CustomText style={[styles.statNumber, { color: colors.active }]}>
              {mentees.length}
            </CustomText>
            <CustomText style={[styles.statLabel, { color: colors.subText }]}>
              {mentees.length === 1 ? 'Mentee' : 'Mentees'}
            </CustomText>
          </View>
          <View style={styles.statItem}>
            <CustomText style={[styles.statNumber, { color: colors.active }]}>
              {mentees.reduce((sum, m) => sum + (m.goals_count || 0), 0)}
            </CustomText>
            <CustomText style={[styles.statLabel, { color: colors.subText }]}>
              Goals Set
            </CustomText>
          </View>
          <View style={styles.statItem}>
            <CustomText style={[styles.statNumber, { color: colors.active }]}>
              {mentees.reduce((sum, m) => sum + (m.active_goals_count || 0), 0)}
            </CustomText>
            <CustomText style={[styles.statLabel, { color: colors.subText }]}>
              Active Goals
            </CustomText>
          </View>
        </View>
      )}

      {/* Mentees List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {mentees.length === 0 ? (
          <View style={styles.emptyState}>
            <CustomText style={[styles.emptyTitle, { color: colors.text }]}>
              No Mentees Yet
            </CustomText>
            <CustomText style={[styles.emptyDescription, { color: colors.subText }]}>
              You don't have any mentees yet. Check your mentorship requests to see if anyone wants you as their mentor!
            </CustomText>
            <Button
              mode="contained"
              style={styles.emptyButton}
              onPress={() => {
                // @ts-ignore
                navigation.navigate('MentorshipRequests');
              }}
            >
              View Requests
            </Button>
          </View>
        ) : (
          <View style={styles.menteesList}>
            {mentees.map((relationship) => (
              <MenteeCard
                key={relationship.id}
                relationship={relationship}
                onViewProfile={viewMenteeProfile}
                onManageGoals={manageGoals}
                onEndMentorship={handleEndMentorship}
                colors={colors}
                authHeader={getAuthHeader()}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

/**
 * Individual Mentee Card Component
 */
interface MenteeCardProps {
  relationship: MentorshipRelationship;
  onViewProfile: (username: string) => void;
  onManageGoals: (relationship: MentorshipRelationship) => void;
  onEndMentorship: (relationship: MentorshipRelationship) => void;
  colors: any;
  authHeader: any;
}

const MenteeCard: React.FC<MenteeCardProps> = ({
  relationship,
  onViewProfile,
  onManageGoals,
  onEndMentorship,
  colors,
  authHeader,
}) => {
  const mentee = relationship.mentee;
  const fullName = mentee.name && mentee.surname
    ? `${mentee.name} ${mentee.surname}`
    : mentee.username;

  const profilePictureUri = mentee.profile_picture
    ? `${API_BASE}/api/profile/other/picture/${mentee.username}/?t=${Date.now()}`
    : null;

  const relationshipDuration = getRelationshipDuration(relationship.established_at);

  return (
    <Card style={[styles.menteeCard, { backgroundColor: colors.navBar }]} mode="outlined">
      <Card.Content>
        <View style={styles.menteeHeader}>
          <TouchableOpacity
            onPress={() => onViewProfile(mentee.username)}
            style={styles.menteeInfo}
          >
            {profilePictureUri ? (
              <Avatar.Image
                size={60}
                source={{
                  uri: profilePictureUri,
                  headers: authHeader,
                }}
              />
            ) : (
              <Avatar.Text
                size={60}
                label={mentee.username[0]?.toUpperCase() || '?'}
              />
            )}

            <View style={styles.menteeDetails}>
              <CustomText style={[styles.menteeName, { color: colors.text }]}>
                {fullName}
              </CustomText>
              <CustomText style={[styles.menteeUsername, { color: colors.subText }]}>
                @{mentee.username}
              </CustomText>
              <CustomText style={[styles.relationshipDuration, { color: colors.subText }]}>
                Mentoring for {relationshipDuration}
              </CustomText>
            </View>
          </TouchableOpacity>
        </View>

        {mentee.bio && (
          <CustomText
            style={[styles.menteeBio, { color: colors.subText }]}
            numberOfLines={2}
          >
            {mentee.bio}
          </CustomText>
        )}

        <Divider style={styles.divider} />

        <View style={styles.goalsInfo}>
          <View style={styles.goalsStat}>
            <CustomText style={[styles.goalsNumber, { color: colors.active }]}>
              {relationship.goals_count || 0}
            </CustomText>
            <CustomText style={[styles.goalsLabel, { color: colors.subText }]}>
              Total Goals
            </CustomText>
          </View>
          <View style={styles.goalsStat}>
            <CustomText style={[styles.goalsNumber, { color: colors.active }]}>
              {relationship.active_goals_count || 0}
            </CustomText>
            <CustomText style={[styles.goalsLabel, { color: colors.subText }]}>
              Active Goals
            </CustomText>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={() => onManageGoals(relationship)}
            style={styles.actionButton}
            icon="flag"
          >
            Manage Goals
          </Button>
          <Button
            mode="outlined"
            onPress={() => onViewProfile(mentee.username)}
            style={styles.actionButton}
          >
            Profile
          </Button>
        </View>

        <Button
          mode="text"
          onPress={() => onEndMentorship(relationship)}
          style={styles.endButton}
          textColor={colors.passive}
        >
          End Mentorship
        </Button>
      </Card.Content>
    </Card>
  );
};

/**
 * Utility function to calculate relationship duration
 */
const getRelationshipDuration = (establishedAt: string): string => {
  const established = new Date(establishedAt);
  const now = new Date();
  const monthsDiff = Math.floor(
    (now.getTime() - established.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  if (monthsDiff < 1) return 'less than a month';
  if (monthsDiff === 1) return '1 month';
  if (monthsDiff < 12) return `${monthsDiff} months`;
  
  const years = Math.floor(monthsDiff / 12);
  return years === 1 ? '1 year' : `${years} years`;
};

// ────────────────────────────────────────────────────────────────────────────
// 🎨 STYLES
// ────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  menteesList: {
    padding: 16,
  },
  menteeCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  menteeHeader: {
    marginBottom: 12,
  },
  menteeInfo: {
    flexDirection: 'row',
  },
  menteeDetails: {
    marginLeft: 12,
    justifyContent: 'center',
    flex: 1,
  },
  menteeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  menteeUsername: {
    fontSize: 14,
    marginBottom: 4,
  },
  relationshipDuration: {
    fontSize: 12,
  },
  menteeBio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  divider: {
    marginVertical: 12,
  },
  goalsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    marginBottom: 12,
  },
  goalsStat: {
    alignItems: 'center',
  },
  goalsNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  goalsLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
  },
  endButton: {
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    marginTop: 8,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
});

export default MyMentees;
