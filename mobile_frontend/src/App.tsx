import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PaperProvider } from 'react-native-paper';
import { appTheme } from './theme/theme';
import { queryClient } from './lib/queryClient';
import MainNavigator from './navigation/MainNavigator';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider> {/* Keep old ThemeContext for backward compatibility */}
          <PaperProvider theme={appTheme}> {/* Add React Native Paper theme */}
            <NavigationContainer>
              <MainNavigator />
            </NavigationContainer>
          </PaperProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;