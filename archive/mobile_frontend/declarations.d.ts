declare module '@react-navigation/native';
declare module '@react-navigation/stack';
declare module '@react-navigation/bottom-tabs';
declare module 'react-native-safe-area-context';
declare module '@react-native-async-storage/async-storage';
declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
} 