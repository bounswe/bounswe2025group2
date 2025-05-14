import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Profile = () => {
  const navigation = useNavigation();
  const progress = 0.7; // Example: 70% progress

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Avatar and User Info */}
      <Image
        source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
        style={styles.avatar}
      />
      <Text style={styles.name}>John Doe</Text>
      <Text style={styles.email}>johndoe@example.com</Text>
      <Text style={styles.bio}>
        Passionate basketball player and fitness enthusiast. Loves to help others achieve their goals!
      </Text>

      {/* Goal Statistics Card */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Goal Statistics</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statValue}>5</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Active</Text>
            <Text style={styles.statValue}>2</Text>
          </View>
        </View>
        <Text style={styles.progressLabel}>Overall Progress</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { flex: progress }]} />
          <View style={{ flex: 1 - progress }} />
        </View>
        <Text style={styles.motivation}>Keep pushing! You're almost there!</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 16 },
  backButton: { padding: 8, marginRight: 8 },
  backButtonText: { fontSize: 24, color: '#800000' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#800000', flex: 1, textAlign: 'center', marginRight: 32 },
  avatar: { width: 110, height: 110, borderRadius: 55, marginBottom: 16, borderWidth: 3, borderColor: '#800000' },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 4, color: '#800000' },
  email: { fontSize: 15, color: 'gray', marginBottom: 8 },
  bio: { fontSize: 15, color: '#333', textAlign: 'center', marginBottom: 24 },
  statsCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#800000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 8,
  },
  statsTitle: { fontSize: 18, fontWeight: 'bold', color: '#800000', marginBottom: 12, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statBox: { alignItems: 'center' },
  statLabel: { color: '#800000', fontSize: 14 },
  statValue: { color: '#800000', fontWeight: 'bold', fontSize: 20 },
  progressLabel: { fontSize: 14, color: '#800000', marginBottom: 4, textAlign: 'center' },
  progressBarBackground: {
    flexDirection: 'row',
    height: 14,
    backgroundColor: '#eee',
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  progressBarFill: {
    backgroundColor: '#800000',
    height: 14,
    borderRadius: 7,
  },
  motivation: { fontSize: 14, color: '#800000', textAlign: 'center', marginTop: 8 },
});

export default Profile; 