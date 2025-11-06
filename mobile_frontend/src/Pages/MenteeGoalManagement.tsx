/**
 * MenteeGoalManagement Page
 * 
 * Allows mentors to view, create, update, and track goals for their mentees.
 * Mentors can also provide feedback and monitor progress.
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
  Modal,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Card, ProgressBar, Chip, Button, Divider } from 'react-native-paper';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  getMenteeGoals,
  createMenteeGoal,
  updateMenteeGoal,
  deleteMenteeGoal,
  provideFeedback,
} from '../services/MentorService';
import { MenteeGoal, CreateMenteeGoalPayload } from '../types/mentor';

// Goal type options
const GOAL_TYPES: { label: string; value: MenteeGoal['goal_type'] }[] = [
  { label: 'Walking/Running', value: 'WALKING_RUNNING' },
  { label: 'Workout', value: 'WORKOUT' },
  { label: 'Cycling', value: 'CYCLING' },
  { label: 'Sports', value: 'SPORTS' },
  { label: 'Swimming', value: 'SWIMMING' },
];

type ModalType = 'create' | 'edit' | 'feedback' | null;

/**
 * Main MenteeGoalManagement Component
 */
const MenteeGoalManagement: React.FC = () => {
  const { colors } = useTheme();
  const { getAuthHeader, isAuthenticated } = useAuth();
  const route = useRoute();

  // @ts-ignore
  const { menteeId, menteeName } = route.params || {};

  // State management
  const [goals, setGoals] = useState<MenteeGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedGoal, setSelectedGoal] = useState<MenteeGoal | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state for creating/editing goals
  const [goalForm, setGoalForm] = useState<CreateMenteeGoalPayload>({
    mentee_id: menteeId,
    title: '',
    description: '',
    goal_type: 'WALKING_RUNNING',
    target_value: 0,
    unit: '',
    target_date: new Date().toISOString(),
  });

  const [feedbackText, setFeedbackText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  /**
   * Fetches all goals for the mentee
   */
  const fetchGoals = useCallback(async () => {
    if (!isAuthenticated || !menteeId) {
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const authHeader = getAuthHeader();
      const data = await getMenteeGoals(menteeId, authHeader);
      setGoals(data);
    } catch (error) {
      console.error('Failed to fetch mentee goals:', error);
      Alert.alert('Error', 'Failed to load goals. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, getAuthHeader, menteeId]);

  /**
   * Handles refresh action
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGoals();
  }, [fetchGoals]);

  /**
   * Opens create goal modal
   */
  const openCreateModal = () => {
    setGoalForm({
      mentee_id: menteeId,
      title: '',
      description: '',
      goal_type: 'WALKING_RUNNING',
      target_value: 0,
      unit: '',
      target_date: new Date().toISOString(),
    });
    setModalType('create');
  };

  /**
   * Opens edit goal modal
   */
  const openEditModal = (goal: MenteeGoal) => {
    setSelectedGoal(goal);
    setGoalForm({
      mentee_id: menteeId,
      title: goal.title,
      description: goal.description || '',
      goal_type: goal.goal_type,
      target_value: goal.target_value,
      unit: goal.unit,
      target_date: goal.target_date,
    });
    setModalType('edit');
  };

  /**
   * Opens feedback modal
   */
  const openFeedbackModal = (goal: MenteeGoal) => {
    setSelectedGoal(goal);
    setFeedbackText(goal.feedback || '');
    setModalType('feedback');
  };

  /**
   * Handles creating a new goal
   */
  const handleCreateGoal = async () => {
    if (!goalForm.title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }
    if (goalForm.target_value <= 0) {
      Alert.alert('Error', 'Please enter a valid target value');
      return;
    }

    try {
      setActionLoading(true);
      await createMenteeGoal(goalForm, getAuthHeader());
      Alert.alert('Success', 'Goal created successfully!');
      setModalType(null);
      await fetchGoals();
    } catch (error: any) {
      console.error('Failed to create goal:', error);
      Alert.alert('Error', error.message || 'Failed to create goal.');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handles updating a goal
   */
  const handleUpdateGoal = async () => {
    if (!selectedGoal) return;

    if (!goalForm.title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }
    if (goalForm.target_value <= 0) {
      Alert.alert('Error', 'Please enter a valid target value');
      return;
    }

    try {
      setActionLoading(true);
      await updateMenteeGoal(selectedGoal.id, goalForm, getAuthHeader());
      Alert.alert('Success', 'Goal updated successfully!');
      setModalType(null);
      setSelectedGoal(null);
      await fetchGoals();
    } catch (error: any) {
      console.error('Failed to update goal:', error);
      Alert.alert('Error', error.message || 'Failed to update goal.');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handles deleting a goal
   */
  const handleDeleteGoal = async (goal: MenteeGoal) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMenteeGoal(goal.id, getAuthHeader());
              Alert.alert('Success', 'Goal deleted successfully.');
              await fetchGoals();
            } catch (error: any) {
              console.error('Failed to delete goal:', error);
              Alert.alert('Error', error.message || 'Failed to delete goal.');
            }
          },
        },
      ]
    );
  };

  /**
   * Handles providing feedback
   */
  const handleProvideFeedback = async () => {
    if (!selectedGoal) return;

    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please enter feedback');
      return;
    }

    try {
      setActionLoading(true);
      await provideFeedback(
        { goal_id: selectedGoal.id, feedback: feedbackText },
        getAuthHeader()
      );
      Alert.alert('Success', 'Feedback provided successfully!');
      setModalType(null);
      setSelectedGoal(null);
      setFeedbackText('');
      await fetchGoals();
    } catch (error: any) {
      console.error('Failed to provide feedback:', error);
      Alert.alert('Error', error.message || 'Failed to provide feedback.');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handles date change
   */
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (event.type === 'dismissed') {
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
      return;
    }
    
    if (selectedDate) {
      setGoalForm({ ...goalForm, target_date: selectedDate.toISOString() });
    }
  };

  // Fetch goals on mount
  useFocusEffect(
    useCallback(() => {
      fetchGoals();
    }, [fetchGoals])
  );

  // Render loading state
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.active} />
        <CustomText style={[styles.loadingText, { color: colors.subText }]}>
          Loading goals...
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
          You need to be logged in to manage mentee goals.
        </CustomText>
      </View>
    );
  }

  const activeGoals = goals.filter(g => g.status === 'ACTIVE');
  const completedGoals = goals.filter(g => g.status === 'COMPLETED');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <CustomText style={[styles.headerTitle, { color: colors.text }]}>
            Goals for {menteeName}
          </CustomText>
          <CustomText style={[styles.headerSubtitle, { color: colors.subText }]}>
            Manage and track progress
          </CustomText>
        </View>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.active }]}
          onPress={openCreateModal}
        >
          <CustomText style={[styles.createButtonText, { color: colors.background }]}>
            + New Goal
          </CustomText>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {goals.length > 0 && (
        <View style={[styles.statsContainer, { backgroundColor: colors.navBar }]}>
          <View style={styles.statItem}>
            <CustomText style={[styles.statNumber, { color: colors.active }]}>
              {goals.length}
            </CustomText>
            <CustomText style={[styles.statLabel, { color: colors.subText }]}>
              Total Goals
            </CustomText>
          </View>
          <View style={styles.statItem}>
            <CustomText style={[styles.statNumber, { color: colors.active }]}>
              {activeGoals.length}
            </CustomText>
            <CustomText style={[styles.statLabel, { color: colors.subText }]}>
              Active
            </CustomText>
          </View>
          <View style={styles.statItem}>
            <CustomText style={[styles.statNumber, { color: colors.active }]}>
              {completedGoals.length}
            </CustomText>
            <CustomText style={[styles.statLabel, { color: colors.subText }]}>
              Completed
            </CustomText>
          </View>
        </View>
      )}

      {/* Goals List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <CustomText style={[styles.emptyTitle, { color: colors.text }]}>
              No Goals Set
            </CustomText>
            <CustomText style={[styles.emptyDescription, { color: colors.subText }]}>
              Set a goal for {menteeName} to help them on their fitness journey!
            </CustomText>
            <Button
              mode="contained"
              style={styles.emptyButton}
              onPress={openCreateModal}
            >
              Create First Goal
            </Button>
          </View>
        ) : (
          <View style={styles.goalsList}>
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={openEditModal}
                onDelete={handleDeleteGoal}
                onProvideFeedback={openFeedbackModal}
                colors={colors}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create/Edit Goal Modal */}
      <Modal
        visible={modalType === 'create' || modalType === 'edit'}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setModalType(null)}>
              <CustomText style={[styles.modalButton, { color: colors.active }]}>
                Cancel
              </CustomText>
            </TouchableOpacity>
            <CustomText style={[styles.modalTitle, { color: colors.text }]}>
              {modalType === 'create' ? 'Create Goal' : 'Edit Goal'}
            </CustomText>
            <TouchableOpacity
              onPress={modalType === 'create' ? handleCreateGoal : handleUpdateGoal}
              disabled={actionLoading}
            >
              <CustomText style={[styles.modalButton, { color: colors.active }]}>
                {actionLoading ? 'Saving...' : 'Save'}
              </CustomText>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <CustomText style={[styles.inputLabel, { color: colors.text }]}>
                Title *
              </CustomText>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.navBar, color: colors.text, borderColor: colors.border }]}
                value={goalForm.title}
                onChangeText={(text) => setGoalForm({ ...goalForm, title: text })}
                placeholder="Enter goal title"
                placeholderTextColor={colors.subText}
              />
            </View>

            <View style={styles.inputGroup}>
              <CustomText style={[styles.inputLabel, { color: colors.text }]}>
                Description
              </CustomText>
              <TextInput
                style={[styles.textInput, styles.textArea, { backgroundColor: colors.navBar, color: colors.text, borderColor: colors.border }]}
                value={goalForm.description}
                onChangeText={(text) => setGoalForm({ ...goalForm, description: text })}
                placeholder="Describe the goal"
                placeholderTextColor={colors.subText}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <CustomText style={[styles.inputLabel, { color: colors.text }]}>
                Goal Type
              </CustomText>
              <View style={[styles.pickerContainer, { backgroundColor: colors.navBar, borderColor: colors.border }]}>
                <Picker
                  selectedValue={goalForm.goal_type}
                  onValueChange={(value) => setGoalForm({ ...goalForm, goal_type: value })}
                  style={{ color: colors.text }}
                >
                  {GOAL_TYPES.map((type) => (
                    <Picker.Item key={type.value} label={type.label} value={type.value} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, styles.inputGroupHalf, styles.inputGroupLeft]}>
                <CustomText style={[styles.inputLabel, { color: colors.text }]}>
                  Target Value *
                </CustomText>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.navBar, color: colors.text, borderColor: colors.border }]}
                  value={goalForm.target_value.toString()}
                  onChangeText={(text) => setGoalForm({ ...goalForm, target_value: Number(text) || 0 })}
                  placeholder="100"
                  placeholderTextColor={colors.subText}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, styles.inputGroupHalf, styles.inputGroupRight]}>
                <CustomText style={[styles.inputLabel, { color: colors.text }]}>
                  Unit
                </CustomText>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.navBar, color: colors.text, borderColor: colors.border }]}
                  value={goalForm.unit}
                  onChangeText={(text) => setGoalForm({ ...goalForm, unit: text })}
                  placeholder="steps, min, kg"
                  placeholderTextColor={colors.subText}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <CustomText style={[styles.inputLabel, { color: colors.text }]}>
                Target Date
              </CustomText>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: colors.navBar, borderColor: colors.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <CustomText style={[styles.dateButtonText, { color: colors.text }]}>
                  {new Date(goalForm.target_date).toLocaleDateString()}
                </CustomText>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={new Date(goalForm.target_date)}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        visible={modalType === 'feedback'}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setModalType(null)}>
              <CustomText style={[styles.modalButton, { color: colors.active }]}>
                Cancel
              </CustomText>
            </TouchableOpacity>
            <CustomText style={[styles.modalTitle, { color: colors.text }]}>
              Provide Feedback
            </CustomText>
            <TouchableOpacity onPress={handleProvideFeedback} disabled={actionLoading}>
              <CustomText style={[styles.modalButton, { color: colors.active }]}>
                {actionLoading ? 'Sending...' : 'Send'}
              </CustomText>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <CustomText style={[styles.inputLabel, { color: colors.text }]}>
                Feedback for {selectedGoal?.title}
              </CustomText>
              <TextInput
                style={[styles.textInput, styles.textArea, { backgroundColor: colors.navBar, color: colors.text, borderColor: colors.border }]}
                value={feedbackText}
                onChangeText={setFeedbackText}
                placeholder="Provide constructive feedback and encouragement..."
                placeholderTextColor={colors.subText}
                multiline
                numberOfLines={5}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

