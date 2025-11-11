import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
import UserChats from './UserChats';
import AiChats from './AiChats';

type ChatsTab = 'user' | 'ai';

const Chats = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<ChatsTab>('user');

  const renderTabButton = (tab: ChatsTab, label: string) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[
          styles.tabButton,
          {
            backgroundColor: isActive ? colors.active : colors.navBar,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setActiveTab(tab)}
      >
        <CustomText
          style={[
            styles.tabLabel,
            {
              color: isActive ? colors.userMessageText : colors.text,
            },
          ]}
        >
          {label}
        </CustomText>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.tabContainer}>
        {renderTabButton('user', 'User Chats')}
        {renderTabButton('ai', 'AI Tutor')}
      </View>

      <View style={styles.content}>
        {activeTab === 'user' ? (
          <UserChats navigation={navigation} />
        ) : (
          <AiChats navigation={navigation} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});

export default Chats;
