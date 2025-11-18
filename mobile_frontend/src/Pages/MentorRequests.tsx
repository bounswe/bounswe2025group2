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
  getCurrentUser,
  MentorRelationship,
} from '../services/mentorService';

const DEFAULT_PROFILE_PIC = require('../assets/temp_images/profile.png');

/**
 * MentorRequests component displays and manages pending mentor-mentee requests
 * Shows both incoming (received) and outgoing (sent) requests
 */
const MentorRequests = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  
  const [incomingRequests, setIncomingRequests] = useState<MentorRelationship[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<MentorRelationship[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  /**
   * Fetch current user and pending requests
   */
  const fetchRequests = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUserId(user.id);

      const [incoming, outgoing] = await Promise.all([
        getUserMentorRelationships({ status: 'PENDING', as: 'receiver' }),
        getUserMentorRelationships({ status: 'PENDING', as: 'sender' }),
      ]);

      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
    } catch (error) {
      console.error('Error fetching requests:', error);
      Alert.alert('Error', 'Failed to load mentor requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  /**
   * Handle accepting a mentor request
   */
  const handleAccept = async (relationshipId: number) => {
    setProcessingId(relationshipId);
    try {
      await changeMentorRelationshipStatus(relationshipId, 'ACCEPTED');
      Alert.alert('Success', 'Mentor request accepted!');
      fetchRequests();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept request');
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * Handle rejecting a mentor request
   */
  const handleReject = async (relationshipId: number) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this mentor request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(relationshipId);
            try {
              await changeMentorRelationshipStatus(relationshipId, 'REJECTED');
              Alert.alert('Success', 'Request rejected');
              fetchRequests();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reject request');
            } finally {
              setProcessingId(null);
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
   * Render an incoming request item
   */
  const renderIncomingRequest = ({ item }: { item: MentorRelationship }) => {
    const isProcessing = processingId === item.id;
    const senderUsername = item.sender_username;
    const role = item.mentor === item.sender ? 'wants to be your mentor' : 'wants you as their mentor';

    return (
      <View style={[styles.requestCard, { backgroundColor: colors.navBar }]}>
        <View style={styles.requestHeader}>
          <Image
            source={{ uri: getProfilePictureUrl(senderUsername) }}
            defaultSource={DEFAULT_PROFILE_PIC}
            style={styles.profilePic}
          />
          <View style={styles.requestInfo}>
            <Text style={[styles.username, { color: colors.text }]}>
              {senderUsername}
            </Text>
            <Text style={[styles.roleText, { color: colors.subText }]}>
              {role}
            </Text>
            <Text style={[styles.dateText, { color: colors.subText }]}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.acceptButton,
              { backgroundColor: isProcessing ? colors.subText : colors.connected },
            ]}
            onPress={() => handleAccept(item.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Accept</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.rejectButton,
              { backgroundColor: isProcessing ? colors.subText : colors.disconnected },
            ]}
            onPress={() => handleReject(item.id)}
            disabled={isProcessing}
          >
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /**
   * Render an outgoing request item
   */
  const renderOutgoingRequest = ({ item }: { item: MentorRelationship }) => {
    const receiverUsername = item.receiver_username;
    const role = item.mentor === currentUserId ? 'Mentee Request' : 'Mentor Request';

    return (
      <View style={[styles.requestCard, { backgroundColor: colors.navBar }]}>
        <View style={styles.requestHeader}>
          <Image
            source={{ uri: getProfilePictureUrl(receiverUsername) }}
            defaultSource={DEFAULT_PROFILE_PIC}
            style={styles.profilePic}
          />
          <View style={styles.requestInfo}>
            <Text style={[styles.username, { color: colors.text }]}>
              {receiverUsername}
            </Text>
            <Text style={[styles.roleText, { color: colors.subText }]}>
              {role}
            </Text>
            <Text style={[styles.dateText, { color: colors.subText }]}>
              Sent {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={[styles.pendingBadge, { backgroundColor: colors.subText2 }]}>
          <Text style={styles.pendingText}>Pending</Text>
        </View>
      </View>
    );
  };

  /**
   * Render tab buttons
   */
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'incoming' && { borderBottomColor: colors.active, borderBottomWidth: 3 },
        ]}
        onPress={() => setActiveTab('incoming')}
      >
        <Text
          style={[
            styles.tabText,
            { color: activeTab === 'incoming' ? colors.active : colors.subText },
          ]}
        >
          Incoming ({incomingRequests.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'outgoing' && { borderBottomColor: colors.active, borderBottomWidth: 3 },
        ]}
        onPress={() => setActiveTab('outgoing')}
      >
        <Text
          style={[
            styles.tabText,
            { color: activeTab === 'outgoing' ? colors.active : colors.subText },
          ]}
        >
          Outgoing ({outgoingRequests.length})
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

  const displayRequests = activeTab === 'incoming' ? incomingRequests : outgoingRequests;
  const renderItem = activeTab === 'incoming' ? renderIncomingRequest : renderOutgoingRequest;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Mentor Requests</Text>
        <TouchableOpacity
          style={[styles.findButton, { backgroundColor: colors.active }]}
          onPress={() => navigation.navigate('FindMentor' as never)}
        >
          <Text style={styles.findButtonText}>Find Mentor</Text>
        </TouchableOpacity>
      </View>

      {renderTabs()}

      <FlatList
        data={displayRequests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
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
              {activeTab === 'incoming' 
                ? 'No incoming requests' 
                : 'No outgoing requests'}
            </Text>
          </View>
        }
        contentContainerStyle={
          displayRequests.length === 0 ? styles.emptyList : styles.list
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
  },
  findButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  findButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  emptyList: {
    flex: 1,
  },
  requestCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
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
  requestInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
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
  pendingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pendingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  },
});

export default MentorRequests;
