import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';

const NotificationPreferences = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomText style={[styles.text, { color: colors.text }]}>
        TODO
      </CustomText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
  },
});

export default NotificationPreferences;
