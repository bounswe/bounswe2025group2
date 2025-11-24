import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import CookieManager from '@react-native-cookies/cookies';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../constants/api';

// ──────────────────────────────────────────────────────────────────────────────
// 📋 TYPE DEFINITIONS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Represents a fitness goal with all its properties
 */
interface Goal {
  id: number;
  title: string;
  description: string;
  user: number;
  mentor: number | null;
  goal_type: 'WALKING_RUNNING' | 'WORKOUT' | 'CYCLING' | 'SPORTS' | 'SWIMMING';
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;   // ISO format
  target_date: string;  // ISO format
  status: 'ACTIVE' | 'COMPLETED' | 'RESTARTED';
  last_updated: string; // ISO format
}

/**
 * Form data for creating a new goal
 */
interface CreateGoalForm {
  title: string;
  description: string;
  goal_type: Goal['goal_type'];
  target_value: string;
  unit: string;
  target_date: Date;
}

/**
 * Form data for editing an existing goal
 */
interface EditGoalForm {
  title: string;
  description: string;
  goal_type: Goal['goal_type'];
  target_value: string;
  unit: string;
  target_date: Date;
}


/**
 * Tab filter options
 */
type TabFilter = 'ACTIVE' | 'COMPLETED' | 'ALL';

/**
 * Modal types for different operations
 */
type ModalType = 'create' | 'edit' | 'progress' | null;

/**
 * Goal Suggestions API response
 */
interface GoalSuggestionResponse {
  is_realistic: boolean;
  warning_message: string | null;
  target_value: number;
  unit: string;
  days_to_complete: number;
  goal_type: 'WALKING_RUNNING' | 'WORKOUT' | 'CYCLING' | 'SWIMMING' | 'SPORTS';
  tips: string[];
}

// ──────────────────────────────────────────────────────────────────────────────
// 🌐 API CONFIGURATION
// ──────────────────────────────────────────────────────────────────────────────

// Note: Trailing slash required for Django's APPEND_SLASH=True configuration
const GOALS_ENDPOINT = `${API_URL}goals/`;
const GOAL_SUGGESTIONS_ENDPOINT = `${API_URL}/goals/suggestions/`;

/**
 * Extracts the origin (base URL) for Referer header
 */
const getOrigin = (): string => {
  return API_URL.replace(/\/api\/?$/, '');
};

/**
 * Fetches CSRF token from cookies for authenticated requests
 * If not available, bootstraps it by making a GET request
 */
const getCSRFToken = async (): Promise<string> => {
  try {
    const cookies = await CookieManager.get(API_URL);
    const token = cookies?.csrftoken?.value || '';
    
    // If we have a valid token, return it
    if (token && token.length >= 32) {
      return token;
    }
    
    // Bootstrap CSRF token by making a GET request (similar to Login.tsx)
    const origin = getOrigin();
    const bootstrapUrl = `${API_URL}quotes/random/`;
    try {
      await fetch(bootstrapUrl, {
        method: 'GET',
        headers: {
          'Referer': origin,
        },
        credentials: 'include',
      });
      
      // Try to get token again after bootstrap
      const cookiesAfter = await CookieManager.get(API_URL);
      const tokenAfter = cookiesAfter?.csrftoken?.value || '';
      if (tokenAfter && tokenAfter.length >= 32) {
        return tokenAfter;
      }
    } catch (bootstrapError) {
      console.warn('Failed to bootstrap CSRF token:', bootstrapError);
    }
    
    return '';
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return '';
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// 🎯 GOAL TYPE OPTIONS
// ──────────────────────────────────────────────────────────────────────────────

const GOAL_TYPES: { label: string; value: Goal['goal_type'] }[] = [
  { label: 'Walking/Running', value: 'WALKING_RUNNING' },
  { label: 'Workout', value: 'WORKOUT' },
  { label: 'Cycling', value: 'CYCLING' },
  { label: 'Sports', value: 'SPORTS' },
  { label: 'Swimming', value: 'SWIMMING' },
];

// ──────────────────────────────────────────────────────────────────────────────
// 🧮 UTILITY FUNCTIONS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Calculates the number of days between two dates
 */
const calculateDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = end.getTime() - start.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * Calculates progress percentage
 */
const calculateProgressPercentage = (current: number, target: number): number => {
  if (target === 0) {
    return 0;
  }
  return Math.min(Math.round((current / target) * 100), 100);
};

/**
 * Checks if a goal has passed its deadline
 * Note: Deadline day itself is still considered active (not expired)
 */
const isGoalExpired = (targetDate: string): boolean => {
  const target = new Date(targetDate);
  const today = new Date();
  
  // Set both dates to start of day for accurate comparison
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  // Goal is expired only if target date is before today (not on deadline day)
  return target < today;
};

/**
 * Formats a date for display
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};


// ──────────────────────────────────────────────────────────────────────────────
// 🎨 REUSABLE COMPONENTS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Tab component for filtering goals by status
 */
interface TabsProps {
  activeTab: TabFilter;
  onTabChange: (tab: TabFilter) => void;
  colors: any;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange, colors }) => {
  const tabs: { label: string; value: TabFilter }[] = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'All', value: 'ALL' },
  ];

  return (
    <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.value}
          style={[
            styles.tab,
            activeTab === tab.value && { borderBottomColor: colors.active },
          ]}
          onPress={() => onTabChange(tab.value)}
        >
          <CustomText
            style={[
              styles.tabText,
              { color: activeTab === tab.value ? colors.active : colors.subText },
            ]}
          >
            {tab.label}
          </CustomText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

