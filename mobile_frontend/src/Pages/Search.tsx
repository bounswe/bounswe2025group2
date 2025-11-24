import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '@constants/api';

interface SearchUser {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

const Search = () => {
  const { colors } = useTheme();
  const { getAuthHeader, currentUser } = useAuth();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}users/`, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const users: SearchUser[] = await response.json();
        // Filter users based on search query (case-insensitive)
        const filtered = users.filter((user) => {
          // Exclude current user
          if (currentUser && (user.id === currentUser.id || user.username === currentUser.username)) {
            return false;
          }
          // Search in username, first_name, and last_name
          const usernameMatch = user.username?.toLowerCase().includes(query.toLowerCase());
          const firstNameMatch = user.first_name?.toLowerCase().includes(query.toLowerCase());
          const lastNameMatch = user.last_name?.toLowerCase().includes(query.toLowerCase());
          return usernameMatch || firstNameMatch || lastNameMatch;
        });
        setSearchResults(filtered);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeader, currentUser]);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for debounced search
    if (searchQuery.length >= 3) {
      const timer = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300); // 300ms debounce
      setDebounceTimer(timer);
    } else {
      setSearchResults([]);
    }

    // Cleanup
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [searchQuery, searchUsers]);

  const handleUserPress = (username: string) => {
    // @ts-ignore
    navigation.navigate('Profile', { username });
  };

  const renderUserItem = ({ item }: { item: SearchUser }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        {
          backgroundColor: colors.navBar,
          borderBottomColor: colors.border,
        },
      ]}
      onPress={() => handleUserPress(item.username)}
    >
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.border }]}>
          <CustomText style={[styles.avatarText, { color: colors.background }]}>
            {item.username[0]?.toUpperCase() || '?'}
          </CustomText>
        </View>
        <View style={styles.userDetails}>
          <CustomText style={[styles.username, { color: colors.text }]}>
            {item.username}
          </CustomText>
          {(item.first_name || item.last_name) && (
            <CustomText style={[styles.fullName, { color: colors.subText }]}>
              {[item.first_name, item.last_name].filter(Boolean).join(' ')}
            </CustomText>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.navBar }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholder="Search users..."
          placeholderTextColor={colors.subText}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.border} />
          </View>
        )}
      </View>

      {searchQuery.length > 0 && searchQuery.length < 3 && (
        <View style={styles.messageContainer}>
          <CustomText style={[styles.messageText, { color: colors.subText }]}>
            Type at least 3 characters to search
          </CustomText>
        </View>
      )}

      {searchQuery.length >= 3 && !isLoading && searchResults.length === 0 && (
        <View style={styles.messageContainer}>
          <CustomText style={[styles.messageText, { color: colors.subText }]}>
            No users found
          </CustomText>
        </View>
      )}

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUserItem}
        style={styles.resultsList}
        contentContainerStyle={
          searchResults.length === 0 ? styles.emptyList : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  loadingContainer: {
    position: 'absolute',
    right: 28,
    top: 28,
  },
  messageContainer: {
    padding: 20,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    textAlign: 'center',
  },
  resultsList: {
    flex: 1,
  },
  emptyList: {
    flexGrow: 1,
  },
  userItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fullName: {
    fontSize: 14,
  },
});

export default Search;

