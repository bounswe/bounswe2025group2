import React from 'react';
import { View, StyleSheet, Image, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import CustomText from './CustomText';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Import SVG icons
import MenuIcon from '../assets/images/menu.svg';
import SearchIcon from '../assets/images/search.svg';
import SettingsIcon from '../assets/images/settings.svg';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TopBar = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
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
        <CustomText style={[styles.appTitle, { color: colors.border }]}>GenFit</CustomText>
      </View>
      <View style={styles.rightSection}>
        <Pressable onPress={() => navigation.navigate('ApiDemo')} style={styles.funCircle}>
          <Text style={styles.funText}>cat</Text>
        </Pressable>
        <SearchIcon width={36} height={36} fill={colors.border} />
        <Pressable onPress={() => navigation.navigate('Settings')}>
          <SettingsIcon width={36} height={36} fill={colors.border} />
        </Pressable>
        <Pressable onPress={() => navigation.getParent()?.navigate('Profile')}>
          <View style={[styles.profileContainer, { borderColor: colors.border }]}> 
            <Image 
              source={require('../assets/temp_images/profile.png')}
              style={styles.profile}
              resizeMode="cover"
            />
          </View>
        </Pressable>
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
  funCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#800000',
    marginRight: 8,
  },
  funText: {
    color: '#800000',
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'lowercase',
  },
});

export default TopBar;