/**
 * Statistics row showing goal counts and completion rate
 */
interface StatsRowProps {
  goals: Goal[];
  colors: any;
}

const StatsRow: React.FC<StatsRowProps> = ({ goals, colors }) => {
  // Active goals that haven't expired (deadline day is still considered active)
  const activeGoals = goals.filter(goal => goal.status === 'ACTIVE' && !isGoalExpired(goal.target_date)).length;
  const completedGoals = goals.filter(goal => goal.status === 'COMPLETED').length;
  const totalGoals = goals.length;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return (
    <View style={[styles.statsContainer, { backgroundColor: colors.navBar }]}>
      <View style={styles.statItem}>
        <CustomText style={[styles.statNumber, { color: colors.active }]}>
          {activeGoals}
        </CustomText>
        <CustomText style={[styles.statLabel, { color: colors.subText }]}>
          Active
        </CustomText>
      </View>
      <View style={styles.statItem}>
        <CustomText style={[styles.statNumber, { color: colors.active }]}>
          {completedGoals}
        </CustomText>
        <CustomText style={[styles.statLabel, { color: colors.subText }]}>
          Completed
        </CustomText>
      </View>
      <View style={styles.statItem}>
        <CustomText style={[styles.statNumber, { color: colors.active }]}>
          {completionRate}%
        </CustomText>
        <CustomText style={[styles.statLabel, { color: colors.subText }]}>
          Success Rate
        </CustomText>
      </View>
    </View>
  );
};

/**
 * Individual goal card component
 */
