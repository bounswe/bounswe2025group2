import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import CustomText from './CustomText';
import { useTheme } from '../context/ThemeContext';
import { Message } from '../context/ChatContext';

type MessageBubbleProps = {
  message: Message;
  isMine: boolean;
};

const MessageBubble = ({ message, isMine }: MessageBubbleProps) => {
  const { colors } = useTheme();

  // Format the timestamp for display
  const formatTime = (created: string): string => {
    const date = new Date(created);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  return (
    <View
      style={[
        styles.container,
        isMine ? styles.myMessage : styles.theirMessage,
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isMine ? colors.mentionText : colors.navBar,
            borderBottomLeftRadius: isMine ? 16 : 0,
            borderBottomRightRadius: isMine ? 0 : 16,
          },
        ]}
      >
        {message.body ? (
          <CustomText
            style={[
              styles.text,
              { color: isMine ? '#FFFFFF' : colors.text },
            ]}
          >
            {message.body}
          </CustomText>
        ) : null}
        <View style={styles.timeContainer}>
          <CustomText
            style={[
              styles.time,
              { color: isMine ? 'rgba(255,255,255,0.7)' : colors.subText },
            ]}
          >
            {formatTime(message.created)}
          </CustomText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    marginVertical: 4,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    minWidth: 80,
  },
  text: {
    fontSize: 16,
    marginTop: 4,
  },
  image: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginBottom: 4,
    resizeMode: 'cover',
    alignSelf: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  time: {
    fontSize: 10,
  },
});

export default MessageBubble; 