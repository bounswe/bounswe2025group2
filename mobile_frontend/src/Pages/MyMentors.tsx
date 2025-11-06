/**
 * MyMentors Page
 * 
 * Displays all mentors that the current user has.
 * Users can view mentor details, track goals set by mentors, and manage relationships.
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
import { Avatar, Card, Button, Chip, Divider } from 'react-native-paper';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  getMyMentors,
  endMentorship,
  getMenteeGoals,
} from '../services/MentorService';
import { MentorshipRelationship, MenteeGoal } from '../types/mentor';

const API_BASE = 'http://164.90.166.81:8000';

/**
 * Main MyMentors Component
 */
const MyMentors: React.FC = () => {
  const { colors } = useTheme();
  const { getAuthHeader, isAuthenticated } = useAuth();
  const navigation = useNavigation();

  // State management
  const [mentors, setMentors] = useState<MentorshipRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Fetches all mentors
   */
  const fetchMentors = useCallback(async () => {
    if (!isAuthenticated) {
      setMentors([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const authHeader = getAuthHeader();
      const data = await getMyMentors(authHeader);
      setMentors(data);
    } catch (error) {
      console.error('Failed to fetch mentors:', error);
      Alert.alert('Error', 'Failed to load mentors. Please try again.');
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
    fetchMentors();
  }, [fetchMentors]);

  /**
   * Handles ending a mentorship
   */
  const handleEndMentorship = async (relationship: MentorshipRelationship) => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'You must be logged in to perform this action.');
      return;
    }

    const mentorName = relationship.mentor.name && relationship.mentor.surname
      ? `${relationship.mentor.name} ${relationship.mentor.surname}`
      : relationship.mentor.username;

    Alert.alert(
      'End Mentorship',
      `Are you sure you want to end your mentorship with ${mentorName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Mentorship',
          style: 'destructive',
          onPress: async () => {
            try {
              await endMentorship(relationship.id, getAuthHeader());
              Alert.alert('Success', 'Mentorship ended successfully.');
              await fetchMentors();
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
   * Navigates to mentor profile
   */
  const viewMentorProfile = (username: string) => {
    // @ts-ignore
    navigation.navigate('Profile', { username });
  };

  /**
   * Views goals set by mentor
   */
  const viewGoalsFromMentor = async (relationship: MentorshipRelationship) => {
    try {
      // Navigate to Goals page and filter by mentor
      // @ts-ignore
      navigation.navigate('Goals', { filterByMentor: relationship.mentor.id });
    } catch (error) {
      console.error('Failed to view goals:', error);
      Alert.alert('Error', 'Failed to load goals.');
    }
  };

  // Fetch mentors on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchMentors();
    }, [fetchMentors])
  );

  // Render loading state
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.active} />
        <CustomText style={[styles.loadingText, { color: colors.subText }]}>
          Loading mentors...
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
          You need to be logged in to view your mentors.
        </CustomText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <CustomText style={[styles.headerTitle, { color: colors.text }]}>
          My Mentors
        </CustomText>
        <TouchableOpacity
          onPress={() => {
            // @ts-ignore
            navigation.navigate('MentorSearch');
          }}
        >
          <CustomText style={[styles.addButton, { color: colors.active }]}>
            + Find Mentor
          </CustomText>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {mentors.length > 0 && (
        <View style={[styles.statsContainer, { backgroundColor: colors.navBar }]}>
          <View style={styles.statItem}>
            <CustomText style={[styles.statNumber, { color: colors.active }]}>
              {mentors.length}
            </CustomText>
            <CustomText style={[styles.statLabel, { color: colors.subText }]}>
              {mentors.length === 1 ? 'Mentor' : 'Mentors'}
            </CustomText>
          </View>
          <View style={styles.statItem}>
            <CustomText style={[styles.statNumber, { color: colors.active }]}>
              {mentors.reduce((sum, m) => sum + (m.active_goals_count || 0), 0)}
            </CustomText>
            <CustomText style={[styles.statLabel, { color: colors.subText }]}>
              Active Goals
            </CustomText>
          </View>
        </View>
      )}

      {/* Mentors List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {mentors.length === 0 ? (
          <View style={styles.emptyState}>
            <CustomText style={[styles.emptyTitle, { color: colors.text }]}>
              No Mentors Yet
            </CustomText>
            <CustomText style={[styles.emptyDescription, { color: colors.subText }]}>
              You don't have any mentors yet. Find a mentor to help guide your fitness journey!
            </CustomText>
            <Button
              mode="contained"
              style={styles.emptyButton}
              onPress={() => {
                // @ts-ignore
                navigation.navigate('MentorSearch');
              }}
            >
              Find a Mentor
            </Button>
          </View>
        ) : (
          <View style={styles.mentorsList}>
            {mentors.map((relationship) => (
              <MentorCard
                key={relationship.id}
                relationship={relationship}
                onViewProfile={viewMentorProfile}
                onViewGoals={viewGoalsFromMentor}
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
 * Individual Mentor Card Component
 */
interface MentorCardProps {
  relationship: MentorshipRelationship;
  onViewProfile: (username: string) => void;
  onViewGoals: (relationship: MentorshipRelationship) => void;
  onEndMentorship: (relationship: MentorshipRelationship) => void;
  colors: any;
  authHeader: any;
}

const MentorCard: React.FC<MentorCardProps> = ({
  relationship,
  onViewProfile,
  onViewGoals,
  onEndMentorship,
  colors,
  authHeader,
}) => {
  const mentor = relationship.mentor;
  const fullName = mentor.name && mentor.surname
    ? `${mentor.name} ${mentor.surname}`
    : mentor.username;

  const profilePictureUri = mentor.profile_picture
    ? `${API_BASE}/api/profile/other/picture/${mentor.username}/?t=${Date.now()}`
    : null;

  const relationshipDuration = getRelationshipDuration(relationship.established_at);

  return (
    <Card style={[styles.mentorCard, { backgroundColor: colors.navBar }]} mode="outlined">
      <Card.Content>
        <View style={styles.mentorHeader}>
          <TouchableOpacity
            onPress={() => onViewProfile(mentor.username)}
            style={styles.mentorInfo}
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
                label={mentor.username[0]?.toUpperCase() || '?'}
              />
            )}

            <View style={styles.mentorDetails}>
              <CustomText style={[styles.mentorName, { color: colors.text }]}>
                {fullName}
              </CustomText>
              <CustomText style={[styles.mentorUsername, { color: colors.subText }]}>
                @{mentor.username}
              </CustomText>
              <CustomText style={[styles.relationshipDuration, { color: colors.subText }]}>
                Mentoring for {relationshipDuration}
              </CustomText>
            </View>
          </TouchableOpacity>
        </View>

        {mentor.bio && (
          <CustomText
            style={[styles.mentorBio, { color: colors.subText }]}
            numberOfLines={2}
          >
            {mentor.bio}
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
            mode="outlined"
            onPress={() => onViewGoals(relationship)}
            style={styles.actionButton}
          >
            View Goals
          </Button>
          <Button
            mode="text"
            onPress={() => onEndMentorship(relationship)}
            style={styles.actionButton}
            textColor={colors.passive}
          >
            End
          </Button>
        </View>
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
  addButton: {
    fontSize: 16,
    fontWeight: '600',
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
  mentorsList: {
    padding: 16,
  },
  mentorCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  mentorHeader: {
    marginBottom: 12,
  },
  mentorInfo: {
    flexDirection: 'row',
  },
  mentorDetails: {
    marginLeft: 12,
    justifyContent: 'center',
    flex: 1,
  },
  mentorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  mentorUsername: {
    fontSize: 14,
    marginBottom: 4,
  },
  relationshipDuration: {
    fontSize: 12,
  },
  mentorBio: {
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
  },
  actionButton: {
    flex: 1,
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

export default MyMentors;
