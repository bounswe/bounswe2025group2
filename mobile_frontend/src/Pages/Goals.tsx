import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Goal {
  title: string;
  type: string;
  value: string;
  unit: string;
  date: Date;
  contributions: number[];
  isBinary: boolean;
}

const Goals = ({ navigation }: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalType, setGoalType] = useState('Walking');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('miles');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [contributionModal, setContributionModal] = useState<{ visible: boolean; goalIdx: number | null }>({ visible: false, goalIdx: null });
  const [contributionValue, setContributionValue] = useState('');
  const [activeTab, setActiveTab] = useState<'Active' | 'Completed' | 'Failed' | 'All'>('Active');
  const [isBinary, setIsBinary] = useState(false);

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleCreateGoal = () => {
    if (!goalTitle || (!isBinary && (!targetValue || !unit)) || !date) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setGoals([
      ...goals,
      {
        title: goalTitle,
        type: goalType,
        value: isBinary ? '1' : targetValue,
        unit: isBinary ? 'times' : unit,
        date,
        contributions: [],
        isBinary,
      },
    ]);
    closeModal();
    Alert.alert('Success', 'Goal created!');
    setGoalTitle('');
    setGoalType('Walking');
    setTargetValue('');
    setUnit('miles');
    setDate(new Date());
    setIsBinary(false);
  };

  const openContributionModal = (goalIdx: number) => {
    setContributionModal({ visible: true, goalIdx });
    setContributionValue('');
  };
  const closeContributionModal = () => setContributionModal({ visible: false, goalIdx: null });

  const handleAddContribution = () => {
    const idx = contributionModal.goalIdx;
    if (idx === null) return;
    const value = parseFloat(contributionValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }
    setGoals(goals => goals.map((g, i) => i === idx ? { ...g, contributions: [...g.contributions, value] } : g));
    closeContributionModal();
  };

  const getProgress = (goal: Goal) => {
    if (goal.isBinary) {
      return goal.contributions.length > 0 ? 1 : 0;
    }
    const total = goal.contributions.reduce((a, b) => a + b, 0);
    const target = parseFloat(goal.value) || 1;
    return Math.min(total / target, 1);
  };

  const getCurrentValue = (goal: Goal) => {
    if (goal.isBinary) {
      return goal.contributions.length > 0 ? 1 : 0;
    }
    const total = goal.contributions.reduce((a, b) => a + b, 0);
    const target = parseFloat(goal.value) || 1;
    return Math.min(total, target);
  };

  const isCompleted = (goal: Goal) => {
    if (goal.isBinary) {
      return goal.contributions.length > 0;
    }
    return getCurrentValue(goal) >= (parseFloat(goal.value) || 1);
  };

  const isFailed = (goal: Goal) => {
    const now = new Date();
    return !isCompleted(goal) && goal.date < new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  // Filter goals based on activeTab
  const filteredGoals = goals
    .filter(goal =>
      activeTab === 'Active' ? (!isCompleted(goal) && !isFailed(goal)) :
      activeTab === 'Completed' ? isCompleted(goal) :
      activeTab === 'Failed' ? isFailed(goal) :
      true // 'All' tab shows all goals
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by deadline date (latest first)

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>My Fitness Goals</Text>
      <Text style={styles.subtitle}>Track and manage your personal fitness journey</Text>
      <TouchableOpacity style={styles.setGoalButton} onPress={openModal}>
        <Text style={styles.setGoalButtonText}>+ Set New Goal</Text>
      </TouchableOpacity>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Active Goals</Text>
          <Text style={styles.statValue}>{goals.filter(g => !isCompleted(g) && !isFailed(g)).length}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Completed</Text>
          <Text style={styles.statValue}>{goals.filter(g => isCompleted(g)).length}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Failed</Text>
          <Text style={styles.statValue}>{goals.filter(g => isFailed(g)).length}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Completion Rate</Text>
          <Text style={styles.statValue}>{goals.length > 0 ? Math.round((goals.filter(g => isCompleted(g)).length / goals.length) * 100) : 0}%</Text>
        </View>
      </View>
      <View style={styles.tabsRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'Active' && styles.tabActive]} onPress={() => setActiveTab('Active')}>
          <Text style={activeTab === 'Active' ? styles.tabActiveText : styles.tabText}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'Completed' && styles.tabActive]} onPress={() => setActiveTab('Completed')}>
          <Text style={activeTab === 'Completed' ? styles.tabActiveText : styles.tabText}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'Failed' && styles.tabActive]} onPress={() => setActiveTab('Failed')}>
          <Text style={activeTab === 'Failed' ? styles.tabActiveText : styles.tabText}>Failed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'All' && styles.tabActive]} onPress={() => setActiveTab('All')}>
          <Text style={activeTab === 'All' ? styles.tabActiveText : styles.tabText}>All Goals</Text>
        </TouchableOpacity>
      </View>

      {/* Show filtered goals if any, otherwise show empty state */}
      {filteredGoals.length > 0 ? (
        <View style={styles.goalsList}>
          {filteredGoals.map((goal, idx) => {
            const progress = getProgress(goal);
            const current = getCurrentValue(goal);
            const target = parseFloat(goal.value) || 1;
            return (
              <TouchableOpacity
                key={idx}
                style={styles.goalCard}
                onPress={() => (!isCompleted(goal) && !isFailed(goal)) && openContributionModal(goals.indexOf(goal))}
                activeOpacity={isFailed(goal) ? 1 : 0.7}
              >
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalType}>{goal.type}</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { flex: progress }]} />
                  <View style={{ flex: 1 - progress }} />
                </View>
                <Text style={styles.goalValue}>{current}/{target} {goal.unit}</Text>
                <Text style={styles.goalDate}>Deadline: {goal.date.toLocaleDateString()}</Text>
                {isCompleted(goal) && <Text style={styles.completedLabel}>Completed!</Text>}
                {isFailed(goal) && <Text style={styles.failedLabel}>Failed (Deadline Passed)</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} goals found</Text>
          <Text style={styles.emptyText}>You don't have any {activeTab.toLowerCase()} goals. Set a new fitness goal to start tracking your progress.</Text>
          {activeTab === 'Active' && (
            <TouchableOpacity style={styles.setGoalButton2} onPress={openModal}>
              <Text style={styles.setGoalButtonText}>Set New Goal</Text>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set a New Goal</Text>
            <Text style={styles.modalSubtitle}>Create a new fitness goal to track your progress</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., Run 5K in 30 minutes"
              value={goalTitle}
              onChangeText={setGoalTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Goal Type (e.g., Walking, Running, Yoga)"
              value={goalType}
              onChangeText={setGoalType}
            />
            <View style={styles.binaryToggle}>
              <Text style={styles.binaryLabel}>All-or-Nothing Goal (e.g., Go to gym)</Text>
              <TouchableOpacity
                style={[styles.binaryButton, isBinary && styles.binaryButtonActive]}
                onPress={() => setIsBinary(!isBinary)}
              >
                <Text style={[styles.binaryButtonText, isBinary && styles.binaryButtonTextActive]}>
                  {isBinary ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            </View>
            {!isBinary && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Target Value"
                  value={targetValue}
                  onChangeText={setTargetValue}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Unit"
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>
            )}
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text style={{ color: date ? '#000' : '#aaa' }}>{date ? date.toLocaleDateString() : 'Target Date'}</Text>
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
              <TouchableOpacity onPress={closeModal} style={[styles.modalButton, { marginRight: 8 }]}> 
                <Text style={{ color: '#800000' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateGoal} style={[styles.modalButton, { backgroundColor: '#800000' }]}> 
                <Text style={{ color: '#fff' }}>Create Goal</Text>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Contribution</Text>
            {(() => {
              if (contributionModal.goalIdx === null) return null;
              const goal = goals[contributionModal.goalIdx];
              if (goal.isBinary) {
                return (
                  <TouchableOpacity
                    style={styles.binaryContributionBox}
                    onPress={() => {
                      setGoals(goals => goals.map((g, i) => 
                        i === contributionModal.goalIdx 
                          ? { ...g, contributions: [1] } 
                          : g
                      ));
                      closeContributionModal();
                    }}
                  >
                    <Text style={styles.binaryContributionText}>Mark as Done</Text>
                  </TouchableOpacity>
                );
              }
              return (
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount"
                  value={contributionValue}
                  onChangeText={setContributionValue}
                  keyboardType="numeric"
                  editable={!isFailed(goal)}
                />
              );
            })()}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity onPress={closeContributionModal} style={[styles.modalButton, { marginRight: 8 }]}> 
                <Text style={{ color: '#800000' }}>Cancel</Text>
              </TouchableOpacity>
              {!goals[contributionModal.goalIdx || 0]?.isBinary && (
                <TouchableOpacity
                  onPress={handleAddContribution}
                  style={[styles.modalButton, { backgroundColor: '#800000' }]}
                  disabled={(() => {
                    if (contributionModal.goalIdx === null) return false;
                    const goal = goals[contributionModal.goalIdx];
                    return isFailed(goal);
                  })()}
                >
                  <Text style={{ color: '#fff' }}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
            {(() => {
              if (contributionModal.goalIdx === null) return null;
              const goal = goals[contributionModal.goalIdx];
              if (isFailed(goal)) {
                return <Text style={{ color: 'red', marginTop: 8 }}>You cannot add contributions to a failed goal.</Text>;
              }
              return null;
            })()}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f7f7f7', padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#800000', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#800000', marginBottom: 16 },
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
  failedLabel: { color: 'red', fontWeight: 'bold', marginTop: 8, textAlign: 'center' },
  binaryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  binaryLabel: {
    color: '#800000',
    fontSize: 16,
  },
  binaryButton: {
    borderWidth: 1,
    borderColor: '#800000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  binaryButtonActive: {
    backgroundColor: '#800000',
  },
  binaryButtonText: {
    color: '#800000',
  },
  binaryButtonTextActive: {
    color: '#fff',
  },
  binaryContributionBox: {
    borderWidth: 2,
    borderColor: '#800000',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  binaryContributionText: {
    color: '#800000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Goals; 