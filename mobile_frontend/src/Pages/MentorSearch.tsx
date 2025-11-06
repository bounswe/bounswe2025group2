/**
 * MentorSearch Page
 * 
 * Allows users to search and discover mentors based on various filters.
 * Users can view mentor profiles and send mentorship requests.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Avatar, Card, Chip, Button } from 'react-native-paper';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  searchMentors,
  getAvailableMentors,
  sendMentorshipRequest,
} from '../services/MentorService';
import { MentorProfile, MentorSearchFilters } from '../types/mentor';

const API_BASE = 'http://164.90.166.81:8000';

/**
 * Main MentorSearch Component
 */
const MentorSearch: React.FC = () => {
  const { colors } = useTheme();
  const { getAuthHeader, isAuthenticated } = useAuth();
  const navigation = useNavigation();

  // State management
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<MentorSearchFilters>({});
  const [selectedUserType, setSelectedUserType] = useState<'mentor' | 'coach' | 'all'>('all');

  /**
   * Fetches mentors based on current filters
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

      const currentFilters: MentorSearchFilters = {
        ...filters,
        search: searchQuery || undefined,
        user_type: selectedUserType === 'all' ? undefined : selectedUserType,
      };

      // Remove undefined values
      Object.keys(currentFilters).forEach(key => {
        if (currentFilters[key as keyof MentorSearchFilters] === undefined) {
          delete currentFilters[key as keyof MentorSearchFilters];
        }
      });

      let data: MentorProfile[];
      
      // If no filters, get all available mentors, otherwise search
      if (Object.keys(currentFilters).length === 0) {
        data = await getAvailableMentors(authHeader);
      } else {
        data = await searchMentors(currentFilters, authHeader);
      }

      setMentors(data);
    } catch (error) {
      console.error('Failed to fetch mentors:', error);
      Alert.alert('Error', 'Failed to load mentors. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, getAuthHeader, filters, searchQuery, selectedUserType]);

  /**
   * Handles refresh action
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMentors();
  }, [fetchMentors]);

  /**
   * Sends a mentorship request to a mentor
   */
  const handleSendRequest = async (mentorId: number, mentorName: string) => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'You must be logged in to send requests.');
      return;
    }

    Alert.alert(
      'Send Mentorship Request',
      `Would you like to request ${mentorName} as your mentor?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Request',
          onPress: async () => {
            try {
              await sendMentorshipRequest(
                {
                  to_user_id: mentorId,
                  request_type: 'MENTOR_REQUEST',
                  message: 'I would like you to be my mentor.',
                },
                getAuthHeader()
              );
              Alert.alert('Success', 'Mentorship request sent successfully!');
            } catch (error: any) {
              console.error('Failed to send request:', error);
              Alert.alert('Error', error.message || 'Failed to send request.');
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

  // Fetch mentors on mount and when filters change
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
          You need to be logged in to search for mentors.
        </CustomText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <CustomText style={[styles.headerTitle, { color: colors.text }]}>
          Find Mentors
        </CustomText>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.navBar }]}>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by name or username..."
          placeholderTextColor={colors.subText}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={fetchMentors}
        />
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: colors.active }]}
          onPress={fetchMentors}
        >
          <CustomText style={[styles.searchButtonText, { color: colors.background }]}>
            Search
          </CustomText>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            selected={selectedUserType === 'all'}
            onPress={() => setSelectedUserType('all')}
            style={styles.filterChip}
          >
            All
          </Chip>
          <Chip
            selected={selectedUserType === 'mentor'}
            onPress={() => setSelectedUserType('mentor')}
            style={styles.filterChip}
          >
            Mentors
          </Chip>
          <Chip
            selected={selectedUserType === 'coach'}
            onPress={() => setSelectedUserType('coach')}
            style={styles.filterChip}
          >
            Coaches
          </Chip>
        </ScrollView>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <CustomText style={[styles.resultsCount, { color: colors.subText }]}>
          {mentors.length} {mentors.length === 1 ? 'mentor' : 'mentors'} found
        </CustomText>
      </View>

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
              No Mentors Found
            </CustomText>
            <CustomText style={[styles.emptyDescription, { color: colors.subText }]}>
              {searchQuery
                ? 'Try adjusting your search criteria.'
                : 'No mentors are currently available.'}
            </CustomText>
          </View>
        ) : (
          <View style={styles.mentorsList}>
            {mentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                onSendRequest={handleSendRequest}
                onViewProfile={viewMentorProfile}
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
  mentor: MentorProfile;
  onSendRequest: (mentorId: number, mentorName: string) => void;
  onViewProfile: (username: string) => void;
  colors: any;
  authHeader: any;
}

const MentorCard: React.FC<MentorCardProps> = ({
  mentor,
  onSendRequest,
  onViewProfile,
  colors,
  authHeader,
}) => {
  const fullName = mentor.name && mentor.surname
    ? `${mentor.name} ${mentor.surname}`
    : mentor.username;

  const profilePictureUri = mentor.profile_picture
    ? `${API_BASE}/api/profile/other/picture/${mentor.username}/?t=${Date.now()}`
    : null;

  return (
    <Card style={[styles.mentorCard, { backgroundColor: colors.navBar }]} mode="outlined">
      <Card.Content>
        <View style={styles.mentorHeader}>
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

          <View style={styles.mentorInfo}>
            <CustomText style={[styles.mentorName, { color: colors.text }]}>
              {fullName}
            </CustomText>
            <CustomText style={[styles.mentorUsername, { color: colors.subText }]}>
              @{mentor.username}
            </CustomText>
            {mentor.user_type && (
              <Chip
                mode="flat"
                compact
                style={styles.userTypeChip}
              >
                {mentor.user_type}
              </Chip>
            )}
          </View>
        </View>

        {mentor.bio && (
          <CustomText
            style={[styles.mentorBio, { color: colors.subText }]}
            numberOfLines={2}
          >
            {mentor.bio}
          </CustomText>
        )}

        {mentor.location && (
          <View style={styles.infoRow}>
            <CustomText style={[styles.infoLabel, { color: colors.subText }]}>
              📍 {mentor.location}
            </CustomText>
          </View>
        )}

        <View style={styles.statsRow}>
          {mentor.mentee_count !== undefined && (
            <View style={styles.statItem}>
              <CustomText style={[styles.statNumber, { color: colors.active }]}>
                {mentor.mentee_count}
              </CustomText>
              <CustomText style={[styles.statLabel, { color: colors.subText }]}>
                Mentees
              </CustomText>
            </View>
          )}
          {mentor.experience_years !== undefined && (
            <View style={styles.statItem}>
              <CustomText style={[styles.statNumber, { color: colors.active }]}>
                {mentor.experience_years}
              </CustomText>
              <CustomText style={[styles.statLabel, { color: colors.subText }]}>
                Years
              </CustomText>
            </View>
          )}
          {mentor.rating !== undefined && (
            <View style={styles.statItem}>
              <CustomText style={[styles.statNumber, { color: colors.active }]}>
                ⭐ {mentor.rating.toFixed(1)}
              </CustomText>
              <CustomText style={[styles.statLabel, { color: colors.subText }]}>
                Rating
              </CustomText>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => onViewProfile(mentor.username)}
            style={styles.actionButton}
          >
            View Profile
          </Button>
          <Button
            mode="contained"
            onPress={() => onSendRequest(mentor.id, fullName)}
            style={styles.actionButton}
          >
            Request Mentor
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  searchButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 14,
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
    flexDirection: 'row',
    marginBottom: 12,
  },
  mentorInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
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
  userTypeChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  mentorBio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
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
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
});

export default MentorSearch;
