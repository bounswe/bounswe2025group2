import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ProgressBarAndroid } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import Cookies from '@react-native-cookies/cookies';
import { useTheme } from '../context/ThemeContext';

interface Goal {
  id: number;
  title: string;
  description: string;
  user: number;
  mentor: number | null;
  goal_type: 'WALKING_RUNNING' | 'WORKOUT' | 'CYCLING' | 'SPORTS' | 'SWIMMING' | 'CARDIO' | 'STRENGTH' | 'FLEXIBILITY' | 'BALANCE' | 'OTHER';
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  target_date: string;
  status: 'ACTIVE' | 'COMPLETED' | 'RESTARTED';
  last_updated: string;
}

const Goals = ({ navigation }: any) => {
  const { getAuthHeader } = useAuth();
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const GOAL_TYPE_OPTIONS = [
    'WALKING_RUNNING',
    'WORKOUT',
    'CYCLING',
    'SPORTS',
    'SWIMMING',
  ];
  const [goalType, setGoalType] = useState(GOAL_TYPE_OPTIONS[0]);
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('km');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [contributionModal, setContributionModal] = useState<{ visible: boolean; goalId: number | null }>({ visible: false, goalId: null });
  const [contributionValue, setContributionValue] = useState('');
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED' | 'ALL'>('ACTIVE');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editGoalType, setEditGoalType] = useState(GOAL_TYPE_OPTIONS[0]);
  const [editTargetValue, setEditTargetValue] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [editShowDatePicker, setEditShowDatePicker] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('http://10.0.2.2:8000/api/goals/', {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to fetch goals');
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      Alert.alert('Error', 'Network error while fetching goals');
    }
  };

  // Utility to get CSRF token
  const getCSRFToken = async () => {
    const cookies = await Cookies.get('http://10.0.2.2:8000');
    return cookies.csrftoken?.value;
  };

  const handleCreateGoal = async () => {
    if (!goalTitle || !goalDescription || !targetValue || !unit || !date) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      const csrfToken = await getCSRFToken();
      if (!csrfToken) {
        Alert.alert('Error', 'CSRF token not found. Please try logging in again.');
        return;
      }
      const body = {
        title: goalTitle,
        description: goalDescription,
        goal_type: goalType,
        target_value: parseFloat(targetValue),
        current_value: 0.0,
        unit: unit,
        start_date: new Date().toISOString(),
        target_date: date.toISOString(),
      };
      const response = await fetch('http://10.0.2.2:8000/api/goals/', {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        const newGoal = await response.json();
        setGoals([...goals, newGoal]);
        closeModal();
        Alert.alert('Success', 'Goal created successfully!');
        resetForm();
        await fetchGoals();
      } else {
        const error = await response.json();
        console.error('Goal creation error response:', error);
        Alert.alert('Error', error.detail || JSON.stringify(error) || 'Failed to create goal');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert('Error', 'Network error while creating goal');
    }
  };

  const handleUpdateProgress = async () => {
    if (!contributionModal.goalId) return;
    
    const goal = goals.find(g => g.id === contributionModal.goalId);
    if (!goal) return;

    const newValue = parseFloat(contributionValue);
    if (isNaN(newValue) || newValue <= 0) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    try {
      const csrfToken = await getCSRFToken();
      if (!csrfToken) {
        Alert.alert('Error', 'CSRF token not found. Please try logging in again.');
        return;
      }
      const response = await fetch(`http://10.0.2.2:8000/api/goals/${contributionModal.goalId}/progress/`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          current_value: newValue,
        }),
      });

      if (response.ok) {
        const updatedGoal = await response.json();
        setGoals(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
        closeContributionModal();
        setContributionValue('');
        Alert.alert('Success', 'Progress updated successfully!');
        await fetchGoals();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      Alert.alert('Error', 'Network error while updating progress');
    }
  };

  const handleDeleteGoal = async (goalId: number) => {
    try {
      const csrfToken = await getCSRFToken();
      if (!csrfToken) {
        Alert.alert('Error', 'CSRF token not found. Please try logging in again.');
        return;
      }
      const response = await fetch(`http://10.0.2.2:8000/api/goals/${goalId}/`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeader(),
          'X-CSRFToken': csrfToken,
        },
      });
      if (response.status === 204) {
        setGoals(goals.filter(g => g.id !== goalId));
        Alert.alert('Success', 'Goal deleted successfully!');
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to delete goal');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      Alert.alert('Error', 'Network error while deleting goal');
    }
  };

  const resetForm = () => {
    setGoalTitle('');
    setGoalDescription('');
    setGoalType(GOAL_TYPE_OPTIONS[0]);
    setTargetValue('');
    setUnit('km');
    setDate(new Date());
  };

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const openContributionModal = (goalId: number) => {
    setContributionModal({ visible: true, goalId });
    setContributionValue('');
  };

  const closeContributionModal = () => setContributionModal({ visible: false, goalId: null });

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setEditTitle(goal.title);
    setEditDescription(goal.description);
    setEditGoalType(goal.goal_type);
    setEditTargetValue(goal.target_value.toString());
    setEditUnit(goal.unit);
    setEditDate(new Date(goal.target_date));
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditingGoal(null);
  };

  const handleEditDateChange = (event: any, selectedDate?: Date) => {
    setEditShowDatePicker(false);
    if (selectedDate) setEditDate(selectedDate);
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal) return;
    if (!editTitle || !editDescription || !editTargetValue || !editUnit || !editDate) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      const csrfToken = await getCSRFToken();
      if (!csrfToken) {
        Alert.alert('Error', 'CSRF token not found. Please try logging in again.');
        return;
      }
      const body = {
        title: editTitle,
        description: editDescription,
        goal_type: editGoalType,
        target_value: parseFloat(editTargetValue),
        unit: editUnit,
        target_date: editDate.toISOString(),
      };
      const response = await fetch(`http://10.0.2.2:8000/api/goals/${editingGoal.id}/`, {
        method: 'PUT',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        const updatedGoal = await response.json();
        setGoals(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
        closeEditModal();
        Alert.alert('Success', 'Goal updated successfully!');
        await fetchGoals();
      } else {
        const error = await response.json();
        console.error('Goal update error response:', error);
        Alert.alert('Error', error.detail || JSON.stringify(error) || 'Failed to update goal');
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Network error while updating goal');
    }
  };

  // Filter goals based on activeTab
  const filteredGoals = goals.filter(goal =>
    activeTab === 'ALL' ? true :
    goal.status === activeTab
  );

  const progress = 0.7; // 70% progress

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>My Fitness Goals</Text>
      <Text style={[styles.subtitle, { color: colors.subText }]}>Track and manage your personal fitness journey</Text>
      <TouchableOpacity style={[styles.setGoalButton, { borderColor: colors.border }]} onPress={openModal}>
        <Text style={[styles.setGoalButtonText, { color: colors.mentionText }]}>+ Set New Goal</Text>
      </TouchableOpacity>
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderColor: colors.border, backgroundColor: colors.navBar }]}> 
          <Text style={[styles.statLabel, { color: colors.subText }]}>Active Goals</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{goals.filter(g => g.status === 'ACTIVE').length}</Text>
        </View>
        <View style={[styles.statBox, { borderColor: colors.border, backgroundColor: colors.navBar }]}> 
          <Text style={[styles.statLabel, { color: colors.subText }]}>Completed</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{goals.filter(g => g.status === 'COMPLETED').length}</Text>
        </View>
        <View style={[styles.statBox, { borderColor: colors.border, backgroundColor: colors.navBar }]}> 
          <Text style={[styles.statLabel, { color: colors.subText }]}>Completion Rate</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{goals.length > 0 ? Math.round((goals.filter(g => g.status === 'COMPLETED').length / goals.length) * 100) : 0}%</Text>
        </View>
      </View>
      <View style={styles.tabsRow}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ACTIVE' && [styles.tabActive, { backgroundColor: colors.active }], { borderColor: colors.border }]} 
          onPress={() => setActiveTab('ACTIVE')}
        >
          <Text style={activeTab === 'ACTIVE' ? [styles.tabActiveText, { color: colors.navBar }] : [styles.tabText, { color: colors.text }]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'COMPLETED' && [styles.tabActive, { backgroundColor: colors.active }], { borderColor: colors.border }]} 
          onPress={() => setActiveTab('COMPLETED')}
        >
          <Text style={activeTab === 'COMPLETED' ? [styles.tabActiveText, { color: colors.navBar }] : [styles.tabText, { color: colors.text }]}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ALL' && [styles.tabActive, { backgroundColor: colors.active }], { borderColor: colors.border }]} 
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={activeTab === 'ALL' ? [styles.tabActiveText, { color: colors.navBar }] : [styles.tabText, { color: colors.text }]}>All Goals</Text>
        </TouchableOpacity>
      </View>

      {filteredGoals.length > 0 ? (
        <View style={styles.goalsList}>
          {filteredGoals.map((goal) => {
            const progress = goal.current_value / goal.target_value;
            return (
              <TouchableOpacity
                key={goal.id}
                style={[styles.goalCard, { backgroundColor: colors.navBar, borderColor: colors.border }]}
                onLongPress={() => openEditModal(goal)}
                onPress={() => goal.status === 'ACTIVE' && openContributionModal(goal.id)}
                activeOpacity={goal.status !== 'ACTIVE' ? 1 : 0.7}
              >
                <Text style={[styles.goalTitle, { color: colors.text }]}>{goal.title}</Text>
                <Text style={[styles.goalType, { color: colors.subText }]}>{goal.goal_type}</Text>
                <View style={[styles.progressBarBg, { backgroundColor: colors.background }]}> 
                  <View style={[styles.progressBarFill, { flex: progress, backgroundColor: colors.active }]} />
                  <View style={{ flex: 1 - progress }} />
                </View>
                <Text style={[styles.goalValue, { color: colors.text }]}>
                  {goal.current_value}/{goal.target_value} {goal.unit}
                </Text>
                <Text style={[styles.goalDate, { color: colors.subText }]}>
                  Deadline: {new Date(goal.target_date).toLocaleDateString()}
                </Text>
                {goal.status === 'COMPLETED' && (
                  <Text style={[styles.completedLabel, { color: colors.active }]}>Completed!</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={[styles.emptyBox, { backgroundColor: colors.navBar, borderColor: colors.border }]}> 
          <Text style={[styles.emptyTitle, { color: colors.active }]}>No {activeTab.toLowerCase()} goals found</Text>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            You don't have any {activeTab.toLowerCase()} goals. Set a new fitness goal to start tracking your progress.
          </Text>
          {activeTab === 'ACTIVE' && (
            <TouchableOpacity style={[styles.setGoalButton2, { borderColor: colors.active }]} onPress={openModal}>
              <Text style={[styles.setGoalButtonText, { color: colors.active }]}>Set New Goal</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Modal for setting a new goal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)' }]}> 
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}> 
            <Text style={[styles.modalTitle, { color: colors.mentionText }]}>Set a New Goal</Text>
            <Text style={[styles.modalSubtitle, { color: colors.subText }]}>Create a new fitness goal to track your progress</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.navBar, color: colors.text }]}
              placeholder="Goal Title"
              placeholderTextColor={colors.subText}
              value={goalTitle}
              onChangeText={setGoalTitle}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.navBar, color: colors.text }]}
              placeholder="Goal Description"
              placeholderTextColor={colors.subText}
              value={goalDescription}
              onChangeText={setGoalDescription}
              multiline
            />
            <View style={styles.categorySelector}>
              <Text style={[styles.label, { color: colors.text }]}>Goal Type:</Text>
              <View style={styles.categoryButtons}>
                {GOAL_TYPE_OPTIONS.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.categoryButton,
                      { borderColor: colors.border },
                      goalType === type && [styles.categoryButtonActive, { backgroundColor: colors.active }]
                    ]}
                    onPress={() => setGoalType(type)}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      { color: colors.text },
                      goalType === type && [styles.categoryButtonTextActive, { color: colors.navBar }]
                    ]}>
                      {type.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1, borderColor: colors.border, backgroundColor: colors.navBar, color: colors.text }]}
                placeholder="Target Value"
                placeholderTextColor={colors.subText}
                value={targetValue}
                onChangeText={setTargetValue}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, { flex: 1, borderColor: colors.border, backgroundColor: colors.navBar, color: colors.text }]}
                placeholder="Unit (e.g., km, kg, reps)"
                placeholderTextColor={colors.subText}
                value={unit}
                onChangeText={setUnit}
              />
            </View>
            <TouchableOpacity style={[styles.input, { borderColor: colors.border, backgroundColor: colors.navBar }]} onPress={() => setShowDatePicker(true)}>
              <Text style={{ color: colors.text }}>
                {date ? date.toLocaleDateString() : 'Target Date'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity onPress={closeModal} style={[styles.modalButton, { marginRight: 8, borderColor: colors.border, borderWidth: 1 }]}> 
                <Text style={{ color: colors.mentionText }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateGoal} style={[styles.modalButton, { backgroundColor: colors.active }]}> 
                <Text style={{ color: colors.navBar }}>Create Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for adding a contribution */}
      <Modal
        visible={contributionModal.visible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeContributionModal}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)' }]}> 
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}> 
            <Text style={[styles.modalTitle, { color: colors.mentionText }]}>Update Progress</Text>
            {(() => {
              if (contributionModal.goalId === null) return null;
              const goal = goals.find(g => g.id === contributionModal.goalId);
              if (!goal) return null;

              return (
                <>
                  <Text style={[styles.modalSubtitle, { color: colors.subText }]}>{goal.title}</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.navBar, color: colors.text }]}
                  placeholder="Enter current value"
                  value={contributionValue}
                  onChangeText={setContributionValue}
                  keyboardType="numeric"
                  editable={goal.status === 'ACTIVE'}
                />
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                    <TouchableOpacity onPress={closeContributionModal} style={[styles.modalButton, { marginRight: 8, borderColor: colors.border, borderWidth: 1 }]}> 
                      <Text style={{ color: colors.mentionText }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleUpdateProgress}
                      style={[styles.modalButton, { backgroundColor: colors.active }]}
                      disabled={goal.status !== 'ACTIVE'}
                    >
                      <Text style={{ color: colors.navBar }}>Update</Text>
                    </TouchableOpacity>
                  </View>
                  {goal.status !== 'ACTIVE' && (
                    <Text style={{ color: 'red', marginTop: 8 }}>
                      You cannot update progress for a {goal.status.toLowerCase()} goal.
                    </Text>
                  )}
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEditModal}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)' }]}> 
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}> 
            <Text style={[styles.modalTitle, { color: colors.mentionText }]}>Edit Goal</Text>
            <Text style={[styles.modalSubtitle, { color: colors.subText }]}>Update your fitness goal details</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.navBar, color: colors.text }]}
              placeholder="Goal Title"
              value={editTitle}
              onChangeText={setEditTitle}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.navBar, color: colors.text }]}
              placeholder="Goal Description"
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
            />
            <View style={styles.categorySelector}>
              <Text style={[styles.label, { color: colors.text }]}>Goal Type:</Text>
              <View style={styles.categoryButtons}>
                {GOAL_TYPE_OPTIONS.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.categoryButton,
                      { borderColor: colors.border },
                      editGoalType === type && [styles.categoryButtonActive, { backgroundColor: colors.active }]
                    ]}
                    onPress={() => setEditGoalType(type)}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      { color: colors.text },
                      editGoalType === type && [styles.categoryButtonTextActive, { color: colors.navBar }]
                    ]}>
                      {type.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.input, { flex: 1, borderColor: colors.border, backgroundColor: colors.navBar, color: colors.text }]}
                placeholder="Target Value"
                value={editTargetValue}
                onChangeText={setEditTargetValue}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, { flex: 1, borderColor: colors.border, backgroundColor: colors.navBar, color: colors.text }]}
                placeholder="Unit (e.g., km, kg, reps)"
                value={editUnit}
                onChangeText={setEditUnit}
              />
            </View>
            <TouchableOpacity style={[styles.input, { borderColor: colors.border, backgroundColor: colors.navBar }]} onPress={() => setEditShowDatePicker(true)}>
              <Text style={{ color: colors.text }}>
                {editDate ? editDate.toLocaleDateString() : 'Target Date'}
              </Text>
            </TouchableOpacity>
            {editShowDatePicker && (
              <DateTimePicker
                value={editDate}
                mode="date"
                display="default"
                onChange={handleEditDateChange}
              />
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity onPress={closeEditModal} style={[styles.modalButton, { marginRight: 8, borderColor: colors.border, borderWidth: 1 }]}> 
                <Text style={{ color: colors.mentionText }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateGoal} style={[styles.modalButton, { backgroundColor: colors.active }]}> 
                <Text style={{ color: colors.navBar }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 16, marginBottom: 16 },
  setGoalButton: { alignSelf: 'flex-end', borderWidth: 1, borderColor: '#800000', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 16 },
  setGoalButtonText: { color: '#800000', fontWeight: 'bold', fontSize: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statBox: { flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#800000', borderRadius: 8, marginHorizontal: 4, padding: 8, backgroundColor: '#fff' },
  statLabel: { color: '#800000', fontSize: 14 },
  statValue: { color: '#800000', fontWeight: 'bold', fontSize: 20 },
  tabsRow: { flexDirection: 'row', marginBottom: 8 },
  tab: { flex: 1, textAlign: 'center', paddingVertical: 8, color: '#800000', borderWidth: 1, borderColor: '#800000', borderRadius: 0 },
  tabActive: { backgroundColor: '#800000' },
  tabText: { color: '#800000', textAlign: 'center', fontWeight: 'normal' },
  tabActiveText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 32, backgroundColor: '#fff', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#800000' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#800000', marginBottom: 8 },
  emptyText: { color: '#800000', marginBottom: 16, textAlign: 'center' },
  setGoalButton2: { borderWidth: 1, borderColor: '#800000', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#800000', marginBottom: 4 },
  modalSubtitle: { fontSize: 15, color: '#800000', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#800000', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12, fontSize: 16, backgroundColor: '#fff' },
  label: { fontWeight: 'bold', color: '#800000', marginBottom: 4 },
  modalButton: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  goalsList: { marginTop: 24 },
  goalCard: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#800000', padding: 16, marginBottom: 16 },
  goalTitle: { fontSize: 18, fontWeight: 'bold', color: '#800000' },
  goalType: { fontSize: 15, color: '#800000', marginBottom: 4 },
  goalValue: { fontSize: 15, color: '#800000' },
  goalDate: { fontSize: 13, color: '#800000', marginTop: 4 },
  progressBarBg: { flexDirection: 'row', height: 16, backgroundColor: '#eee', borderRadius: 8, overflow: 'hidden', marginVertical: 8 },
  progressBarFill: { backgroundColor: '#800000', height: 16, borderRadius: 8 },
  completedLabel: { color: '#008000', fontWeight: 'bold', marginTop: 8, textAlign: 'center' },
  categorySelector: {
    marginBottom: 12,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: '#800000',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryButtonActive: {
    backgroundColor: '#800000',
  },
  categoryButtonText: {
    color: '#800000',
    fontSize: 14,
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
});

export default Goals; 