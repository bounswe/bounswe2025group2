import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import CustomText from './CustomText';

// Import SVG icons
import MenuIcon from '../assets/images/menu.svg';
import SearchIcon from '../assets/images/search.svg';

const TopBar = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const CONTENT_HEIGHT = 49; // Height of the actual content area

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.navBar,
          borderBottomColor: colors.border,
          paddingTop: insets.top,
          height: CONTENT_HEIGHT + insets.top, // Total height includes status bar height
        }
      ]}
    >
      <View style={styles.leftSection}>
        <MenuIcon width={42} height={42} fill={colors.border} />
        <CustomText style={[styles.appTitle, { color: colors.border }]}>Generic_Sports_App</CustomText>
      </View>
      <View style={styles.rightSection}>
        <SearchIcon width={36} height={36} fill={colors.border} />
        <View style={[styles.profileContainer, { borderColor: colors.border }]}>
          <Image 
            source={require('../assets/temp_images/profile.png')}
            style={styles.profile}
            resizeMode="cover"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '500',
    marginLeft: 8,
  },
  profileContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profile: {
    width: 40,
    height: 40,
  },
});

export default TopBar;
