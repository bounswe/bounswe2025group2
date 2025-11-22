import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Cookies from '@react-native-cookies/cookies';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '@constants/api';

const Login = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { colors, isDark } = useTheme();
  const { setCurrentUser } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all fields',
      });
      return;
    }

    try {
      const loginUrl = `${API_URL}login/`;
      console.log('Login URL:', loginUrl);
      
      // First, get CSRF token by making a GET request to quotes endpoint
      const quotesUrl = `${API_URL}quotes/random/`;
      console.log('Quotes URL:', quotesUrl);
      
      // Extract the origin (base URL) for Referer header
      const origin = API_URL.replace(/\/api\/?$/, '');
      
      const quotesResponse = await fetch(quotesUrl, { 
        method: 'GET',
        headers: {
          'Referer': origin,
        },
        credentials: 'include',
      });
      
      if (!quotesResponse.ok) {
        console.warn('Quotes endpoint returned:', quotesResponse.status, quotesResponse.statusText);
      }
      
      // Get the CSRF token from cookies
      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies?.csrftoken?.value;
      console.log('CSRF token retrieved:', csrfToken ? 'Yes' : 'No');

      // Now make the login request with the CSRF token and Referer header
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Referer': origin,
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          username: username,
          password: password,
          remember_me: true,
        }),
      });
      
      console.log('Login response status:', response.status, response.statusText);

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If response is not JSON, get text for debugging
        const text = await response.text();
        console.error('Non-JSON response from:', loginUrl);
        console.error('Response status:', response.status, response.statusText);
        console.error('Response text:', text.substring(0, 500)); // First 500 chars
        throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}. URL: ${loginUrl}`);
      }
      
      console.log('Login response:', data);

      if (response.ok) {
        // Set current user information
        setCurrentUser({
          id: data.user_id || 0,
          username: username,
          email: data.email
        });
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: data.message || 'Login successful',
        });
        navigation.replace('Main');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data.error || 'Login failed',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage.includes('503') ? 'Server unavailable. Please try again later.' : errorMessage,
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Login</Text>
        
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            backgroundColor: colors.navBar,
            color: colors.text
          }]}
          placeholder="Username"
          placeholderTextColor={colors.subText}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            backgroundColor: colors.navBar,
            color: colors.text
          }]}
          placeholder="Password"
          placeholderTextColor={colors.subText}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={[styles.button, { 
            backgroundColor: isDark ? colors.background : '#f0f0f0',
            borderWidth: 1,
            borderColor: isDark ? '#e18d58' : '#800000'
          }]} 
          onPress={handleLogin}
        >
          <Text style={[styles.buttonText, { 
            color: isDark ? '#ffffff' : '#800000'
          }]}>Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={[styles.registerText, { 
            color: isDark ? '#e18d58' : '#800000'
          }]}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Login; 