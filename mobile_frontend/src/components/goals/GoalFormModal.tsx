import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Button,
  TextInput,
  SegmentedButtons,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  useCreateGoal,
  useUpdateGoal,
  GOAL_TYPES,
  getSuggestedUnits,
  type FitnessGoal,
  type GoalFormData,
} from '../../services/goalApi';
import { useTheme } from 'react-native-paper';

interface GoalFormModalProps {
  isVisible: boolean;
  onClose: () => void;
  editingGoal?: FitnessGoal | null;
  targetUserId?: number;
  onSuccess?: () => void;
}

export const GoalFormModal = ({
  isVisible,
  onClose,
  editingGoal,
  targetUserId,
  onSuccess,
}: GoalFormModalProps) => {
  const theme = useTheme();
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();

  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    goal_type: 'SPORTS',
    target_value: 100,
    unit: 'minutes',
    target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [suggestedUnits, setSuggestedUnits] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSubmitting = createGoalMutation.isPending || updateGoalMutation.isPending;

  useEffect(() => {
    if (editingGoal) {
      setFormData({
        title: editingGoal.title,
        description: editingGoal.description || '',
        goal_type: editingGoal.goal_type,
        target_value: editingGoal.target_value,
        unit: editingGoal.unit,
        target_date: editingGoal.target_date.split('T')[0],
      } as GoalFormData);
    } else {
      setFormData({
        title: '',
        description: '',
        goal_type: 'SPORTS',
        target_value: 100,
        unit: 'minutes',
        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      } as GoalFormData);
    }
    setErrors({});
  }, [editingGoal, isVisible]);

  const handleGoalTypeChange = (value: string) => {
    setFormData((prev: GoalFormData) => ({
      ...prev,
      goal_type: value,
    }));
    const units = getSuggestedUnits(value);
    setSuggestedUnits(units);
    if (units.length > 0 && !units.includes(formData.unit)) {
      setFormData((prev: GoalFormData) => ({
        ...prev,
        unit: units[0],
      }));
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFormData((prev) => ({
        ...prev,
        target_date: dateString,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.target_value || formData.target_value <= 0) {
      newErrors.target_value = 'Target value must be greater than 0';
    }
    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit is required';
    }
    if (!formData.target_date) {
      newErrors.target_date = 'Target date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingGoal) {
        await updateGoalMutation.mutateAsync({
          goalId: editingGoal.id,
          data: formData,
        });
        Alert.alert('Success', 'Goal updated successfully');
      } else {
        const payload = targetUserId
          ? { ...formData, user: targetUserId }
          : formData;
        await createGoalMutation.mutateAsync(payload as any);
        Alert.alert('Success', 'Goal created successfully');
      }
      onSuccess?.();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save goal');
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Button
              onPress={onClose}
              textColor={theme.colors.primary}
              style={styles.closeButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
              style={styles.submitButton}
            >
              {editingGoal ? 'Update' : 'Create'}
            </Button>
          </View>

          <View style={styles.form}>
            {/* Title */}
            <TextInput
              label="Goal Title *"
              value={formData.title}
              onChangeText={(text) =>
                setFormData((prev: GoalFormData) => ({ ...prev, title: text }))
              }
              mode="outlined"
              placeholder="e.g., Run 5K"
              editable={!isSubmitting}
              style={styles.input}
            />
            {errors.title && (
              <HelperText type="error">{errors.title}</HelperText>
            )}

            {/* Goal Type */}
            <View style={styles.formGroup}>
              <SegmentedButtons
                value={formData.goal_type}
                onValueChange={handleGoalTypeChange}
                buttons={GOAL_TYPES.map((gt: any) => ({
                  value: gt.value,
                  label: gt.label,
                  style: { flex: 1 },
                }))}
                style={styles.segmentedButtons}
              />
            </View>

            {/* Description */}
            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) =>
                setFormData((prev: GoalFormData) => ({ ...prev, description: text }))
              }
              mode="outlined"
              placeholder="Describe your goal and motivation..."
              multiline
              numberOfLines={3}
              editable={!isSubmitting}
              style={styles.input}
            />

            {/* Target Value */}
            <TextInput
              label="Target Value *"
              value={formData.target_value.toString()}
              onChangeText={(text) =>
                setFormData((prev: GoalFormData) => ({
                  ...prev,
                  target_value: parseFloat(text) || 0,
                }))
              }
              mode="outlined"
              placeholder="Enter target value"
              keyboardType="decimal-pad"
              editable={!isSubmitting}
              style={styles.input}
            />
            {errors.target_value && (
              <HelperText type="error">{errors.target_value}</HelperText>
            )}

            {/* Unit */}
            <TextInput
              label="Unit *"
              value={formData.unit}
              onChangeText={(text) =>
                setFormData((prev: GoalFormData) => ({ ...prev, unit: text }))
              }
              mode="outlined"
              placeholder="e.g., km, minutes"
              editable={!isSubmitting}
              style={styles.input}
            />
            {errors.unit && <HelperText type="error">{errors.unit}</HelperText>}
            {suggestedUnits.length > 0 && (
              <HelperText type="info">
                Suggested: {suggestedUnits.join(', ')}
              </HelperText>
            )}

            {/* Target Date */}
            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              disabled={isSubmitting}
              style={styles.dateButton}
            >
              Target Date: {formData.target_date}
            </Button>
            {errors.target_date && (
              <HelperText type="error">{errors.target_date}</HelperText>
            )}

            {/* Date Picker */}
            {showDatePicker && (
              <DateTimePicker
                value={new Date(formData.target_date)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {isSubmitting && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    minWidth: 'auto',
  },
  submitButton: {
    minWidth: 'auto',
  },
  form: {
    padding: 16,
    gap: 12,
  },
  formGroup: {
    marginVertical: 8,
  },
  input: {
    marginVertical: 4,
  },
  segmentedButtons: {
    marginVertical: 8,
  },
  dateButton: {
    marginVertical: 8,
    paddingVertical: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
});

export default GoalFormModal;
