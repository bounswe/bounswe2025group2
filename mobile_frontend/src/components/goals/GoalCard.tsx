import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Card, Text, Chip, ProgressBar, useTheme } from 'react-native-paper';
import { FitnessGoal } from '../../services/goalApi';

interface GoalCardProps {
  goal: FitnessGoal;
  onPress?: () => void;
  showMentorBadge?: boolean;
}

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'ACTIVE': '#4CAF50',
    'COMPLETED': '#2196F3',
    'INACTIVE': '#FFC107',
    'RESTARTED': '#FF9800',
  };
  return colorMap[status] || '#757575';
};

export const GoalCard = ({
  goal,
  onPress,
  showMentorBadge = true,
}: GoalCardProps) => {
  const theme = useTheme();
  const progressPercentage = goal.progress_percentage / 100;

  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.cardContent}>
          {/* Header with Title and Status */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={{ fontSize: 16, marginRight: 4 }}>🎯</Text>
              <Text
                numberOfLines={2}
                style={[styles.title, { color: theme.colors.onSurface }]}
              >
                {goal.title}
              </Text>
            </View>
            <Chip
              style={{
                backgroundColor: getStatusColor(goal.status),
              }}
              textStyle={{ color: '#fff', fontSize: 10 }}
            >
              {goal.status}
            </Chip>
          </View>

          {/* Mentor Badge */}
          {showMentorBadge && goal.mentor && (
            <View style={styles.mentorBadgeContainer}>
              <Text style={{ fontSize: 12, marginRight: 4 }}>✓</Text>
              <Text style={styles.mentorBadgeText}>
                Assigned by mentor
              </Text>
            </View>
          )}

          {/* Description */}
          {goal.description && (
            <Text
              numberOfLines={2}
              style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
            >
              {goal.description}
            </Text>
          )}

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                Progress
              </Text>
              <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                {goal.progress_percentage.toFixed(1)}%
              </Text>
            </View>
            <ProgressBar
              progress={progressPercentage}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={{ fontSize: 10, color: theme.colors.onSurfaceVariant }}>
                Current
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
                {goal.current_value.toFixed(1)} {goal.unit}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={{ fontSize: 10, color: theme.colors.onSurfaceVariant }}>
                Target
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
                {goal.target_value.toFixed(1)} {goal.unit}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={{ fontSize: 10, color: theme.colors.onSurfaceVariant }}>
                Deadline
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
                {new Date(goal.target_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 0,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  cardContent: {
    padding: 12,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    marginTop: 2,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  mentorBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  mentorBadgeText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
  progressSection: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
});

export default GoalCard;
