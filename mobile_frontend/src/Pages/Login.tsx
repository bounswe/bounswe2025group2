import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Cookies from '@react-native-cookies/cookies';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const Login = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { colors, isDark } = useTheme();
  const { setCurrentUser } = useAuth();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all fields',
      });
      return;
    }

    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const gradientColors = isDark 
    ? ['#1a0000', '#330000', '#4d0000']
    : ['#f5e6d3', '#e8d4b8', '#d4a574'];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View 
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {/* Logo Section */}
              <View style={styles.logoSection}>
                <View style={styles.logoCircle}>
                  <Text style={styles.logoIcon}>GF</Text>
                </View>
                <Text style={styles.appName}>GenFit</Text>
                <Text style={styles.tagline}>Transform Your Fitness Journey</Text>
              </View>

              {/* Card Container */}
              <View style={styles.card}>
                <Text style={styles.title}>Welcome Back!</Text>
                <Text style={styles.subtitle}>Continue your fitness journey</Text>
                
                {/* Username Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Username</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your username"
                      placeholderTextColor="#9ca3af"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                  </View>
                </View>
                
                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Enter your password"
                      placeholderTextColor="#9ca3af"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      editable={!isLoading}
                    />
                    <TouchableOpacity 
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={styles.eyeIcon}>{showPassword ? '○' : '●'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Login Button */}
                <TouchableOpacity 
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isDark ? ['#800000', '#600000'] : ['#d4a574', '#c49563']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? 'Loading...' : 'Login'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                {/* Register Link */}
                <TouchableOpacity 
                  style={styles.registerButton}
                  onPress={() => navigation.navigate('Register')}
                  disabled={isLoading}
                >
                  <Text style={styles.registerText}>
                    Don't have an account? <Text style={styles.registerTextBold}>Register</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 40,
    fontWeight: '800',
    color: '#800000',
  },
  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '300',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    color: '#800000',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#800000',
    marginBottom: 8,
  },
  labelIcon: {
    fontSize: 16,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    height: 50,
    borderWidth: 2,
    borderColor: '#d4a574',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#1f2937',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  eyeIcon: {
    fontSize: 20,
  },
  button: {
    height: 54,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  registerButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 8,
  },
  registerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  registerTextBold: {
    fontWeight: '700',
    color: '#800000',
  },
});

export default Login; 