interface GoalCardProps {
  goal: Goal;
  onPress: () => void;
  onLongPress: () => void;
  colors: any;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onPress, onLongPress, colors }) => {
  const progressPercentage = calculateProgressPercentage(goal.current_value, goal.target_value);
  const daysRemaining = calculateDaysBetween(new Date().toISOString(), goal.target_date);
  const isExpired = isGoalExpired(goal.target_date);
  const isCompleted = goal.status === 'COMPLETED';
  const isActionable = !isExpired && !isCompleted && goal.status === 'ACTIVE';

  return (
    <TouchableOpacity
      style={[
        styles.goalCard,
        { backgroundColor: colors.background, borderColor: colors.border },
        !isActionable && styles.disabledCard,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!isActionable && !isCompleted}
    >
      <View style={styles.goalHeader}>
        <CustomText style={[styles.goalTitle, { color: colors.text }]}>
          {goal.title}
        </CustomText>
        <CustomText style={[styles.goalType, { color: colors.subText }]}>
          {GOAL_TYPES.find(type => type.value === goal.goal_type)?.label}
        </CustomText>
      </View>

      <CustomText style={[styles.goalDescription, { color: colors.subText }]}>
        {goal.description}
      </CustomText>

      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <CustomText style={[styles.progressText, { color: colors.text }]}>
            {goal.current_value} / {goal.target_value} {goal.unit}
          </CustomText>
          <CustomText style={[styles.progressPercentage, { color: colors.active }]}>
            {progressPercentage}%
          </CustomText>
        </View>
        {/* Progress bar with high contrast: light background, active color fill */}
        <View style={[styles.progressBar, { backgroundColor: colors.navBar }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercentage}%`,
                backgroundColor: colors.active,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.goalFooter}>
        <CustomText style={[styles.goalDate, { color: colors.subText }]}>
          Target: {formatDate(goal.target_date)}
        </CustomText>
        <CustomText
          style={[
            styles.goalStatus,
            { color: isExpired ? colors.passive : colors.active },
          ]}
        >
          {isCompleted
            ? 'Completed'
            : isExpired
            ? 'Deadline passed'
            : `Time left: ${daysRemaining} days`} {/* Shows 0 days on deadline day */}
        </CustomText>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Create Goal Modal Component
 */
interface CreateGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (formData: CreateGoalForm) => void;
  colors: any;
  loading: boolean;
  getAuthHeader: () => Record<string, string>;
  isAuthenticated: boolean;
}

const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  visible,
  onClose,
  onSubmit,
  colors,
  loading,
  getAuthHeader,
  isAuthenticated,
}) => {
  const [formData, setFormData] = useState<CreateGoalForm>({
    title: '',
    description: '',
    goal_type: 'WALKING_RUNNING',
    target_value: '',
    unit: '',
    target_date: new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [suggestionResult, setSuggestionResult] = useState<GoalSuggestionResponse | null>(null);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      goal_type: 'WALKING_RUNNING',
      target_value: '',
      unit: '',
      target_date: new Date(),
    });
    setSuggestionError(null);
    setSuggestionResult(null);
  };

  // Reset form to default values when modal becomes visible to prevent stale data
  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  const fetchSuggestions = async () => {
    if (!isAuthenticated) {
      Alert.alert('Error', 'You must be logged in to get suggestions.');
      return;
    }

    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a goal title to get suggestions.');
      return;
    }

    try {
      setIsLoadingSuggestions(true);
      setSuggestionError(null);
      setSuggestionResult(null);

      const csrfToken = await getCSRFToken();

      const response = await fetch(GOAL_SUGGESTIONS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || '',
        }),
      });

      if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        const retryAfter = data.retry_after_seconds || data.detail?.match(/\d+/)?.[0] || 0;
        const waitMinutes = Math.ceil(retryAfter / 60);
        setSuggestionError(`You've reached the hourly limit for AI suggestions. Please try again in ${waitMinutes} minutes.`);
        return;
      }

      if (!response.ok) {
        try {
          const errorData = await response.json();
          console.error('Goal suggestions error response:', response.status, errorData);
        } catch (jsonError) {
          console.error('Goal suggestions error response:', response.status, 'Failed to parse JSON');
        }
        setSuggestionError('Suggestions feature is currently unavailable. Please create your goal manually.');
        return;
      }

      const data: GoalSuggestionResponse = await response.json();
      setSuggestionResult(data);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestionError('Suggestions feature is currently unavailable. Please create your goal manually.');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const applySuggestion = (suggestion: GoalSuggestionResponse) => {
    const now = new Date();
    const targetDate = new Date(now.getTime() + suggestion.days_to_complete * 24 * 60 * 60 * 1000);
    
    setFormData({
      ...formData,
      goal_type: suggestion.goal_type,
      target_value: suggestion.target_value.toString(),
      unit: suggestion.unit,
      target_date: targetDate,
    });
    setSuggestionResult(null);
  };

  const handleSubmit = () => {
    // Validate form data - only title and target_value are required
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }
    if (!formData.target_value || isNaN(Number(formData.target_value)) || Number(formData.target_value) <= 0) {
      Alert.alert('Error', 'Please enter a valid target value');
      return;
    }

    // Warn if unit is empty, but allow them to proceed with default value
    if (!formData.unit.trim()) {
      Alert.alert(
        'Warning',
        'You haven\'t entered a unit. A default unit will be used. It\'s recommended to specify a unit (e.g., steps, km, min) for your goal.',
        [
          {
            text: 'Go Back',
            style: 'cancel',
          },
          {
            text: 'Continue',
            onPress: () => {
              // Submit with default unit value
              onSubmit({ ...formData, unit: 'unit' });
            },
          },
        ]
      );
      return;
    }

    onSubmit(formData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose}>
            <CustomText style={[styles.modalButton, { color: colors.active }]}>
              Cancel
            </CustomText>
          </TouchableOpacity>
          <CustomText style={[styles.modalTitle, { color: colors.text }]}>
            Create Goal
          </CustomText>
          <TouchableOpacity onPress={handleSubmit} disabled={loading}>
            <CustomText style={[styles.modalButton, { color: colors.active }]}>
              {loading ? 'Creating...' : 'Create'}
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
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
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
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe your goal"
              placeholderTextColor={colors.subText}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={[styles.suggestionButton, { backgroundColor: colors.active }]}
              onPress={fetchSuggestions}
              disabled={isLoadingSuggestions || loading}
            >
              {isLoadingSuggestions ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <CustomText style={[styles.suggestionButtonText, { color: colors.background }]}>
                  Get AI Suggestions
                </CustomText>
              )}
            </TouchableOpacity>
          </View>

          {suggestionError && (
            <View style={[styles.suggestionErrorContainer, { backgroundColor: 'rgba(255, 0, 0, 0.1)', borderColor: 'rgba(255, 0, 0, 0.3)' }]}>
              <CustomText style={[styles.suggestionErrorText, { color: '#ff4444' }]}>
                {suggestionError}
              </CustomText>
            </View>
          )}

          {suggestionResult && (
            <View style={[styles.suggestionContainer, { backgroundColor: colors.navBar, borderColor: colors.border }]}>
              {!suggestionResult.is_realistic && (
                <View style={[styles.suggestionWarning, { backgroundColor: 'rgba(255, 193, 7, 0.2)', borderColor: 'rgba(255, 193, 7, 0.5)' }]}>
                  <CustomText style={[styles.suggestionWarningTitle, { color: '#ff9800' }]}>
                    ⚠️ Unrealistic Goal Detected
                  </CustomText>
                  {suggestionResult.warning_message && (
                    <CustomText style={[styles.suggestionWarningMessage, { color: colors.text }]}>
                      {suggestionResult.warning_message}
                    </CustomText>
                  )}
                </View>
              )}

              <View style={styles.suggestionInfo}>
                <CustomText style={[styles.suggestionInfoLabel, { color: colors.text }]}>
                  Suggested Target:
                </CustomText>
                <CustomText style={[styles.suggestionInfoValue, { color: colors.active }]}>
                  {suggestionResult.target_value} {suggestionResult.unit}
                </CustomText>
              </View>

              <View style={styles.suggestionInfo}>
                <CustomText style={[styles.suggestionInfoLabel, { color: colors.text }]}>
                  Timeline:
                </CustomText>
                <CustomText style={[styles.suggestionInfoValue, { color: colors.active }]}>
                  {suggestionResult.days_to_complete} days
                </CustomText>
              </View>

              <View style={styles.suggestionInfo}>
                <CustomText style={[styles.suggestionInfoLabel, { color: colors.text }]}>
                  Goal Type:
                </CustomText>
                <CustomText style={[styles.suggestionInfoValue, { color: colors.active }]}>
                  {GOAL_TYPES.find(type => type.value === suggestionResult.goal_type)?.label || suggestionResult.goal_type}
                </CustomText>
              </View>

              <View style={styles.suggestionTips}>
                <CustomText style={[styles.suggestionTipsTitle, { color: colors.text }]}>
                  Tips:
                </CustomText>
                {suggestionResult.tips.map((tip, index) => (
                  <View key={index} style={styles.suggestionTipItem}>
                    <CustomText style={[styles.suggestionTipNumber, { color: colors.active }]}>
                      {index + 1}.
                    </CustomText>
                    <CustomText style={[styles.suggestionTipText, { color: colors.subText }]}>
                      {tip}
                    </CustomText>
                  </View>
                ))}
              </View>

              <View style={styles.suggestionActions}>
                <TouchableOpacity
                  style={[styles.suggestionActionButton, { backgroundColor: colors.active, flex: 1 }]}
                  onPress={() => applySuggestion(suggestionResult)}
                >
                  <CustomText style={[styles.suggestionActionButtonText, { color: colors.background }]}>
                    {suggestionResult.is_realistic ? 'Use Suggestion' : 'Use Safe Alternative'}
                  </CustomText>
                </TouchableOpacity>
                {!suggestionResult.is_realistic && (
                  <TouchableOpacity
                    style={[styles.suggestionActionButton, { backgroundColor: colors.navBar, borderWidth: 1, borderColor: colors.border, flex: 1, marginLeft: 8 }]}
                    onPress={() => setSuggestionResult(null)}
                  >
                    <CustomText style={[styles.suggestionActionButtonText, { color: colors.text }]}>
                      Modify My Goal
                    </CustomText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <CustomText style={[styles.inputLabel, { color: colors.text }]}>
              Goal Type
            </CustomText>
            <View style={[styles.pickerContainer, { backgroundColor: colors.navBar, borderColor: colors.border }]}>
              <Picker
                selectedValue={formData.goal_type}
                onValueChange={(value) => setFormData({ ...formData, goal_type: value })}
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
                value={formData.target_value}
                onChangeText={(text) => setFormData({ ...formData, target_value: text })}
                placeholder="1,10,100"
                placeholderTextColor={colors.subText}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, styles.inputGroupHalf, styles.inputGroupRight]}>
              <CustomText style={[styles.inputLabel, { color: colors.text }]}>
                Unit*
              </CustomText>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.navBar, color: colors.text, borderColor: colors.border }]}
                value={formData.unit}
                onChangeText={(text) => setFormData({ ...formData, unit: text })}
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
                {formData.target_date.toLocaleDateString()}
              </CustomText>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.target_date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setFormData({ ...formData, target_date: selectedDate });
                }
              }}
            />
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

