import React from 'react';
import { View, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
const { useNavigation } = require('@react-navigation/native');
import AsyncStorage from '@react-native-async-storage/async-storage';

const Settings = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const navigation = useNavigation();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);

  React.useEffect(() => {
    // Load notification preference from storage
    (async () => {
      try {
        const value = await AsyncStorage.getItem('notificationsEnabled');
        if (value !== null) {
          setNotificationsEnabled(value === 'true');
        }
      } catch (e) {}
    })();
  }, []);

  const handleToggleNotifications = async () => {
    try {
      const newValue = !notificationsEnabled;
      setNotificationsEnabled(newValue);
      await AsyncStorage.setItem('notificationsEnabled', newValue.toString());
    } catch (e) {}
  };

  const handleLogout = () => {
    // Navigate to Login screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
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
});

export default Settings;