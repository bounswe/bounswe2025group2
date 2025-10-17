import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ThreadProvider } from './src/context/ThreadContext';
import { ChatProvider } from './src/context/ChatContext';
import { appTheme } from './src/theme/theme'; // <-- Import your custom theme

const queryClient = new QueryClient();

const App = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          {/* Pass your custom theme to the PaperProvider */}
          <PaperProvider theme={appTheme}>
            <ThreadProvider>
              <ChatProvider>
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
                <Toast />
              </ChatProvider>
            </ThreadProvider>
          </PaperProvider>
        </QueryClientProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;