/**
 * Edit Goal Modal Component
 */
interface EditGoalModalProps {
  visible: boolean;
  goal: Goal | null;
  onClose: () => void;
  onSubmit: (goalId: number, formData: EditGoalForm) => void;
  colors: any;
  loading: boolean;
}

const EditGoalModal: React.FC<EditGoalModalProps> = ({
  visible,
  goal,
  onClose,
  onSubmit,
  colors,
  loading,
}) => {
  const [formData, setFormData] = useState<EditGoalForm>({
    title: '',
    description: '',
    goal_type: 'WALKING_RUNNING',
    target_value: '',
    unit: '',
    target_date: new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Update form data when goal changes
  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        description: goal.description,
        goal_type: goal.goal_type,
        target_value: goal.target_value.toString(),
        unit: goal.unit,
        target_date: new Date(goal.target_date),
      });
    }
  }, [goal]);

  const handleSubmit = () => {
    if (!goal) {
      return;
    }

    // Validate form data - only title and target_value are required
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }
    if (!formData.target_value || isNaN(Number(formData.target_value)) || Number(formData.target_value) <= 0) {
      Alert.alert('Error', 'Please enter a valid target value');
      return;
    }

    onSubmit(goal.id, formData);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose}>
            <CustomText style={[styles.modalButton, { color: colors.active }]}>
              Cancel
            </CustomText>
          </TouchableOpacity>
          <CustomText style={[styles.modalTitle, { color: colors.text }]}>
            Edit Goal
          </CustomText>
          <TouchableOpacity onPress={handleSubmit} disabled={loading}>
            <CustomText style={[styles.modalButton, { color: colors.active }]}>
              {loading ? 'Saving...' : 'Save'}
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
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
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
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe your goal"
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
                selectedValue={formData.goal_type}
                onValueChange={(value) => setFormData({ ...formData, goal_type: value })}
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
                value={formData.target_value}
                onChangeText={(text) => setFormData({ ...formData, target_value: text })}
                placeholder="100"
                placeholderTextColor={colors.subText}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, styles.inputGroupHalf, styles.inputGroupRight]}>
              <CustomText style={[styles.inputLabel, { color: colors.text }]}>
                Unit*
              </CustomText>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.navBar, color: colors.text, borderColor: colors.border }]}
                value={formData.unit}
                onChangeText={(text) => setFormData({ ...formData, unit: text })}
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
                {formData.target_date.toLocaleDateString()}
              </CustomText>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.target_date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setFormData({ ...formData, target_date: selectedDate });
                }
              }}
            />
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

