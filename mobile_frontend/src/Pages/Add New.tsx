import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';

const AddNew = () => {
  const { colors } = useTheme();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <CustomText style={styles.title}>TODO</CustomText>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default AddNew;
