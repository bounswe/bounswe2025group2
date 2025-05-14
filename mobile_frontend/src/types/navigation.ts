import { NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Home: undefined;
  Communities: undefined;
  AddNew: undefined;
  Mentors: undefined;
  Chats: undefined;
  Settings: undefined;
  ApiDemo: undefined;
};

export type RootTabScreenProps<T extends keyof RootStackParamList> = BottomTabScreenProps<RootStackParamList, T>; 