import { NavigatorScreenParams } from '@react-navigation/native';
// import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Forum: undefined;
  Chats: undefined;
  Settings: undefined;
  Notifications: undefined;
  Goals: undefined;
  ForumDetail: { forumId: number };
  ThreadDetail: { threadId: number };
  ChatDetail: { chatId: number };
  AiChatDetail: { chatId: number };
};

// export type RootTabScreenProps<T extends keyof RootStackParamList> = BottomTabScreenProps<RootStackParamList, T>;
