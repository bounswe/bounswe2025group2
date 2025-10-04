import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';

const Profile = () => {
  const { colors } = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <CustomText style={styles.title}>TODO</CustomText>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  content: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Profile; 