/**
 * Goal Card Component
 */
interface GoalCardProps {
  goal: MenteeGoal;
  onEdit: (goal: MenteeGoal) => void;
  onDelete: (goal: MenteeGoal) => void;
  onProvideFeedback: (goal: MenteeGoal) => void;
  colors: any;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete, onProvideFeedback, colors }) => {
  const progressPercentage = Math.min((goal.current_value / goal.target_value) * 100, 100);
  const isCompleted = goal.status === 'COMPLETED';

  return (
    <Card style={[styles.goalCard, { backgroundColor: colors.navBar }]} mode="outlined">
      <Card.Content>
        <View style={styles.goalHeader}>
          <CustomText style={[styles.goalTitle, { color: colors.text }]}>
            {goal.title}
          </CustomText>
          <Chip mode="flat" compact>
            {goal.status}
          </Chip>
        </View>

        {goal.description && (
          <CustomText style={[styles.goalDescription, { color: colors.subText }]}>
            {goal.description}
          </CustomText>
        )}

        <View style={styles.progressInfo}>
          <CustomText style={[styles.progressText, { color: colors.text }]}>
            {goal.current_value} / {goal.target_value} {goal.unit}
          </CustomText>
          <CustomText style={[styles.progressPercentage, { color: colors.active }]}>
            {progressPercentage.toFixed(0)}%
          </CustomText>
        </View>

        <ProgressBar
          progress={progressPercentage / 100}
          color={colors.active}
          style={styles.progressBar}
        />

        <CustomText style={[styles.targetDate, { color: colors.subText }]}>
          Target: {new Date(goal.target_date).toLocaleDateString()}
        </CustomText>

        {goal.feedback && (
          <View style={[styles.feedbackBox, { backgroundColor: colors.background }]}>
            <CustomText style={[styles.feedbackLabel, { color: colors.text }]}>
              Your Feedback:
            </CustomText>
            <CustomText style={[styles.feedbackText, { color: colors.subText }]}>
              {goal.feedback}
            </CustomText>
          </View>
        )}

        <Divider style={styles.divider} />

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => onProvideFeedback(goal)}
            style={styles.actionButton}
            icon="comment-text"
          >
            Feedback
          </Button>
          <Button
            mode="outlined"
            onPress={() => onEdit(goal)}
            style={styles.actionButton}
            icon="pencil"
          >
            Edit
          </Button>
          <Button
            mode="text"
            onPress={() => onDelete(goal)}
            style={styles.actionButton}
            textColor={colors.passive}
          >
            Delete
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 14,
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
  goalsList: {
    padding: 16,
  },
  goalCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  goalDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  targetDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  feedbackBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    marginVertical: 12,
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
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputGroupHalf: {
    flex: 1,
  },
  inputGroupLeft: {
    marginRight: 8,
  },
  inputGroupRight: {
    marginLeft: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 16,
  },
});

export default MenteeGoalManagement;
