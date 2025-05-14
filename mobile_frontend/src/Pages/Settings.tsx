import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import Cookies from '@react-native-cookies/cookies';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Settings = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const navigation = useNavigation();
  const { getAuthHeader } = useAuth ? useAuth() : { getAuthHeader: () => ({}) };
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [location, setLocation] = useState<string>('Loading...');

  const getCSRFToken = async () => {
    const cookies = await Cookies.get('http://10.0.2.2:8000');
    return cookies.csrftoken?.value;
  };
  
  // Load notification preference from storage
  useEffect(() => {
    (async () => {
      try {
        const value = await AsyncStorage.getItem('notificationsEnabled');
        if (value !== null) {
          setNotificationsEnabled(value === 'true');
        }
      } catch (e) {}
    })();
  }, []);

  // Fetch location on mount
  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    try {
      const response = await fetch('http://10.0.2.2:8000/api/ip-location/', {
        headers: {
          ...(getAuthHeader ? getAuthHeader() : {}),
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLocation(data.region || 'Unknown');
      } else {
        console.error('Failed to fetch location:', response.status);
        setLocation('Not available');
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      setLocation('Error');
    }
  };

  const handleToggleNotifications = async () => {
    try {
      const newValue = !notificationsEnabled;
      setNotificationsEnabled(newValue);
      await AsyncStorage.setItem('notificationsEnabled', newValue.toString());
    } catch (e) {}
  };

  const handleLogout = async () => {
    try {
      // Call logout endpoint
      await fetch('http://10.0.2.2:8000/api/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // Clear all cookies for the API domain
      await Cookies.clearAll(true);
      console.log('Cookies cleared after logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
        <CustomText style={[styles.settingText, { color: colors.text }]}>Dark Theme</CustomText>
        <Switch
          trackColor={{ false: colors.border, true: colors.active }}
          thumbColor={colors.navBar}
          value={isDark}
          onValueChange={toggleTheme}
        />
      </View>
      <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
        <CustomText style={[styles.settingText, { color: colors.text }]}>Notifications</CustomText>
        <Switch
          trackColor={{ false: colors.border, true: colors.active }}
          thumbColor={colors.navBar}
          value={notificationsEnabled}
          onValueChange={handleToggleNotifications}
        />
      </View>
      <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
        <CustomText style={[styles.settingText, { color: colors.text }]}>Location</CustomText>
        <CustomText style={[styles.settingValue, { color: colors.text }]}>{location}</CustomText>
      </View>
      <TouchableOpacity
        style={[styles.settingItem, { borderBottomColor: colors.border }]}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <CustomText style={[styles.settingText, { color: colors.text }]}>Edit Profile</CustomText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.settingItem, { borderBottomColor: colors.border }]}
        onPress={handleLogout}
      >
        <CustomText style={[styles.settingText, { color: '#000000' }]}>Log Out</CustomText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingText: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 16,
    fontStyle: 'italic',
  },
});

export default Settings;