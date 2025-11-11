import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { useAiChat } from '../context/AiChatContext';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';

type AiChatsProps = {
  navigation: any;
};

const AiChats = ({ navigation }: AiChatsProps) => {
  const { colors } = useTheme();
  const {
    aiChats,
    isLoadingChats,
    selectedAiChatId,
    fetchAiChats,
    createAiChat,
    selectAiChat,
  } = useAiChat();
  const [isCreating, setIsCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleCreateAiChat = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const newChat = await createAiChat();
      if (newChat) {
        Toast.show({
          type: 'success',
          text1: 'AI Chat Created',
          text2: 'Say hi to your AI fitness tutor!',
        });
        navigation.navigate('AiChatDetail', { chatId: newChat.id });
      }
    } catch (error) {
      console.error('[AiChats] Failed to create AI chat:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to create AI chat. Please try again.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectChat = async (chatId: number) => {
    await selectAiChat(chatId);
    navigation.navigate('AiChatDetail', { chatId });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAiChats();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAiChats();
    }, [fetchAiChats]),
  );

  const renderChatItem = ({ item }: { item: any }) => {
    const isActive = selectedAiChatId === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.chatItem,
          {
            backgroundColor: colors.navBar,
            borderBottomColor: colors.border,
            borderLeftColor: isActive ? colors.active : 'transparent',
          },
        ]}
        onPress={() => handleSelectChat(item.id)}
      >
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <CustomText
              style={[styles.chatName, { color: colors.text }]}
            >
              AI Fitness Tutor
            </CustomText>
            <CustomText
              style={[styles.chatTime, { color: colors.subText }]}
            >
              {new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </CustomText>
          </View>
          <CustomText
            style={[styles.chatSubtitle, { color: colors.subText }]}
          >
            Chat #{item.id}
          </CustomText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <CustomText style={[styles.title, { color: colors.text }]}>
          AI Fitness Tutor
        </CustomText>
        <TouchableOpacity
          style={[
            styles.newChatButton,
            { backgroundColor: colors.active },
          ]}
          onPress={handleCreateAiChat}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color={colors.userMessageText} />
          ) : (
            <CustomText
              style={[styles.newChatText, { color: colors.userMessageText }]}
            >
              +
            </CustomText>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={aiChats}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderChatItem}
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.active}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <CustomText style={[styles.emptyTitle, { color: colors.subText }]}>
              No AI chats yet
            </CustomText>
            <CustomText style={[styles.emptySubtitle, { color: colors.subText }]}>
              Start a conversation with your AI tutor to get personalized guidance.
            </CustomText>
          </View>
        }
        ListHeaderComponent={
          isLoadingChats ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.active} />
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
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
  list: {
    flex: 1,
  },
  chatItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderLeftWidth: 4,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
  },
  chatSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default AiChats;