/**
 * Progress Update Modal Component
 */
interface ProgressModalProps {
  visible: boolean;
  goal: Goal | null;
  onClose: () => void;
  onSubmit: (goalId: number, currentValue: number, originalProgression?: number) => void;
  colors: any;
  loading: boolean;
}

const ProgressModal: React.FC<ProgressModalProps> = ({
  visible,
  goal,
  onClose,
  onSubmit,
  colors,
  loading,
}) => {
  const [currentValue, setCurrentValue] = useState('');

  // Reset progression input when goal changes
  useEffect(() => {
    if (goal) {
      setCurrentValue(''); // Start with empty input for adding progression
    }
  }, [goal]);

  const handleSubmit = () => {
    if (!goal) {
      return;
    }

    const progressionValue = Number(currentValue);
    if (isNaN(progressionValue) || progressionValue < 0) {
      Alert.alert('Error', 'Please enter a valid progression value');
      return;
    }

    // Add progression to current value, but cap at target value to prevent exceeding goal
    const newTotalValue = Math.min(goal.current_value + progressionValue, goal.target_value);
    onSubmit(goal.id, newTotalValue, progressionValue);
  };

  const handleClose = () => {
    setCurrentValue('');
    onClose();
  };

  if (!goal) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose}>
            <CustomText style={[styles.modalButton, { color: colors.active }]}>
              Cancel
            </CustomText>
          </TouchableOpacity>
          <CustomText style={[styles.modalTitle, { color: colors.text }]}>
            Update Progress
          </CustomText>
          <TouchableOpacity onPress={handleSubmit} disabled={loading}>
            <CustomText style={[styles.modalButton, { color: colors.active }]}>
              {loading ? 'Updating...' : 'Update'}
            </CustomText>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.progressModalContent}>
            <CustomText style={[styles.progressGoalTitle, { color: colors.text }]}>
              {goal.title}
            </CustomText>
            <CustomText style={[styles.progressGoalDescription, { color: colors.subText }]}>
              {goal.description}
            </CustomText>

            <View style={styles.progressInfo}>
              <CustomText style={[styles.progressLabel, { color: colors.text }]}>
                Current Progress: {goal.current_value} / {goal.target_value} {goal.unit}
              </CustomText>
              <CustomText style={[styles.progressPercentage, { color: colors.active }]}>
                {calculateProgressPercentage(goal.current_value, goal.target_value)}%
              </CustomText>
            </View>

            <View style={styles.inputGroup}>
              <CustomText style={[styles.inputLabel, { color: colors.text }]}>
                Add Progression ({goal.unit})
              </CustomText>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.navBar, color: colors.text, borderColor: colors.border }]}
                value={currentValue}
                onChangeText={setCurrentValue}
                placeholder={`Add to current progress (${goal.unit})`}
                placeholderTextColor={colors.subText}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.progressWarning}>
              <CustomText style={[styles.warningText, { color: colors.subText }]}>
                Note: Enter the amount to add to your current progress. Progress will be capped at the target value if it exceeds the goal. You can only update progress for active goals that haven't expired.
              </CustomText>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// 🏠 MAIN GOALS SCREEN COMPONENT
