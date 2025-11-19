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

const Login = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { colors, isDark } = useTheme();
  const { setCurrentUser, setToken } = useAuth();

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
      // First, get CSRF token by making a GET request to quotes endpoint
      await fetch('http://164.90.166.81:8000/api/quotes/random/', { 
        method: 'GET',
        credentials: 'include',
      });
      
      // Get the CSRF token from cookies
      const cookies = await Cookies.get('http://164.90.166.81:8000');
      const csrfToken = cookies.csrftoken?.value;

      // Now make the login request with the CSRF token
      const response = await fetch('http://164.90.166.81:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          username: username,
          password: password,
          remember_me: true,
        }),
      });
      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok) {
        // Store the auth token (backend may return token or we use session)
        if (data.token) {
          await setToken(data.token);
        } else {
          // For session-based auth, generate a token from user data
          await setToken(`sessiontoken_${data.user_id}_${Date.now()}`);
        }

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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Network error occurred',
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