import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
// import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import CustomText from '../components/CustomText';
import { useTheme } from '../context/ThemeContext';

// Import SVG icons
import HomeIcon from '../assets/images/home.svg';
import CommunitiesIcon from '../assets/images/communities.svg';
import MentorsIcon from '../assets/images/mentors.svg';
import ChatsIcon from '../assets/images/chats.svg';
import GoalsIcon from '../assets/images/target.svg';
import NotificationsIcon from '../assets/images/notifications.svg'; // Dartboard/target icon for Goals tab

const BottomBar = ({ state, navigation }: any) => {
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
      <Pressable style={styles.tab} onPress={() => navigateToScreen('Forum')}>
        <CommunitiesIcon
          width={32}
          height={32}
          fill={isActiveRoute('Forum') ? colors.active : colors.passive}
        />
        <CustomText
          style={[
            styles.label,
            {
              color: isActiveRoute('Forum') ? colors.active : colors.passive,
              fontWeight: isActiveRoute('Forum') ? 'bold' : 'normal'
            }
          ]}
        >
          Forum
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
      <Pressable style={styles.tab} onPress={() => navigateToScreen('Notifications')}>
        <NotificationsIcon 
          width={32} 
          height={32} 
          color={isActiveRoute('Notifications') ? colors.active : colors.passive} 
        />
        <CustomText 
          style={[
            styles.label, 
            { 
              color: isActiveRoute('Notifications') ? colors.active : colors.passive,
              fontWeight: isActiveRoute('Notifications') ? 'bold' : 'normal'
            }
          ]}
        >
          Notifications
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
