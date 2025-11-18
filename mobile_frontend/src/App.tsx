import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PaperProvider } from 'react-native-paper';
import { appTheme } from './theme/theme';
import { queryClient } from './lib/queryClient';
import AppNavigator from './navigation/AppNavigator';
import { ChatProvider } from './context/ChatContext';
import { AiChatProvider } from './context/AiChatContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChatProvider>
          <AiChatProvider>
            <ThemeProvider> {/* Keep old ThemeContext for backward compatibility */}
              <PaperProvider theme={appTheme}> {/* Add React Native Paper theme */}
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
              </PaperProvider>
            </ThemeProvider>
          </AiChatProvider>
        </ChatProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;