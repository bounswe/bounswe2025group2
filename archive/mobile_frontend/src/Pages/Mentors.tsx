import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomText from '@components/CustomText';

const Mentors = () => {
  return (
    <View style={styles.container}>
      <CustomText style={styles.text}>Mentors page is being worked on!</CustomText>
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center'
  },
});

export default Mentors;
