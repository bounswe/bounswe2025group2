import React, { useEffect, useState } from 'react';
import { Appbar, Avatar, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '@constants/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TopBar = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation() as NavigationProp;
  const { getAuthHeader } = useAuth();

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
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProfileData();
    return () => { isMounted = false; };
  }, []);

  return (
    <Appbar.Header
      elevated
      statusBarHeight={insets.top}
      style={{ backgroundColor: theme.colors.surface }}
    >
      <Appbar.Content 
        title="GenFit" 
        titleStyle={{ 
          color: theme.colors.primary,
          fontWeight: '600',
          fontSize: 20
        }}
      />
      <Appbar.Action 
        icon="magnify" 
        onPress={() => navigation.navigate('Search')}
        iconColor={theme.colors.primary}
      />
      <Appbar.Action 
        icon="bell-outline" 
        onPress={() => navigation.navigate('Notifications')}
        iconColor={theme.colors.primary}
      />
      <Appbar.Action 
        icon="cog-outline" 
        onPress={() => navigation.navigate('Settings')}
        iconColor={theme.colors.primary}
      />
      <Appbar.Action
        icon={() => {
          if (loading) {
            return <Avatar.Icon size={32} icon="account" />;
          }
          if (profileImage && !profileImage.endsWith('default.png')) {
            return <Avatar.Image size={32} source={{ uri: profileImage }} />;
          }
          return (
            <Avatar.Text 
              size={32} 
              label={username?.[0]?.toUpperCase() || '?'}
            />
          );
        }}
        onPress={() => navigation.getParent()?.navigate('Profile')}
      />
    </Appbar.Header>
  );
};

export default TopBar;
