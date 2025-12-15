import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Cookies from '@react-native-cookies/cookies';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '@constants/api';
import TermsModal from '../components/TermsModal';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';

const Register = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('User');
  const [verificationFile, setVerificationFile] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const { colors, isDark } = useTheme();

  const handlePickFile = () => {
    // Just set a dummy string for demonstration
    setVerificationFile('dummy-file.pdf');
  };

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all fields',
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Passwords do not match',
      });
      return;
    }

    if (userType === 'Coach' && !verificationFile) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please upload a verification file for Coach registration.',
      });
      return;
    }

    try {
      await fetch(`${API_URL}quotes/random/`, { 
        method: 'GET',
        credentials: 'include',
      });

      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies.csrftoken?.value;
      
      const response = await fetch(`${API_URL}register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
          user_type: userType,
          verification_file: verificationFile,
          remember_me: rememberMe,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: data.message || 'Registration successful!',
        });
        setTimeout(() => navigation.navigate('Login'), 1500);
      } else {
        // Show first error message from API
        const errorMsg = data.username?.[0] || data.email?.[0] || data.password?.[0] || data.error || 'Registration failed';
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMsg,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Network error. Please try again.',
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Register</Text>
        
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
          placeholder="Email"
          placeholderTextColor={colors.subText}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
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
        
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            backgroundColor: colors.navBar,
            color: colors.text
          }]}
          placeholder="Confirm Password"
          placeholderTextColor={colors.subText}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        
        <View style={[styles.pickerContainer, { 
          borderColor: colors.border,
          backgroundColor: colors.navBar,
        }]}>
          <Picker
            selectedValue={userType}
            style={[styles.picker, { color: colors.text }]}
            dropdownIconColor={colors.text}
            onValueChange={(itemValue: string) => setUserType(itemValue)}
          >
            <Picker.Item label="User" value="User" color={isDark ? '#ffffff' : '#000000'} />
            <Picker.Item label="Coach" value="Coach" color={isDark ? '#ffffff' : '#000000'} />
          </Picker>
        </View>
        
        {userType === 'Coach' && (
          <TouchableOpacity 
            style={[styles.button, { 
              backgroundColor: isDark ? colors.background : '#f0f0f0',
              borderWidth: 1,
              borderColor: isDark ? '#e18d58' : '#800000'
            }]} 
            onPress={handlePickFile}
          >
            <Text style={[styles.buttonText, { color: isDark ? '#ffffff' : '#800000' }]}>
              {verificationFile ? 'File Selected' : 'Upload Verification File'}
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
          <TouchableOpacity 
            onPress={() => setRememberMe(!rememberMe)} 
            style={{ 
              marginRight: 8, 
              width: 24, 
              height: 24, 
              borderWidth: 1, 
              borderColor: isDark ? '#e18d58' : '#800000', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: rememberMe ? (isDark ? '#e18d58' : '#800000') : colors.navBar 
            }}
          >
            {rememberMe && <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>}
          </TouchableOpacity>
          <Text style={{ color: colors.text }}>Remember Me</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.button, { 
            backgroundColor: isDark ? colors.background : '#f0f0f0',
            borderWidth: 1,
            borderColor: isDark ? '#e18d58' : '#800000'
          }]} 
          onPress={handleRegister}
        >
          <Text style={[styles.buttonText, { color: isDark ? '#ffffff' : '#800000' }]}>Register</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.loginText, { 
            color: isDark ? '#e18d58' : '#800000',
            fontWeight: 'bold'
          }]}>Already have an account? Login</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.termsContainer}
          onPress={() => {}}
        >
          <Text style={[styles.termsText, { color: colors.subText }]}>
            By signing up and signing in, you acknowledge that you have read,
            understood, and agree to be bound by the <Text onPress={() => setShowTermsModal(true)} style={{textDecorationLine: 'underline', color: colors.primary || (isDark ? '#e18d58' : '#800000')}}>Terms and Conditions</Text> and <Text onPress={() => setShowPrivacyModal(true)} style={{textDecorationLine: 'underline', color: colors.primary || (isDark ? '#e18d58' : '#800000')}}>Privacy Policy</Text>.
          </Text>
        </TouchableOpacity>

        <TermsModal 
          visible={showTermsModal} 
          onClose={() => setShowTermsModal(false)} 
        />
        <PrivacyPolicyModal 
          visible={showPrivacyModal} 
          onClose={() => setShowPrivacyModal(false)} 
        />
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
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
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
  loginButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
  },
  termsContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default Register; 