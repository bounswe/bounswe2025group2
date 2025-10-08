import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import CustomText from '../components/CustomText';
import { useTheme } from '../context/ThemeContext';

// Import SVG icons
import HomeIcon from '../assets/images/home.svg';
import CommunitiesIcon from '../assets/images/communities.svg';
import NewIcon from '../assets/images/new.svg';
import MentorsIcon from '../assets/images/mentors.svg';
import ChatsIcon from '../assets/images/chats.svg';
import GoalsIcon from '../assets/images/target.svg';
import ChallengesIcon from '../assets/images/challenge.svg';

const BottomBar = ({ state, navigation }: BottomTabBarProps) => {
  const { colors } = useTheme();

  const navigateToScreen = (name: string) => {
    navigation.navigate(name);
  };

  const isActiveRoute = (routeName: string) => state.routeNames[state.index] === routeName;

  return (
    <View style={[styles.container, { backgroundColor: colors.navBar }]}>
      <Pressable style={styles.tab} onPress={() => navigateToScreen('Home')}>
        <HomeIcon 
          width={32} 
          height={32} 
          fill={isActiveRoute('Home') ? colors.active : colors.passive} 
        />
        <CustomText 
          style={[
            styles.label, 
            { 
              color: isActiveRoute('Home') ? colors.active : colors.passive,
              fontWeight: isActiveRoute('Home') ? 'bold' : 'normal'
            }
          ]}
        >
          Home
        </CustomText>
      </Pressable>
      <Pressable style={styles.tab} onPress={() => navigateToScreen('AddNew')}>
        <NewIcon 
          width={32} 
          height={32} 
          fill={isActiveRoute('AddNew') ? colors.active : colors.passive} 
        />
        <CustomText 
          style={[
            styles.label, 
            { 
              color: isActiveRoute('AddNew') ? colors.active : colors.passive,
              fontWeight: isActiveRoute('AddNew') ? 'bold' : 'normal'
            }
          ]}
        >
          New
        </CustomText>
      </Pressable>
      <Pressable style={styles.tab} onPress={() => navigateToScreen('Chats')}>
        <ChatsIcon 
          width={32} 
          height={32} 
          fill={isActiveRoute('Chats') ? colors.active : colors.passive} 
        />
        <CustomText 
          style={[
            styles.label, 
            { 
              color: isActiveRoute('Chats') ? colors.active : colors.passive,
              fontWeight: isActiveRoute('Chats') ? 'bold' : 'normal'
            }
          ]}
        >
          Chats
        </CustomText>
      </Pressable>
      <Pressable style={styles.tab} onPress={() => navigateToScreen('Goals')}>
        <GoalsIcon 
          width={32} 
          height={32} 
          color={isActiveRoute('Goals') ? colors.active : colors.passive} 
        />
        <CustomText 
          style={[
            styles.label, 
            { 
              color: isActiveRoute('Goals') ? colors.active : colors.passive,
              fontWeight: isActiveRoute('Goals') ? 'bold' : 'normal'
            }
          ]}
        >
          Goals
        </CustomText>
      </Pressable>
      <Pressable style={styles.tab} onPress={() => navigateToScreen('Challenges')}>
        <ChallengesIcon 
          width={36} 
          height={40} 
          fill={isActiveRoute('Challenges') ? colors.active : colors.passive} 
        />
        <CustomText 
          style={[
            styles.label, 
            { 
              color: isActiveRoute('Challenges') ? colors.active : colors.passive,
              fontWeight: isActiveRoute('Challenges') ? 'bold' : 'normal'
            }
          ]}
        >
          Challenges
        </CustomText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 65,
    borderTopWidth: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 10,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    paddingTop: 8,
  },
  label: {
    fontSize: 12,
    marginTop: 6,
  },
});

export default BottomBar;
