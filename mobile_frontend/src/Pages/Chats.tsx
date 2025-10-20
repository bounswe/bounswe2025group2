import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  Alert,
  RefreshControl
} from 'react-native';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { useChat, Contact } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';

const Chats = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { 
    chats, 
    contacts, 
    fetchChats, 
    fetchContacts, 
    createChat, 
    connectToChat 
  } = useChat();
  const { isAuthenticated, currentUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedContact, setSelectedContact] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
    fetchChats();
      fetchContacts();
    }
  }, [isAuthenticated]);

  // Auto-refresh when component comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isAuthenticated) {
        fetchChats();
        fetchContacts();
      }
    });

    return unsubscribe;
  }, [navigation, isAuthenticated]);

  // Filter contacts based on search query and exclude current user
  useEffect(() => {
    if (contacts) {
      const filtered = contacts.filter(contact => {
        // Exclude current user by both ID and username as fallback
        const isCurrentUser = (currentUser && contact.id === currentUser.id) || 
                             (currentUser && contact.username === currentUser.username);
        
        const matchesSearch = contact.username.toLowerCase().includes(searchQuery.toLowerCase());
        
        return !isCurrentUser && matchesSearch;
      });
      
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts([]);
    }
  }, [contacts, currentUser, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  };

  const handleChatPress = (chatId: number) => {
    connectToChat(chatId);
    // Navigate to chat detail screen
    navigation.navigate('ChatDetail', { chatId });
  };

  const handleCreateChat = async (contactId: number) => {
    try {
      const newChat = await createChat(contactId);
      if (newChat) {
        Toast.show({
          type: 'success',
          text1: 'Chat Created',
          text2: 'New conversation started',
        });
        setShowNewChat(false);
        setSelectedContact(null);
        setSearchQuery(''); // Clear search when chat is created
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to create chat',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create chat',
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const renderChatItem = ({ item }: { item: any }) => (
      <TouchableOpacity
      style={[styles.chatItem, { 
        backgroundColor: colors.navBar,
        borderBottomColor: colors.border 
      }]}
      onPress={() => handleChatPress(item.id)}
    >
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <CustomText style={[styles.chatName, { color: colors.text }]}>
            {item.other_user.username}
          </CustomText>
          <CustomText style={[styles.chatTime, { color: colors.subText }]}>
            {item.last_message ? formatTime(item.last_message.created) : ''}
        </CustomText>
        </View>
        <View style={styles.chatPreview}>
          <CustomText 
            style={[styles.lastMessage, { color: colors.subText }]}
            numberOfLines={1}
          >
            {item.last_message ? item.last_message.body : 'No messages yet'}
          </CustomText>
          {item.unread_count > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.active }]}>
              <CustomText style={[styles.unreadText, { color: colors.userMessageText }]}>
                {item.unread_count}
              </CustomText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContactItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.contactItem, { 
        backgroundColor: colors.navBar,
        borderBottomColor: colors.border 
      }]}
      onPress={() => handleCreateChat(item.id)}
    >
      <CustomText style={[styles.contactName, { color: colors.text }]}>
        {item.username}
      </CustomText>
      </TouchableOpacity>
    );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <CustomText style={[styles.title, { color: colors.text }]}>
            Please log in to view chats
          </CustomText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <CustomText style={[styles.title, { color: colors.text }]}>
          Chats
        </CustomText>
        <TouchableOpacity
          style={[styles.newChatButton, { backgroundColor: colors.active }]}
          onPress={() => {
            setShowNewChat(!showNewChat);
            if (showNewChat) {
              // Clear search when closing new chat section
              setSearchQuery('');
            }
          }}
        >
          <CustomText style={[styles.newChatText, { color: colors.userMessageText }]}>+</CustomText>
        </TouchableOpacity>
      </View>

      {showNewChat && (
        <View style={[styles.newChatSection, { backgroundColor: colors.navBar }]}>
          <CustomText style={[styles.sectionTitle, { color: colors.text }]}>
            Start New Chat
          </CustomText>
          
          {/* Search Bar */}
          <TextInput
            style={[styles.searchInput, { 
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="Search users..."
            placeholderTextColor={colors.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderContactItem}
            style={styles.contactsList}
            ListEmptyComponent={
              <View style={styles.emptyContactsContainer}>
                <CustomText style={[styles.emptyContactsText, { color: colors.subText }]}>
                  {searchQuery ? 'No users found matching your search' : 'No other users available'}
                </CustomText>
              </View>
            }
          />
        </View>
      )}

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderChatItem}
        style={styles.chatsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.active}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CustomText style={[styles.emptyText, { color: colors.subText }]}>
              No chats yet. Start a new conversation!
            </CustomText>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  newChatSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  contactsList: {
    maxHeight: 200,
  },
  contactItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  contactName: {
    fontSize: 16,
  },
  chatsList: {
    flex: 1,
  },
  chatItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
  },
  chatPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContactsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContactsText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default Chats;
