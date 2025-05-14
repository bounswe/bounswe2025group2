import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import CustomText from './CustomText';
import { useTheme } from '../context/ThemeContext';
import { Contact, useChat } from '../context/ChatContext';

type ChatListItemProps = {
  contact: Contact;
  onPress: (contactId: string) => void;
  isActive: boolean;
};

const ChatListItem = ({ contact, onPress, isActive }: ChatListItemProps) => {
  const { colors } = useTheme();
  const { getMessages } = useChat();
  
  // Get the last message from this contact
  const getLastMessagePreview = (): string => {
    const messages = getMessages(contact.id);
    if (messages.length === 0) return '';
    
    // Get the most recent message
    const lastMessage = messages[messages.length - 1];
    
    // Truncate if too long
    const preview = lastMessage.content.length > 35 
      ? lastMessage.content.substring(0, 35) + '...'
      : lastMessage.content;
      
    // Add sender indicator for group chats (like Basketball Team)
    if (contact.id === '3' && lastMessage.senderId !== 'currentUser') {
      const senderNames = {
        '3': 'Coach', // Group messages could have different senders
      };
      
      const senderName = senderNames[lastMessage.senderId as keyof typeof senderNames] || 'Team Member';
      return `${senderName}: ${preview}`;
    }
    
    return preview;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container, 
        { 
          backgroundColor: isActive ? colors.mentionText + '20' : 'transparent',
          borderBottomColor: colors.border + '30',
        }
      ]}
      onPress={() => onPress(contact.id)}
    >
      <View style={styles.avatarContainer}>
        <Image source={contact.avatar} style={styles.avatar} />
        {contact.status === 'online' && (
          <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
        )}
        {contact.status === 'away' && (
          <View style={[styles.statusDot, { backgroundColor: '#FFC107' }]} />
        )}
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <CustomText style={[styles.name, { color: colors.text }]}>
            {contact.name}
          </CustomText>
          <CustomText style={[styles.time, { color: colors.subText }]}>
            {contact.lastSeen}
          </CustomText>
        </View>
        <View style={styles.previewRow}>
          <CustomText 
            style={[
              styles.preview, 
              { 
                color: contact.unreadCount > 0 ? colors.text : colors.subText,
                fontWeight: contact.unreadCount > 0 ? 'bold' : 'normal'
              }
            ]}
            numberOfLines={1}
          >
            {getLastMessagePreview()}
          </CustomText>
          {contact.unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.mentionText }]}>
              <CustomText style={styles.badgeText}>
                {contact.unreadCount}
              </CustomText>
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
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'white',
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