// ──────────────────────────────────────────────────────────────────────────────

const Goals: React.FC = () => {
  const { colors } = useTheme();
  const { getAuthHeader, isAuthenticated } = useAuth();
  const route = useRoute();

  // State management
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>('ACTIVE');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────────
  // 🌐 API FUNCTIONS
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Fetches all goals from the API
   */
  const fetchGoals = useCallback(async () => {
    // Don't fetch goals if user is not authenticated
    if (!isAuthenticated) {
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const origin = getOrigin();
      const response = await fetch(GOALS_ENDPOINT, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Referer': origin,
          ...getAuthHeader(),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGoals(data);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
      Alert.alert('Error', 'Failed to load goals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, isAuthenticated]);

  /**
   * Creates a new goal
   */
  const createGoal = async (formData: CreateGoalForm) => {
    // Don't create goal if user is not authenticated
    if (!isAuthenticated) {
      Alert.alert('Error', 'You must be logged in to create goals.');
      return;
    }

    try {
      setActionLoading(true);
      const csrfToken = await getCSRFToken();
      const origin = getOrigin();

      const response = await fetch(GOALS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Referer': origin,
          'X-CSRFToken': csrfToken,
          ...getAuthHeader(),
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          goal_type: formData.goal_type,
          target_value: Number(formData.target_value),
          unit: formData.unit.trim() || "unit",
          target_date: formData.target_date.toISOString(),
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error || errorData.message || errorData.detail) {
            errorMessage = errorData.error || errorData.message || errorData.detail;
          }
        } catch (e) {
          // If response is not JSON, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      Alert.alert('Success', 'Goal created successfully!');
      setModalType(null);
      await fetchGoals();
    } catch (error) {
      console.error('Failed to create goal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create goal. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Updates an existing goal
   */
  const updateGoal = async (goalId: number, formData: EditGoalForm) => {
    // Don't update goal if user is not authenticated
    if (!isAuthenticated) {
      Alert.alert('Error', 'You must be logged in to update goals.');
      return;
    }

    try {
      setActionLoading(true);
      const csrfToken = await getCSRFToken();
      const origin = getOrigin();

      const response = await fetch(`${GOALS_ENDPOINT}${goalId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Referer': origin,
          'X-CSRFToken': csrfToken,
          ...getAuthHeader(),
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          goal_type: formData.goal_type,
          target_value: Number(formData.target_value),
          unit: formData.unit.trim() || "unit",
          target_date: formData.target_date.toISOString(),
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error || errorData.message || errorData.detail) {
            errorMessage = errorData.error || errorData.message || errorData.detail;
          }
        } catch (e) {
          // If response is not JSON, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      Alert.alert('Success', 'Goal updated successfully!');
      setModalType(null);
      setSelectedGoal(null);
      await fetchGoals();
    } catch (error) {
      console.error('Failed to update goal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update goal. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Updates goal progress
   */
  const updateProgress = async (goalId: number, currentValue: number, originalProgression?: number) => {
    // Don't update progress if user is not authenticated
    if (!isAuthenticated) {
      Alert.alert('Error', 'You must be logged in to update progress.');
      return;
    }

    try {
      setActionLoading(true);
      const csrfToken = await getCSRFToken();
      const origin = getOrigin();

      const response = await fetch(`${GOALS_ENDPOINT}${goalId}/progress/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Referer': origin,
          'X-CSRFToken': csrfToken,
          ...getAuthHeader(),
        },
        credentials: 'include',
        body: JSON.stringify({
          current_value: currentValue,
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error || errorData.message || errorData.detail) {
            errorMessage = errorData.error || errorData.message || errorData.detail;
          }
        } catch (e) {
          // If response is not JSON, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Show different message if progress was capped
      const wasCapped = originalProgression && originalProgression > 0 && currentValue < (selectedGoal?.current_value || 0) + originalProgression;
      const successMessage = wasCapped 
        ? 'Progress updated successfully! Note: Progress was capped at the target value.'
        : 'Progress updated successfully!';
      
      Alert.alert('Success', successMessage);
      setModalType(null);
      setSelectedGoal(null);
      await fetchGoals();
    } catch (error) {
      console.error('Failed to update progress:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update progress. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };


  // ──────────────────────────────────────────────────────────────────────────────
  // 🎯 EVENT HANDLERS
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Handles goal card press for progress updates
   */
  const handleGoalPress = (goal: Goal) => {
    const isExpired = isGoalExpired(goal.target_date);
    const isCompleted = goal.status === 'COMPLETED';
    const isActionable = !isExpired && !isCompleted && goal.status === 'ACTIVE';

    if (isActionable) {
      setSelectedGoal(goal);
      setModalType('progress');
    }
  };

  /**
   * Handles goal card long press for editing
   */
  const handleGoalLongPress = (goal: Goal) => {
    setSelectedGoal(goal);
    setModalType('edit');
  };

  /**
   * Handles tab change
   */
  const handleTabChange = (tab: TabFilter) => {
    setActiveTab(tab);
  };

  /**
   * Handles modal close
   */
  const handleModalClose = () => {
    setModalType(null);
    setSelectedGoal(null);
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // 🔄 EFFECTS
  // ──────────────────────────────────────────────────────────────────────────────

  // Fetch goals on component mount
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Open create modal when navigating from Profile with 'new' param
  useFocusEffect(
    React.useCallback(() => {
      // @ts-ignore
      const shouldOpenModal = route.params?.openCreate;
      if (shouldOpenModal && modalType === null) {
        setModalType('create');
        // Clear the param to prevent reopening on subsequent visits
        // @ts-ignore
        if (route.params?.openCreate) {
          // @ts-ignore
          delete route.params.openCreate;
        }
      }
    }, [route.params, modalType])
  );

  // ──────────────────────────────────────────────────────────────────────────────
  // 🎨 RENDER HELPERS
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Filters goals based on active tab
   */
  const getFilteredGoals = (): Goal[] => {
    switch (activeTab) {
      case 'ACTIVE':
        // Active goals that haven't expired (deadline day is still considered active)
        return goals.filter(goal => goal.status === 'ACTIVE' && !isGoalExpired(goal.target_date));
      case 'COMPLETED':
        return goals.filter(goal => goal.status === 'COMPLETED');
      case 'ALL':
      default:
        return goals;
    }
  };

  /**
   * Renders the empty state when no goals are found
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <CustomText style={[styles.emptyStateTitle, { color: colors.text }]}>
        No Goals Found
      </CustomText>
      <CustomText style={[styles.emptyStateDescription, { color: colors.subText }]}>
        {activeTab === 'ALL'
          ? "You haven't created any goals yet. Start your fitness journey by creating your first goal!"
          : `No ${activeTab.toLowerCase()} goals found.`}
      </CustomText>
      {activeTab === 'ALL' && (
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.active }]}
          onPress={() => setModalType('create')}
        >
          <CustomText style={[styles.createButtonText, { color: colors.background }]}>
            Create Your First Goal
          </CustomText>
        </TouchableOpacity>
      )}
    </View>
  );

  /**
   * Renders the loading state
   */
  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color={colors.active} />
      <CustomText style={[styles.loadingText, { color: colors.subText }]}>
        Loading goals...
      </CustomText>
    </View>
  );

  // ──────────────────────────────────────────────────────────────────────────────
  // 🎨 MAIN RENDER
  // ──────────────────────────────────────────────────────────────────────────────

  // Don't render the component if user is not authenticated
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <CustomText style={[styles.emptyStateTitle, { color: colors.text }]}>
            Please Log In
          </CustomText>
          <CustomText style={[styles.emptyStateDescription, { color: colors.subText }]}>
            You need to be logged in to view your fitness goals.
          </CustomText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Create Button */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <CustomText style={[styles.headerTitle, { color: colors.text }]}>
          Fitness Goals
        </CustomText>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.active }]}
          onPress={() => setModalType('create')}
        >
          <CustomText style={[styles.createButtonText, { color: colors.background }]}>
            + Create Goal
          </CustomText>
        </TouchableOpacity>
      </View>

      {/* Statistics Row */}
      <StatsRow goals={goals} colors={colors} />

      {/* Tabs */}
      <Tabs activeTab={activeTab} onTabChange={handleTabChange} colors={colors} />

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          renderLoadingState()
        ) : (
          <>
            {getFilteredGoals().length === 0 ? (
              renderEmptyState()
            ) : (
              <View style={styles.goalsList}>
                {getFilteredGoals().map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onPress={() => handleGoalPress(goal)}
                    onLongPress={() => handleGoalLongPress(goal)}
                    colors={colors}
                  />
                ))}
              </View>
            )}
          </>
        )}
    </ScrollView>

      {/* Modals */}
      <CreateGoalModal
        visible={modalType === 'create'}
        onClose={handleModalClose}
        onSubmit={createGoal}
        colors={colors}
        loading={actionLoading}
        getAuthHeader={getAuthHeader}
        isAuthenticated={isAuthenticated}
      />

      <EditGoalModal
        visible={modalType === 'edit'}
        goal={selectedGoal}
        onClose={handleModalClose}
        onSubmit={updateGoal}
        colors={colors}
        loading={actionLoading}
      />

      <ProgressModal
        visible={modalType === 'progress'}
        goal={selectedGoal}
        onClose={handleModalClose}
        onSubmit={updateProgress}
        colors={colors}
        loading={actionLoading}
      />
    </View>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// 🎨 STYLES
// ──────────────────────────────────────────────────────────────────────────────


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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: 16,
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
  goalsList: {
    padding: 16,
  },
  goalCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledCard: {
    opacity: 0.6,
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
  goalType: {
    fontSize: 12,
    fontWeight: '500',
  },
  goalDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 12,
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
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalDate: {
    fontSize: 12,
  },
  goalStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
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
  progressModalContent: {
    flex: 1,
  },
  progressGoalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressGoalDescription: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  progressWarning: {
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  warningText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  suggestionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestionErrorContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  suggestionErrorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestionContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  suggestionWarning: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  suggestionWarningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  suggestionWarningMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  suggestionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionInfoValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  suggestionTips: {
    marginTop: 8,
    marginBottom: 16,
  },
  suggestionTipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  suggestionTipItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  suggestionTipNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 20,
  },
  suggestionTipText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  suggestionActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  suggestionActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionActionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Goals;