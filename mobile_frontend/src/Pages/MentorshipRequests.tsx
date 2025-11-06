/**
 * MentorshipRequests Page
 * 
 * Displays and manages incoming and outgoing mentorship requests.
 * Users can approve, reject, or cancel requests.
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
import { Avatar, Card, Button, Chip } from 'react-native-paper';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  getMentorshipRequests,
  respondToMentorshipRequest,
  cancelMentorshipRequest,
} from '../services/MentorService';
import { MentorshipRequest } from '../types/mentor';

const API_BASE = 'http://164.90.166.81:8000';

type TabType = 'incoming' | 'outgoing';

/**
 * Main MentorshipRequests Component
 */
const MentorshipRequests: React.FC = () => {
  const { colors } = useTheme();
  const { getAuthHeader, isAuthenticated } = useAuth();
  const navigation = useNavigation();

  // State management
  const [incomingRequests, setIncomingRequests] = useState<MentorshipRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('incoming');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  /**
   * Fetches all mentorship requests
   */
  const fetchRequests = useCallback(async () => {
    if (!isAuthenticated) {
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const authHeader = getAuthHeader();
      const data = await getMentorshipRequests(authHeader);
      
      setIncomingRequests(data.incoming || []);
      setOutgoingRequests(data.outgoing || []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      Alert.alert('Error', 'Failed to load mentorship requests. Please try again.');
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
    fetchRequests();
  }, [fetchRequests]);

  /**
   * Handles approving a mentorship request
   */
  const handleApprove = async (request: MentorshipRequest) => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'You must be logged in to perform this action.');
      return;
    }

    const requesterName = request.from_user.name && request.from_user.surname
      ? `${request.from_user.name} ${request.from_user.surname}`
      : request.from_user.username;

    const requestTypeText = request.request_type === 'MENTOR_REQUEST'
      ? 'wants you as their mentor'
      : 'wants to be your mentor';

    Alert.alert(
      'Approve Request',
      `${requesterName} ${requestTypeText}. Do you want to approve this request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              setActionLoading(request.id);
              await respondToMentorshipRequest(
                { request_id: request.id, action: 'approve' },
                getAuthHeader()
              );
              Alert.alert('Success', 'Mentorship request approved!');
              await fetchRequests();
            } catch (error: any) {
              console.error('Failed to approve request:', error);
              Alert.alert('Error', error.message || 'Failed to approve request.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  /**
   * Handles rejecting a mentorship request
   */
  const handleReject = async (request: MentorshipRequest) => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'You must be logged in to perform this action.');
      return;
    }

    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this mentorship request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(request.id);
              await respondToMentorshipRequest(
                { request_id: request.id, action: 'reject' },
                getAuthHeader()
              );
              Alert.alert('Success', 'Mentorship request rejected.');
              await fetchRequests();
            } catch (error: any) {
              console.error('Failed to reject request:', error);
              Alert.alert('Error', error.message || 'Failed to reject request.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  /**
   * Handles canceling an outgoing request
   */
  const handleCancel = async (request: MentorshipRequest) => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'You must be logged in to perform this action.');
      return;
    }

    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this mentorship request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(request.id);
              await cancelMentorshipRequest(request.id, getAuthHeader());
              Alert.alert('Success', 'Mentorship request cancelled.');
              await fetchRequests();
            } catch (error: any) {
              console.error('Failed to cancel request:', error);
              Alert.alert('Error', error.message || 'Failed to cancel request.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  /**
   * Navigates to user profile
   */
  const viewProfile = (username: string) => {
    // @ts-ignore
    navigation.navigate('Profile', { username });
  };

  // Fetch requests on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [fetchRequests])
  );

  // Render loading state
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.active} />
        <CustomText style={[styles.loadingText, { color: colors.subText }]}>
          Loading requests...
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
          You need to be logged in to view mentorship requests.
        </CustomText>
      </View>
    );
  }

  const currentRequests = activeTab === 'incoming' ? incomingRequests : outgoingRequests;
  const pendingRequests = currentRequests.filter(r => r.status === 'PENDING');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <CustomText style={[styles.headerTitle, { color: colors.text }]}>
          Mentorship Requests
        </CustomText>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'incoming' && { borderBottomColor: colors.active },
          ]}
          onPress={() => setActiveTab('incoming')}
        >
          <CustomText
            style={[
              styles.tabText,
              { color: activeTab === 'incoming' ? colors.active : colors.subText },
            ]}
          >
            Incoming ({incomingRequests.filter(r => r.status === 'PENDING').length})
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'outgoing' && { borderBottomColor: colors.active },
          ]}
          onPress={() => setActiveTab('outgoing')}
        >
          <CustomText
            style={[
              styles.tabText,
              { color: activeTab === 'outgoing' ? colors.active : colors.subText },
            ]}
          >
            Outgoing ({outgoingRequests.filter(r => r.status === 'PENDING').length})
          </CustomText>
        </TouchableOpacity>
      </View>

      {/* Requests List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {pendingRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <CustomText style={[styles.emptyTitle, { color: colors.text }]}>
              No {activeTab === 'incoming' ? 'Incoming' : 'Outgoing'} Requests
            </CustomText>
            <CustomText style={[styles.emptyDescription, { color: colors.subText }]}>
              {activeTab === 'incoming'
                ? "You don't have any pending mentorship requests."
                : "You haven't sent any mentorship requests."}
            </CustomText>
          </View>
        ) : (
          <View style={styles.requestsList}>
            {pendingRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                isIncoming={activeTab === 'incoming'}
                onApprove={handleApprove}
                onReject={handleReject}
                onCancel={handleCancel}
                onViewProfile={viewProfile}
                colors={colors}
                authHeader={getAuthHeader()}
                isLoading={actionLoading === request.id}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

/**
 * Individual Request Card Component
 */
interface RequestCardProps {
  request: MentorshipRequest;
  isIncoming: boolean;
  onApprove: (request: MentorshipRequest) => void;
  onReject: (request: MentorshipRequest) => void;
  onCancel: (request: MentorshipRequest) => void;
  onViewProfile: (username: string) => void;
  colors: any;
  authHeader: any;
  isLoading: boolean;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  isIncoming,
  onApprove,
  onReject,
  onCancel,
  onViewProfile,
  colors,
  authHeader,
  isLoading,
}) => {
  const user = isIncoming ? request.from_user : request.to_user;
  const fullName = user.name && user.surname
    ? `${user.name} ${user.surname}`
    : user.username;

  const profilePictureUri = user.profile_picture
    ? `${API_BASE}/api/profile/other/picture/${user.username}/?t=${Date.now()}`
    : null;

  const requestTypeText = request.request_type === 'MENTOR_REQUEST'
    ? isIncoming
      ? 'wants you as their mentor'
      : 'you requested as mentor'
    : isIncoming
    ? 'wants to be your mentor'
    : 'you requested to be mentee';

  const timeAgo = getTimeAgo(request.created_at);

  return (
    <Card style={[styles.requestCard, { backgroundColor: colors.navBar }]} mode="outlined">
      <Card.Content>
        <View style={styles.requestHeader}>
          <TouchableOpacity
            onPress={() => onViewProfile(user.username)}
            style={styles.userInfo}
          >
            {profilePictureUri ? (
              <Avatar.Image
                size={50}
                source={{
                  uri: profilePictureUri,
                  headers: authHeader,
                }}
              />
            ) : (
              <Avatar.Text
                size={50}
                label={user.username[0]?.toUpperCase() || '?'}
              />
            )}

            <View style={styles.userDetails}>
              <CustomText style={[styles.userName, { color: colors.text }]}>
                {fullName}
              </CustomText>
              <CustomText style={[styles.userUsername, { color: colors.subText }]}>
                @{user.username}
              </CustomText>
            </View>
          </TouchableOpacity>

          <Chip mode="flat" compact>
            {request.request_type === 'MENTOR_REQUEST' ? 'Mentor' : 'Mentee'}
          </Chip>
        </View>

        <CustomText style={[styles.requestText, { color: colors.text }]}>
          {requestTypeText}
        </CustomText>

        {request.message && (
          <View style={[styles.messageBox, { backgroundColor: colors.background }]}>
            <CustomText style={[styles.messageText, { color: colors.subText }]}>
              "{request.message}"
            </CustomText>
          </View>
        )}

        <CustomText style={[styles.timeText, { color: colors.subText }]}>
          {timeAgo}
        </CustomText>

        {/* Action Buttons */}
        {isIncoming ? (
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => onReject(request)}
              style={styles.actionButton}
              disabled={isLoading}
            >
              Reject
            </Button>
            <Button
              mode="contained"
              onPress={() => onApprove(request)}
              style={styles.actionButton}
              loading={isLoading}
              disabled={isLoading}
            >
              Accept
            </Button>
          </View>
        ) : (
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => onCancel(request)}
              style={[styles.actionButton, { flex: 1 }]}
              loading={isLoading}
              disabled={isLoading}
            >
              Cancel Request
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

/**
 * Utility function to calculate time ago
 */
const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (secondsAgo < 60) return 'Just now';
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
  if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`;
  return date.toLocaleDateString();
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  requestsList: {
    padding: 16,
  },
  requestCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 8,
  },
  userDetails: {
    marginLeft: 12,
    justifyContent: 'center',
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
  },
  requestText: {
    fontSize: 15,
    marginBottom: 8,
  },
  messageBox: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  messageText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  timeText: {
    fontSize: 12,
    marginBottom: 12,
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

export default MentorshipRequests;
