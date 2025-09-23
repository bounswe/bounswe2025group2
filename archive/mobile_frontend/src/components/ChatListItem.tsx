import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import CustomText from './CustomText';
import { useTheme } from '../context/ThemeContext';
import { Chat } from '../context/ChatContext';

type ChatListItemProps = {
  chat: Chat;
  onPress: (chatId: number) => void;
  isActive: boolean;
};

const ChatListItem = ({ chat, onPress, isActive }: ChatListItemProps) => {
  const { colors } = useTheme();
  const lastMessage = chat.last_message;
  const preview = lastMessage ? (lastMessage.body.length > 35 ? lastMessage.body.substring(0, 35) + '...' : lastMessage.body) : '';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isActive ? colors.mentionText + '20' : 'transparent',
          borderBottomColor: colors.border + '30',
        },
      ]}
      onPress={() => onPress(chat.id)}
    >
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <CustomText style={[styles.name, { color: colors.text }]}> 
            {chat.other_user.username}
          </CustomText>
          <CustomText style={[styles.time, { color: colors.subText }]}> 
            {/* Optionally format chat.created */}
          </CustomText>
        </View>
        <View style={styles.previewRow}>
          <CustomText
            style={[
              styles.preview,
              {
                color: chat.unread_count > 0 ? colors.text : colors.subText,
                fontWeight: chat.unread_count > 0 ? 'bold' : 'normal',
              },
            ]}
            numberOfLines={1}
          >
            {preview}
          </CustomText>
          {chat.unread_count > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.mentionText }]}> 
              <CustomText style={styles.badgeText}>{chat.unread_count}</CustomText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  time: {
    fontSize: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preview: {
    fontSize: 14,
    flex: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ChatListItem; 