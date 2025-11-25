import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, Surface, Text, useTheme } from 'react-native-paper';
import Toast, { BaseToast, ErrorToast, ToastConfigParams } from 'react-native-toast-message';
import { View } from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ThreadProvider } from './src/context/ThreadContext';
import { ChatProvider } from './src/context/ChatContext';
import { AiChatProvider } from './src/context/AiChatContext';
import { appTheme } from './src/theme/theme';

const queryClient = new QueryClient();

// Custom Toast Components
const CustomSuccessToast = ({ text1, text2 }: ToastConfigParams<any>) => {
  const theme = useTheme();
  return (
    <Surface 
      style={{ 
        padding: 16, 
        margin: 16, 
        borderRadius: 12,
        minWidth: 300,
        backgroundColor: theme.colors.primaryContainer,
      }} 
      elevation={3}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text variant="titleSmall" style={{ fontSize: 20 }}>✓</Text>
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '600' }}>
            {text1}
          </Text>
          {text2 && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer, marginTop: 4 }}>
              {text2}
            </Text>
          )}
        </View>
      </View>
    </Surface>
  );
};

const CustomErrorToast = ({ text1, text2 }: ToastConfigParams<any>) => {
  const theme = useTheme();
  return (
    <Surface 
      style={{ 
        padding: 16, 
        margin: 16, 
        borderRadius: 12,
        minWidth: 300,
        backgroundColor: theme.colors.errorContainer,
      }} 
      elevation={3}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text variant="titleSmall" style={{ fontSize: 20 }}>✕</Text>
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={{ color: theme.colors.onErrorContainer, fontWeight: '600' }}>
            {text1}
          </Text>
          {text2 && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onErrorContainer, marginTop: 4 }}>
              {text2}
            </Text>
          )}
        </View>
      </View>
    </Surface>
  );
};

const CustomInfoToast = ({ text1, text2 }: ToastConfigParams<any>) => {
  const theme = useTheme();
  return (
    <Surface 
      style={{ 
        padding: 16, 
        margin: 16, 
        borderRadius: 12,
        minWidth: 300,
        backgroundColor: theme.colors.secondaryContainer,
      }} 
      elevation={3}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text variant="titleSmall" style={{ fontSize: 20 }}>ℹ</Text>
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSecondaryContainer, fontWeight: '600' }}>
            {text1}
          </Text>
          {text2 && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer, marginTop: 4 }}>
              {text2}
            </Text>
          )}
        </View>
      </View>
    </Surface>
  );
};

const toastConfig = {
  success: (props: any) => <CustomSuccessToast {...props} />,
  error: (props: any) => <CustomErrorToast {...props} />,
  info: (props: any) => <CustomInfoToast {...props} />,
};

const App = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={appTheme}>
            <ThreadProvider>
              <ChatProvider>
                <AiChatProvider>
                  <NavigationContainer>
                    <AppNavigator />
                  </NavigationContainer>
                  <Toast config={toastConfig} />
                </AiChatProvider>
              </ChatProvider>
            </ThreadProvider>
          </PaperProvider>
        </QueryClientProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;