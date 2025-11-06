/**
 * Mentor Notification Component
 * 
 * Handles displaying and managing mentor-related notifications:
 * - Mentorship requests received
 * - Goals assigned by mentors
 * - Feedback from mentors
 * - Mentee progress updates
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Avatar, Card, Button, Chip } from 'react-native-paper';
import CustomText from './CustomText';

const API_BASE = 'http://164.90.166.81:8000';

/**
 * Type for mentor-related notifications
 */
export type MentorNotificationType =
  | 'mentorship_request_received'
  | 'mentorship_request_approved'
  | 'goal_assigned'
  | 'feedback_received'
  | 'mentee_progress_update'
  | 'mentee_goal_completed';

export interface MentorNotification {
  id: string;
  type: MentorNotificationType;
  title: string;
  message: string;
  relatedUser?: {
    id: number;
    username: string;
    name?: string;
    surname?: string;
    profile_picture?: string;
  };
  relatedGoal?: {
    id: number;
    title: string;
    status: string;
  };
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

/**
 * Props for MentorNotificationCard
 */
interface MentorNotificationCardProps {
  notification: MentorNotification;
  onPress: () => void;
  onActionClick: (action: string) => void;
  colors: any;
  authHeader: any;
}

/**
 * Individual Mentor Notification Card Component
 */
export const MentorNotificationCard: React.FC<MentorNotificationCardProps> = ({
  notification,
  onPress,
  onActionClick,
  colors,
  authHeader,
}) => {
  const getIcon = (type: MentorNotificationType): string => {
    switch (type) {
      case 'mentorship_request_received':
        return 'account-plus';
      case 'mentorship_request_approved':
        return 'account-check';
      case 'goal_assigned':
        return 'flag';
      case 'feedback_received':
        return 'comment-text';
      case 'mentee_progress_update':
        return 'progress-check';
      case 'mentee_goal_completed':
        return 'check-circle';
      default:
        return 'bell';
    }
  };

  const getChipLabel = (type: MentorNotificationType): string => {
    switch (type) {
      case 'mentorship_request_received':
        return 'Request';
      case 'mentorship_request_approved':
        return 'Approved';
      case 'goal_assigned':
        return 'Goal';
      case 'feedback_received':
        return 'Feedback';
      case 'mentee_progress_update':
        return 'Progress';
      case 'mentee_goal_completed':
        return 'Completed';
      default:
        return 'Mentor';
    }
  };

  const getChipColor = (type: MentorNotificationType): string => {
    switch (type) {
      case 'mentorship_request_received':
        return colors.passive; // Orange/warning
      case 'mentorship_request_approved':
        return colors.active; // Green/success
      case 'goal_assigned':
        return colors.active; // Green
      case 'feedback_received':
        return colors.active; // Green
      case 'mentee_progress_update':
        return colors.active; // Green
      case 'mentee_goal_completed':
        return colors.active; // Green
      default:
        return colors.subText;
    }
  };

  const profilePictureUri = notification.relatedUser?.profile_picture
    ? `${API_BASE}/api/profile/other/picture/${notification.relatedUser.username}/?t=${Date.now()}`
    : null;

  const userName = notification.relatedUser?.name && notification.relatedUser?.surname
    ? `${notification.relatedUser.name} ${notification.relatedUser.surname}`
    : notification.relatedUser?.username || 'User';

  const timeAgo = getTimeAgo(notification.timestamp);

  return (
    <Card
      style={[
        styles.notificationCard,
        {
          backgroundColor: notification.read ? colors.background : colors.navBar,
          borderLeftColor: getChipColor(notification.type),
        },
      ]}
      mode="outlined"
      onPress={onPress}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.headerRow}>
          {notification.relatedUser && profilePictureUri ? (
            <Avatar.Image
              size={40}
              source={{
                uri: profilePictureUri,
                headers: authHeader,
              }}
            />
          ) : notification.relatedUser ? (
            <Avatar.Text
              size={40}
              label={notification.relatedUser.username[0]?.toUpperCase() || '?'}
            />
          ) : null}

          <View style={styles.contentSection}>
            <View style={styles.titleRow}>
              <CustomText
                style={[styles.title, { color: colors.text }]}
                numberOfLines={1}
              >
                {notification.title}
              </CustomText>
              <Chip
                mode="flat"
                compact
                style={{ backgroundColor: getChipColor(notification.type) }}
              >
                {getChipLabel(notification.type)}
              </Chip>
            </View>

            <CustomText
              style={[styles.message, { color: colors.subText }]}
              numberOfLines={2}
            >
              {notification.message}
            </CustomText>

            {notification.relatedGoal && (
              <View style={[styles.goalInfo, { backgroundColor: colors.background }]}>
                <CustomText style={[styles.goalTitle, { color: colors.text }]}>
                  Goal: {notification.relatedGoal.title}
                </CustomText>
                <CustomText style={[styles.goalStatus, { color: colors.subText }]}>
                  {notification.relatedGoal.status}
                </CustomText>
              </View>
            )}

            <CustomText style={[styles.timestamp, { color: colors.subText }]}>
              {timeAgo}
            </CustomText>
          </View>
        </View>

        {/* Action Buttons for specific notification types */}
        {notification.type === 'mentorship_request_received' && (
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => onActionClick('reject')}
              style={styles.actionButton}
              compact
            >
              Decline
            </Button>
            <Button
              mode="contained"
              onPress={() => onActionClick('accept')}
              style={styles.actionButton}
              compact
            >
              Accept
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

/**
 * Mentor Notifications List Component
 */
interface MentorNotificationsListProps {
  notifications: MentorNotification[];
  onNotificationPress: (notification: MentorNotification) => void;
  onActionClick: (notificationId: string, action: string) => void;
  colors: any;
  authHeader: any;
}

export const MentorNotificationsList: React.FC<MentorNotificationsListProps> = ({
  notifications,
  onNotificationPress,
  onActionClick,
  colors,
  authHeader,
}) => {
  if (notifications.length === 0) {
    return (
      <View style={styles.emptyState}>
        <CustomText style={[styles.emptyTitle, { color: colors.text }]}>
          No Notifications
        </CustomText>
        <CustomText style={[styles.emptyDescription, { color: colors.subText }]}>
          You don't have any mentor-related notifications at the moment.
        </CustomText>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {notifications.map((notification) => (
        <MentorNotificationCard
          key={notification.id}
          notification={notification}
          onPress={() => onNotificationPress(notification)}
          onActionClick={(action) => onActionClick(notification.id, action)}
          colors={colors}
          authHeader={authHeader}
        />
      ))}
    </View>
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
  notificationCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  cardContent: {
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contentSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  goalInfo: {
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  goalStatus: {
    fontSize: 12,
  },
  timestamp: {
    fontSize: 12,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  listContainer: {
    padding: 12,
  },
});
