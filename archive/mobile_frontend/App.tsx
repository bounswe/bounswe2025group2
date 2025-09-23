import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { ThreadProvider } from './src/context/ThreadContext';
import { ChatProvider } from './src/context/ChatContext';
import Toast from 'react-native-toast-message';

const App = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <ThreadProvider>
            <ChatProvider>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
              <Toast />
            </ChatProvider>
          </ThreadProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
