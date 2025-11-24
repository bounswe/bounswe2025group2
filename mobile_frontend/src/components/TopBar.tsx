import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Pressable, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import CustomText from './CustomText';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';
import { API_URL } from '@constants/api';

// Import SVG icons
import SettingsIcon from '../assets/images/settings.svg';
import NotificationsIcon from '../assets/images/notifications.svg';
import SearchIcon from '../assets/images/search.svg';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TopBar = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation() as NavigationProp;
  const { getAuthHeader } = useAuth();
  const CONTENT_HEIGHT = 49; // Height of the actual content area

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // Fetch profile picture
        const picRes = await fetch(`${API_URL}profile/picture/`, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
          },
        });
        let image = null;
        if (picRes.ok) {
          const contentType = picRes.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const picData = await picRes.json();
            image = picData.image || null;
          } else if (contentType && contentType.includes('image/')) {
            image = `${API_URL}profile/picture/?t=` + Date.now();
          }
        }
        // Fetch username
        const userRes = await fetch(`${API_URL}profile/`, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
          },
        });
        let uname = '';
        if (userRes.ok) {
          const userData = await userRes.json();
          console.log('PROFILE PIC:', image);
          console.log('USERNAME:', userData.username || '');
          uname = userData.username || '';
        }
        if (isMounted) {
          setProfileImage(image);
          setUsername(uname);
        }
      } catch (e) {
        if (isMounted) {
          setProfileImage(null);
          setUsername('');
          console.log(e + ' error');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProfileData();
    return () => { isMounted = false; };
  }, []);

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
        <CustomText style={[styles.appTitle, { color: colors.border }]}>GenFit</CustomText>
      </View>
      <View style={styles.rightSection}>
        <Pressable onPress={() => navigation.navigate('Search')}>
          <SearchIcon width={36} height={36} fill={colors.border} />
        </Pressable>
          <Pressable onPress={() => navigation.navigate('Exercises')}>
            <View style={[styles.infoButton, { borderColor: colors.border }]}>
              <Text style={[styles.infoIcon, { color: colors.border }]}>𝑖</Text>
            </View>
          </Pressable>
        <Pressable onPress={() => navigation.navigate('Notifications')}>
          <NotificationsIcon width={36} height={36} color={colors.border} />
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Settings')}>
          <SettingsIcon width={36} height={36} fill={colors.border} />
        </Pressable>
        <Pressable onPress={() => navigation.getParent()?.navigate('Profile')}>
          <View style={[styles.profileContainer, { borderColor: colors.border }]}> 
            {loading ? (
              <ActivityIndicator size="small" color={colors.border} />
            ) : profileImage && !profileImage.endsWith('default.png') ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profile}
                resizeMode="cover"
              />
            ) : username ? (
              <View style={[styles.fallbackCircle, { backgroundColor: colors.border }]}> 
                <Text style={styles.fallbackText}>{username[0]?.toUpperCase() || '?'}</Text>
              </View>
            ) : (
              <View style={[styles.fallbackCircle, { backgroundColor: colors.border }]}> 
                <Text style={styles.fallbackText}>?</Text>
              </View>
            )}
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
    justifyContent: 'flex-start',
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
  fallbackCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ccc',
  },
  fallbackText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
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
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  infoIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default TopBar;
