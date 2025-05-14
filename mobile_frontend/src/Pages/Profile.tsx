import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
// @ts-ignore: If types are missing, install @types/react-native-image-picker or ignore for now
import { launchImageLibrary } from 'react-native-image-picker';
import Cookies from '@react-native-cookies/cookies';

// Add Goal interface
interface Goal {
  id: number;
  title: string;
  description: string;
  user: number;
  mentor: number | null;
  goal_type: string;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  target_date: string;
  status: string;
  last_updated: string;
}

const Profile = () => {
  const navigation = useNavigation();
  const { getAuthHeader } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);

  // Move fetchProfile outside useEffect so it can be called after upload
  const fetchProfile = async (isMounted = true) => {
    setLoading(true);
    try {
      // Fetch profile picture
      const picRes = await fetch('http://10.0.2.2:8000/api/profile/picture/', {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });
      let image = null;
      if (picRes.ok) {
        const contentType = picRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const picData = await picRes.json();
          image = picData.image || null;
        } else if (contentType && contentType.includes('image/')) {
          image = 'http://10.0.2.2:8000/api/profile/picture/?t=' + Date.now();
        }
      }
      // Fetch user info (username, email)
      const userRes = await fetch('http://10.0.2.2:8000/api/user/', {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUsername(userData.username || '');
        setEmail(userData.email || '');
      }
      // Fetch profile info (name, surname, bio)
      const profileRes = await fetch('http://10.0.2.2:8000/api/profile/', {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setName(profileData.name || '');
        setSurname(profileData.surname || '');
        setBio(profileData.bio || '');
      }
      if (isMounted) {
        setProfileImage(image);
      }
    } catch (e) {
      if (isMounted) {
        setProfileImage(null);
        setUsername('');
        setEmail('');
      }
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchGoals = async () => {
      setGoalsLoading(true);
      try {
        const response = await fetch('http://10.0.2.2:8000/api/goals/', {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (isMounted) setGoals(data);
        } else {
          if (isMounted) setGoals([]);
        }
      } catch (e) {
        if (isMounted) setGoals([]);
      } finally {
        if (isMounted) setGoalsLoading(false);
      }
    };
    fetchProfile(isMounted);
    fetchGoals();
    return () => { isMounted = false; };
  }, []);

  // Calculate statistics
  const completedCount = goals.filter(g => g.status === 'COMPLETED').length;
  const activeCount = goals.filter(g => g.status === 'ACTIVE').length;
  const allCount = goals.length;
  const progress = allCount > 0 ? completedCount / allCount : 0;

  const handleProfileImagePress = async () => {
    // Open image picker
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || !result.assets || result.assets.length === 0) return;
    const asset = result.assets[0];
    if (!asset.uri) return;

    // Prepare form data
    const formData = new FormData();
    formData.append('profile_picture', {
      uri: asset.uri,
      name: asset.fileName || 'profile.jpg',
      type: asset.type || 'image/jpeg',
    });

    // Get CSRF token from cookies
    const cookies = await Cookies.get('http://10.0.2.2:8000');
    const csrfToken = cookies.csrftoken?.value;
    if (!csrfToken) {
      Alert.alert('Error', 'CSRF token not found. Please try logging in again.');
      return;
    }

    try {
      const response = await fetch('http://10.0.2.2:8000/api/profile/picture/upload/', {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'X-CSRFToken': csrfToken,
          // Do NOT set Content-Type manually!
        },
        credentials: 'include',
        body: formData,
      });
      if (response.ok) {
        setProfileImage(null); // force reload
        setTimeout(() => fetchProfile(), 500);
      } else {
        const errorText = await response.text();
        Alert.alert('Error', 'Failed to upload profile picture.\n' + errorText);
      }
    } catch (e) {
      Alert.alert('Error', 'Error uploading profile picture.');
    }
  };

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
      {loading ? (
        <ActivityIndicator size="large" color="#800000" style={{ marginVertical: 24 }} />
      ) : (
        <TouchableOpacity onPress={handleProfileImagePress} activeOpacity={0.7}>
          {profileImage && !profileImage.endsWith('default.png') ? (
            <Image
              source={{ uri: profileImage }}
              style={styles.avatar}
            />
          ) : username ? (
            <View style={[styles.avatar, styles.fallbackCircle]}> 
              <Text style={styles.fallbackText}>{username[0]?.toUpperCase() || '?'}</Text>
            </View>
          ) : (
            <View style={[styles.avatar, styles.fallbackCircle]}> 
              <Text style={styles.fallbackText}>?</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
      <Text style={styles.name}>{name || username}</Text>
      <Text style={styles.email}>{email}</Text>
      <Text style={styles.bio}>{bio}</Text>

      {/* Goal Statistics Card */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Goal Statistics</Text>
        {goalsLoading ? (
          <ActivityIndicator size="small" color="#800000" style={{ marginVertical: 16 }} />
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={styles.statValue}>{completedCount}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Active</Text>
                <Text style={styles.statValue}>{activeCount}</Text>
              </View>
            </View>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { flex: progress }]} />
              <View style={{ flex: 1 - progress }} />
            </View>
            <Text style={styles.motivation}>Keep pushing! You're almost there!</Text>
          </>
        )}
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
  avatar: { width: 110, height: 110, borderRadius: 55, marginBottom: 16, borderWidth: 3, borderColor: '#800000', alignItems: 'center', justifyContent: 'center' },
  fallbackCircle: { backgroundColor: '#800000', alignItems: 'center', justifyContent: 'center' },
  fallbackText: { color: '#fff', fontWeight: 'bold', fontSize: 48 },
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