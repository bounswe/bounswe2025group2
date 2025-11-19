import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import {
  getAllUsers,
  getCurrentUser,
  createMentorRelationship,
  User,
} from '../services/mentorService';

const DEFAULT_PROFILE_PIC = require('../assets/temp_images/profile.png');

/**
 * FindMentor component allows users to search for and send mentor requests
 */
const FindMentor = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [requestingUserId, setRequestingUserId] = useState<number | null>(null);

  /**
   * Fetch all users and current user info
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, currentUserData] = await Promise.all([
          getAllUsers(),
          getCurrentUser(),
        ]);
        
        // Filter out current user from the list
        const otherUsers = usersData.filter(u => u.id !== currentUserData.id);
        setUsers(otherUsers);
        setFilteredUsers(otherUsers);
        setCurrentUser(currentUserData);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /**
   * Handle search input changes
   */
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  /**
   * Handle sending a mentor request
   */
  const handleSendRequest = async (targetUser: User, requestAsMentee: boolean) => {
    if (!currentUser) return;

    setRequestingUserId(targetUser.id);

    try {
      const mentorId = requestAsMentee ? targetUser.id : currentUser.id;
      const menteeId = requestAsMentee ? currentUser.id : targetUser.id;

      await createMentorRelationship(mentorId, menteeId);
      
      Alert.alert(
        'Success',
        `Mentor request sent to ${targetUser.username}`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send mentor request');
    } finally {
      setRequestingUserId(null);
    }
  };

  /**
   * Show dialog to choose mentor/mentee role
   */
  const showRoleDialog = (user: User) => {
    Alert.alert(
      'Choose Role',
      `How would you like to connect with ${user.username}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Request as Mentee',
          onPress: () => handleSendRequest(user, true),
        },
        {
          text: 'Offer as Mentor',
          onPress: () => handleSendRequest(user, false),
        },
      ]
    );
  };

  /**
   * Get the profile picture URL for a user
   */
  const getProfilePictureUrl = (username: string) => {
    return `http://10.0.2.2:8000/api/profile/other/picture/${username}/?t=${Date.now()}`;
  };

  /**
   * Render a single user item
   */
  const renderUserItem = ({ item }: { item: User }) => {
    const isRequesting = requestingUserId === item.id;

    return (
      <View style={[styles.userCard, { backgroundColor: colors.navBar }]}>
        <View style={styles.userHeader}>
          <Image
            source={{ uri: getProfilePictureUrl(item.username) }}
            defaultSource={DEFAULT_PROFILE_PIC}
            style={styles.profilePic}
          />
          <View style={styles.userInfo}>
            <Text style={[styles.username, { color: colors.text }]}>
              {item.username}
            </Text>
            <Text style={[styles.userType, { color: colors.subText }]}>
              {item.user_type}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.requestButton,
            { backgroundColor: isRequesting ? colors.subText : colors.active },
          ]}
          onPress={() => showRoleDialog(item)}
          disabled={isRequesting}
        >
          {isRequesting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send Request</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.active} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={[styles.backButtonText, { color: colors.active }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Find a Mentor</Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.navBar }]}>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by username or email..."
          placeholderTextColor={colors.subText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUserItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.subText }]}>
              No users found
            </Text>
          </View>
        }
        contentContainerStyle={
          filteredUsers.length === 0 ? styles.emptyList : styles.list
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    fontSize: 16,
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  emptyList: {
    flex: 1,
  },
  userCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userType: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  requestButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default FindMentor;
