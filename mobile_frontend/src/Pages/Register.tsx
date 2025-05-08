import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const Register = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('User');
  const [verificationFile, setVerificationFile] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handlePickFile = () => {
    // Just set a dummy string for demonstration
    setVerificationFile('dummy-file.pdf');
  };

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (userType === 'Coach' && !verificationFile) {
      Alert.alert('Error', 'Please upload a verification file for Coach registration.');
      return;
    }

    try {
      const response = await fetch('http://10.0.2.2:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        Alert.alert(
          'Success',
          data.message || 'Registration successful! Please check your email to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        // Show first error message from API
        const errorMsg = data.username?.[0] || data.email?.[0] || data.password?.[0] || data.error || 'Registration failed';
        Alert.alert('Error', errorMsg);
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Register</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        
        <Picker
          selectedValue={userType}
          style={{ height: 50, width: '100%', marginBottom: 15 }}
          onValueChange={(itemValue: string) => setUserType(itemValue)}
        >
          <Picker.Item label="User" value="User" />
          <Picker.Item label="Coach" value="Coach" />
        </Picker>
        
        {userType === 'Coach' && (
          <TouchableOpacity style={styles.button} onPress={handlePickFile}>
            <Text style={styles.buttonText}>{verificationFile ? 'File Selected' : 'Upload Verification File'}</Text>
          </TouchableOpacity>
        )}
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
          <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} style={{ marginRight: 8, width: 24, height: 24, borderWidth: 1, borderColor: '#007AFF', alignItems: 'center', justifyContent: 'center', backgroundColor: rememberMe ? '#007AFF' : '#fff' }}>
            {rememberMe && <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>}
          </TouchableOpacity>
          <Text>Remember Me</Text>
        </View>
        
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    color: '#007AFF',
    fontSize: 16,
  },
});

export default Register; 