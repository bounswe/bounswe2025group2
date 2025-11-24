import React, { useState } from 'react';
import {
  View,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import {
  Button,
  Text,
  Chip,
  ProgressBar,
  TextInput,
  Dialog,
  Portal,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import {
  FitnessGoal,
  useUpdateGoalProgress,
  useDeleteGoal,
} from '../../services/goalApi';

interface GoalDetailModalProps {
  isVisible: boolean;
  goal: FitnessGoal | null;
  onClose: () => void;
  isOwner?: boolean;
  isMentor?: boolean;
  onGoalUpdated?: () => void;
  onGoalDeleted?: () => void;
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

const getGoalTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'WALKING_RUNNING': 'Walking/Running',
    'WORKOUT': 'Workout',
    'CYCLING': 'Cycling',
    'SWIMMING': 'Swimming',
    'SPORTS': 'Sports',
  };
  return labels[type] || type;
};

export const GoalDetailModal = ({
  isVisible,
  goal,
  onClose,
  isOwner = false,
  isMentor = false,
  onGoalUpdated,
  onGoalDeleted,
}: GoalDetailModalProps) => {
  const theme = useTheme();
  const updateProgressMutation = useUpdateGoalProgress();
  const deleteGoalMutation = useDeleteGoal();

  const [newValue, setNewValue] = useState('');
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!goal) return null;

  const progressPercentage = goal.progress_percentage / 100;
  const daysRemaining = Math.ceil(
    (new Date(goal.target_date).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const handleUpdateProgress = async () => {
    if (!newValue || isNaN(parseFloat(newValue))) {
      Alert.alert('Invalid Input', 'Please enter a valid number');
      return;
    }

    try {
      const currentVal = parseFloat(newValue);
      await updateProgressMutation.mutateAsync({
        goalId: goal.id,
        currentValue: currentVal,
        status: currentVal >= goal.target_value ? 'COMPLETED' : 'ACTIVE',
      });
      setNewValue('');
      setShowUpdateDialog(false);
      Alert.alert('Success', 'Goal progress updated');
      onGoalUpdated?.();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update progress');
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      await deleteGoalMutation.mutateAsync(goal.id);
      Alert.alert('Success', 'Goal deleted successfully');
      onGoalDeleted?.();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete goal');
    }
  };

  return (
    <>
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
      >
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.outline }]}>
            <Button
              onPress={onClose}
              textColor={theme.colors.primary}
              style={styles.closeButton}
            >
              Close
            </Button>
            <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
              Goal Details
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
            {/* Title and Status */}
            <View
              style={[
                styles.section,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                  {goal.title}
                </Text>
                <Chip
                  style={{
                    backgroundColor: getStatusColor(goal.status),
                  }}
                  textStyle={{ color: '#fff' }}
                >
                  {goal.status}
                </Chip>
              </View>
              {goal.description && (
                <Text
                  style={[
                    styles.description,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {goal.description}
                </Text>
              )}
              {goal.mentor && (
                <View
                  style={[
                    styles.mentorInfo,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <Text style={{ color: '#4CAF50', fontSize: 14, marginRight: 4 }}>✓</Text>
                  <Text style={{ color: '#4CAF50', fontSize: 12 }}>
                    Assigned by your mentor
                  </Text>
                </View>
              )}
            </View>

            {/* Goal Type and Date */}
            <View style={styles.section}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                    Goal Type
                  </Text>
                  <Text
                    style={[styles.infoValue, { color: theme.colors.onSurface }]}
                  >
                    {getGoalTypeLabel(goal.goal_type)}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                    Start Date
                  </Text>
                  <Text
                    style={[styles.infoValue, { color: theme.colors.onSurface }]}
                  >
                    {new Date(goal.start_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                    Target Date
                  </Text>
                  <Text
                    style={[styles.infoValue, { color: theme.colors.onSurface }]}
                  >
                    {new Date(goal.target_date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                    Days Remaining
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      {
                        color:
                          daysRemaining < 0
                            ? '#FF6B6B'
                            : daysRemaining < 7
                            ? '#FFC107'
                            : '#4CAF50',
                      },
                    ]}
                  >
                    {daysRemaining > 0 ? daysRemaining : 'Expired'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Progress Section */}
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.onSurface },
                ]}
              >
                Progress
              </Text>
              <View style={styles.progressContainer}>
                <Text
                  style={[
                    styles.progressPercentage,
                    { color: theme.colors.primary },
                  ]}
                >
                  {goal.progress_percentage.toFixed(1)}%
                </Text>
                <ProgressBar
                  progress={progressPercentage}
                  color={theme.colors.primary}
                  style={styles.progressBar}
                />
              </View>

              <View style={styles.progressDetails}>
                <View style={styles.progressItem}>
                  <Text
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      fontSize: 12,
                    }}
                  >
                    Current
                  </Text>
                  <Text
                    style={[
                      styles.progressValue,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {goal.current_value.toFixed(1)}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      fontSize: 11,
                    }}
                  >
                    {goal.unit}
                  </Text>
                </View>

                <View style={styles.progressItem}>
                  <Text
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      fontSize: 12,
                    }}
                  >
                    Target
                  </Text>
                  <Text
                    style={[
                      styles.progressValue,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {goal.target_value.toFixed(1)}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      fontSize: 11,
                    }}
                  >
                    {goal.unit}
                  </Text>
                </View>

                <View style={styles.progressItem}>
                  <Text
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      fontSize: 12,
                    }}
                  >
                    Remaining
                  </Text>
                  <Text
                    style={[
                      styles.progressValue,
                      {
                        color:
                          goal.current_value >= goal.target_value
                            ? '#4CAF50'
                            : theme.colors.primary,
                      },
                    ]}
                  >
                    {Math.max(0, goal.target_value - goal.current_value).toFixed(
                      1
                    )}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      fontSize: 11,
                    }}
                  >
                    {goal.unit}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            {isOwner && (
              <View style={styles.section}>
                <Button
                  mode="contained"
                  onPress={() => setShowUpdateDialog(true)}
                  disabled={deleteGoalMutation.isPending}
                  style={styles.actionButton}
                  icon="pencil"
                >
                  Update Progress
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setShowDeleteConfirm(true)}
                  disabled={deleteGoalMutation.isPending}
                  style={styles.actionButton}
                  textColor="#FF6B6B"
                >
                  Delete Goal
                </Button>
              </View>
            )}

            {isMentor && !isOwner && (
              <View style={styles.section}>
                <Text
                  style={[
                    styles.infoText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  You are the mentor for this goal. Your mentee can update the progress.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Update Progress Dialog */}
      <Portal>
        <Dialog visible={showUpdateDialog} onDismiss={() => setShowUpdateDialog(false)}>
          <Dialog.Title>Update Progress</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="New Value"
              value={newValue}
              onChangeText={setNewValue}
              keyboardType="decimal-pad"
              placeholder={`Current: ${goal.current_value}`}
              mode="outlined"
              style={styles.dialogInput}
            />
            <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              Unit: {goal.unit}
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              Target: {goal.target_value} {goal.unit}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowUpdateDialog(false)}>Cancel</Button>
            <Button
              onPress={handleUpdateProgress}
              loading={updateProgressMutation.isPending}
              disabled={updateProgressMutation.isPending}
            >
              Update
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={showDeleteConfirm} onDismiss={() => setShowDeleteConfirm(false)}>
          <Dialog.Title>Delete Goal</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this goal? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button
              onPress={handleDelete}
              textColor="#FF6B6B"
              loading={deleteGoalMutation.isPending}
              disabled={deleteGoalMutation.isPending}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    minWidth: 'auto',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingBottom: 20,
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  mentorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '700',
    marginVertical: 4,
  },
  actionButton: {
    marginVertical: 6,
  },
  dialogInput: {
    marginVertical: 8,
  },
});

export default GoalDetailModal;
