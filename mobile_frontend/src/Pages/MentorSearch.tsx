import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  IconButton,
  Text,
  TextInput,
  useTheme,
  Chip,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '@constants/api';

interface User {
  id: number;
  username: string;
  user_type?: string;
}

const MentorSearch = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { getAuthHeader } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const getSanitizedAuthHeader = (): Record<string, string> => {
    const header = getAuthHeader() as { Authorization?: string };
    const authValue = header?.Authorization;
    if (authValue && authValue.trim().length > 0) {
      return { Authorization: authValue };
    }
    return {};
  };

  // Fetch all users
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}users/`, {
        headers: {
          ...getSanitizedAuthHeader(),
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    staleTime: 5 * 60_000,
  });

  // Filter users based on search term
  const filteredUsers = debouncedSearchTerm.trim()
    ? allUsers.filter((user: User) =>
        user.username.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    : allUsers;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleUserPress = (username: string) => {
    // @ts-ignore
    navigation.push('Profile', { username });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Header */}
      <Card mode="outlined" style={styles.searchCard}>
        <Card.Content>
          <Text variant="headlineSmall" style={{ marginBottom: 12 }}>
            Find Mentors & Mentees
          </Text>
          <TextInput
            mode="outlined"
            placeholder="Search by username..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            left={<TextInput.Icon icon="magnify" />}
            right={
              searchTerm ? (
                <TextInput.Icon
                  icon="close"
                  onPress={() => setSearchTerm('')}
                />
              ) : null
            }
            style={styles.searchInput}
          />
          <Text variant="bodySmall" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>
            Browse users to send mentor or mentee requests
          </Text>
        </Card.Content>
      </Card>

      {/* Users List */}
      <ScrollView style={styles.usersList} contentContainerStyle={styles.usersListContent}>
        {allUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" />
            <Text variant="bodyMedium" style={{ marginTop: 12 }}>
              Loading users...
            </Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              No users found matching "{searchTerm}"
            </Text>
          </View>
        ) : (
          filteredUsers.map((user: User) => (
            <Card
              key={user.id}
              mode="outlined"
              style={styles.userCard}
              onPress={() => handleUserPress(user.username)}
            >
              <Card.Content style={styles.userCardContent}>
                <View style={styles.userInfo}>
                  <Avatar.Text
                    size={56}
                    label={user.username.charAt(0).toUpperCase()}
                  />
                  <View style={styles.userDetails}>
                    <Text variant="titleMedium">{user.username}</Text>
                    {user.user_type && (
                      <Chip
                        style={{ marginTop: 4, alignSelf: 'flex-start' }}
                      >
                        {user.user_type}
                      </Chip>
                    )}
                  </View>
                </View>
                <IconButton
                  icon="chevron-right"
                  size={24}
                  onPress={() => handleUserPress(user.username)}
                />
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchCard: {
    margin: 16,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: 'transparent',
  },
  usersList: {
    flex: 1,
  },
  usersListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  userCard: {
    marginBottom: 12,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
});

export default MentorSearch;
