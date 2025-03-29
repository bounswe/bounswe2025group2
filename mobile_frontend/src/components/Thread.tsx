import React from 'react';
import { View, StyleSheet, Image, Pressable, ImageSourcePropType } from 'react-native';
import CustomText from './CustomText';
import { useTheme } from '../context/ThemeContext';
import MoreIcon from '../assets/images/more.svg';
import JoinIcon from '../assets/images/join.svg';

type ThreadProps = {
  forumName: string;
  content: string;
  imageUrl?: ImageSourcePropType;
  profilePic: ImageSourcePropType;
  username: string;
};

const Thread = ({ forumName, content, imageUrl, profilePic, username }: ThreadProps) => {
  const { colors } = useTheme();

  const renderContent = (text: string) => {
    const words = text.split(/(\s+)/);
    return words.map((word, index) => {
      if (word.startsWith('@')) {
        return (
          <CustomText 
            key={index} 
            style={[styles.content, styles.mention, { color: colors.mentionText }]}
          >
            {word}
          </CustomText>
        );
      }
      return (
        <CustomText 
          key={index} 
          style={[styles.content, { color: colors.text }]}
        >
          {word}
        </CustomText>
      );
    });
  };

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.forumSection}>
          <CustomText style={[styles.forumName, { color: colors.subText }]}>
            /{forumName}
          </CustomText>
          <Pressable style={[styles.joinButton, { backgroundColor: colors.navBar }]}>
            <JoinIcon width={20} height={20} fill={colors.subText} />
          </Pressable>
        </View>
      </View>
      
      <View style={styles.moreIconContainer}>
        <Pressable>
          <MoreIcon width={24} height={24} fill={colors.passive} />
        </Pressable>
      </View>

      <View style={styles.profileSection}>
        <Image 
          source={profilePic} 
          style={[styles.profilePic, { borderColor: colors.border }]} 
        />
        <CustomText style={[styles.username, { color: colors.subText }]}>
          @{username}
        </CustomText>
      </View>

      {imageUrl && (
        <Image
          source={imageUrl}
          style={[styles.image, { borderColor: colors.border }]}
        />
      )}

      <View style={styles.contentContainer}>
        {renderContent(content)}
      </View>

      <Pressable>
        <CustomText style={[styles.seeThread, { color: colors.subText }]}>
          See this thread in full context {'>'}
        </CustomText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 30,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  forumSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  forumName: {
    fontSize: 14,
  },
  joinButton: {
    padding: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  profilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
  },
  mention: {
    fontWeight: 'bold',
  },
  seeThread: {
    fontSize: 14,
  },
});

export default Thread;
