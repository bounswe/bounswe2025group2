import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  getUserMentorRelationships,
  changeMentorRelationshipStatus,
  MentorRelationship,
} from '../services/mentorService';

const DEFAULT_PROFILE_PIC = require('../assets/temp_images/profile.png');

/**
 * MentorList component displays all active mentor-mentee relationships
 * for the current user, showing both mentors and mentees
 */
const MentorList = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  
  const [relationships, setRelationships] = useState<MentorRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mentor' | 'mentee'>('all');

  /**
   * Fetch mentor relationships from the API
   */
  const fetchRelationships = async () => {
    try {
      const data = await getUserMentorRelationships({
        status: 'ACCEPTED',
        ...(filter !== 'all' && { role: filter }),
      });
      setRelationships(data);
    } catch (error) {
      console.error('Error fetching relationships:', error);
      Alert.alert('Error', 'Failed to load mentor relationships');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRelationships();
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      fetchRelationships();
    }, [filter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRelationships();
  };

  /**
   * Handle terminating a mentor relationship
   */
  const handleTerminate = async (relationshipId: number) => {
    Alert.alert(
      'Terminate Relationship',
      'Are you sure you want to end this mentor-mentee relationship?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate',
          style: 'destructive',
          onPress: async () => {
            try {
              await changeMentorRelationshipStatus(relationshipId, 'TERMINATED');
              Alert.alert('Success', 'Relationship has been terminated');
              fetchRelationships();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to terminate relationship');
            }
          },
        },
      ]
    );
  };

  /**
   * Get the profile picture URL for a user
   */
  const getProfilePictureUrl = (username: string) => {
    return `http://164.90.166.81:8000/api/profile/other/picture/${username}/?t=${Date.now()}`;
  };

  /**
   * Render a single relationship item
   */
  const renderRelationshipItem = ({ item }: { item: MentorRelationship }) => {
    // Determine which user to display based on current user's role
    const isMentor = item.mentor_username !== item.mentee_username; // Simplified check
    const displayUsername = isMentor ? item.mentee_username : item.mentor_username;
    const role = isMentor ? 'Your Mentee' : 'Your Mentor';

    return (
      <View style={[styles.relationshipCard, { backgroundColor: colors.navBar }]}>
        <View style={styles.relationshipHeader}>
          <Image
            source={{ uri: getProfilePictureUrl(displayUsername) }}
            defaultSource={DEFAULT_PROFILE_PIC}
            style={styles.profilePic}
          />
          <View style={styles.userInfo}>
            <Text style={[styles.username, { color: colors.text }]}>
              {displayUsername}
            </Text>
            <Text style={[styles.roleText, { color: colors.subText }]}>
              {role}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.chatButton, { backgroundColor: colors.active }]}
            onPress={() => {
              // Navigate to chat with this user
              navigation.navigate('ChatDetail' as never, {
                recipientUsername: displayUsername,
              } as never);
            }}
          >
            <Text style={styles.buttonText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.terminateButton, { backgroundColor: colors.disconnected }]}
            onPress={() => handleTerminate(item.id)}
          >
            <Text style={styles.buttonText}>Terminate</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.dateText, { color: colors.subText }]}>
          Since {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  /**
   * Render the filter buttons
   */
  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === 'all' && { backgroundColor: colors.active },
          { borderColor: colors.border },
        ]}
        onPress={() => setFilter('all')}
      >
        <Text
          style={[
            styles.filterButtonText,
            { color: filter === 'all' ? '#fff' : colors.text },
          ]}
        >
          All
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === 'mentor' && { backgroundColor: colors.active },
          { borderColor: colors.border },
        ]}
        onPress={() => setFilter('mentor')}
      >
        <Text
          style={[
            styles.filterButtonText,
            { color: filter === 'mentor' ? '#fff' : colors.text },
          ]}
        >
          My Mentors
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === 'mentee' && { backgroundColor: colors.active },
          { borderColor: colors.border },
        ]}
        onPress={() => setFilter('mentee')}
      >
        <Text
          style={[
            styles.filterButtonText,
            { color: filter === 'mentee' ? '#fff' : colors.text },
          ]}
        >
          My Mentees
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.active} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          My Mentor Relationships
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.requestsButton, { backgroundColor: colors.active }]}
            onPress={() => navigation.navigate('MentorRequests' as never)}
          >
            <Text style={styles.addButtonText}>Requests</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.active }]}
            onPress={() => navigation.navigate('FindMentor' as never)}
          >
            <Text style={styles.addButtonText}>Find Mentor</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderFilterButtons()}

      <FlatList
        data={relationships}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRelationshipItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.active}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.subText }]}>
              No mentor relationships yet.
            </Text>
            <Text style={[styles.emptySubText, { color: colors.subText }]}>
              Tap "Find Mentor" to get started!
            </Text>
          </View>
        }
        contentContainerStyle={
          relationships.length === 0 ? styles.emptyList : styles.list
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  requestsButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  emptyList: {
    flex: 1,
  },
  relationshipCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  relationshipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  chatButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  terminateButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  dateText: {
    fontSize: 12,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
  },
});

export default MentorList;
