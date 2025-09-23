import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';
import Cookies from '@react-native-cookies/cookies';
import { useTheme } from '../context/ThemeContext';

const EditProfile = () => {
  const navigation = useNavigation();
  const { getAuthHeader } = useAuth();
  const { colors, isDark } = useTheme();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://10.0.2.2:8000/api/profile/', {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setName(data.name || '');
        setSurname(data.surname || '');
        setBio(data.bio || '');
        setLocation(data.location || '');
        setBirthDate(data.birth_date || '');
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load profile.' });
    } finally {
      setLoading(false);
    }
  };

  const getCSRFToken = async () => {
    const cookies = await Cookies.get('http://10.0.2.2:8000');
    return cookies.csrftoken?.value;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const csrfToken = await getCSRFToken();
      if (!csrfToken) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'CSRF token not found. Please try logging in again.' });
        setLoading(false);
        return;
      }
      const response = await fetch('http://10.0.2.2:8000/api/profile/', {
        method: 'PUT',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          name,
          surname,
          bio,
          location,
          birth_date: birthDate,
        }),
      });
      if (response.ok) {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Profile updated successfully!' });
        navigation.goBack();
      } else {
        const data = await response.json();
        Toast.show({ type: 'error', text1: 'Error', text2: data.message || 'Failed to update profile.' });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Network error.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: isDark ? colors.mentionText : colors.text }]}>Edit Profile</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.navBar, color: colors.text }]}
        placeholder="Name"
        placeholderTextColor={colors.subText}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.navBar, color: colors.text }]}
        placeholder="Surname"
        placeholderTextColor={colors.subText}
        value={surname}
        onChangeText={setSurname}
      />
      <TextInput
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.navBar, color: colors.text }]}
        placeholder="Bio"
        placeholderTextColor={colors.subText}
        value={bio}
        onChangeText={setBio}
        multiline
      />
      <TextInput
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.navBar, color: colors.text }]}
        placeholder="Location"
        placeholderTextColor={colors.subText}
        value={location}
        onChangeText={setLocation}
      />
      <TextInput
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.navBar, color: colors.text }]}
        placeholder="Birth Date (YYYY-MM-DD)"
        placeholderTextColor={colors.subText}
        value={birthDate}
        onChangeText={setBirthDate}
      />
      <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.mentionText }]} onPress={handleSave} disabled={loading}>
        <Text style={[styles.saveButtonText, { color: colors.navBar }]}>{loading ? 'Saving...' : 'Save'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#800000',
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f7f7f7',
  },
  saveButton: {
    backgroundColor: '#800000',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProfile; 