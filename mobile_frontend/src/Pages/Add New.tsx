import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, Modal } from 'react-native';
import CustomText from '@components/CustomText';
import { useThreads } from '../context/ThreadContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';
import Cookies from '@react-native-cookies/cookies';
import { useAuth } from '../context/AuthContext';
import { Picker } from '@react-native-picker/picker';

const AddNew = () => {
  const [content, setContent] = useState('');
  const [forums, setForums] = useState([]);
  const [selectedForumId, setSelectedForumId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const { addThread } = useThreads();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { getAuthHeader } = useAuth();
  const [addForumModalVisible, setAddForumModalVisible] = useState(false);
  const [newForumTitle, setNewForumTitle] = useState('');
  const [newForumDescription, setNewForumDescription] = useState('');
  const [newForumOrder, setNewForumOrder] = useState('');
  const [newForumActive, setNewForumActive] = useState(true);

  useEffect(() => {
    fetch('http://10.0.2.2:8000/api/forums/')
      .then(res => res.json())
      .then(data => {
        setForums(data);
        if (data.length > 0) setSelectedForumId(data[0].id);
      });
  }, []);

  const handlePublish = async () => {
    if (!content.trim() || !title.trim() || !selectedForumId) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    const cookies = await Cookies.get('http://10.0.2.2:8000');
    const csrfToken = cookies.csrftoken?.value;
    try {
      const response = await fetch('http://10.0.2.2:8000/api/threads/', {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          forum: selectedForumId,
          title: title.trim(),
          content,
          is_pinned: false,
          is_locked: false,
        }),
      });
      if (response.ok) {
        Alert.alert('Success', 'Your post has been published!');
        setContent('');
        setTitle('');
        navigation.navigate('Home');
      } else {
        const error = await response.text();
        Alert.alert('Error', error);
      }
    } catch (e) {
      Alert.alert('Error', 'Network error while publishing post');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <CustomText style={styles.title}>Create New Post</CustomText>
        
        <View style={styles.inputContainer}>
          <CustomText style={styles.label}>Forum</CustomText>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Picker
              selectedValue={selectedForumId}
              onValueChange={setSelectedForumId}
              style={{ color: colors.text, flex: 1 }}
            >
              {forums.map((forum: any) => (
                <Picker.Item key={forum.id} label={forum.title} value={forum.id} />
              ))}
            </Picker>
            <TouchableOpacity onPress={() => setAddForumModalVisible(true)} style={{ marginLeft: 8, padding: 8 }}>
              <CustomText style={{ fontSize: 24, color: colors.mentionText }}>+</CustomText>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.inputContainer}>
          <CustomText style={styles.label}>Title</CustomText>
          <TextInput
            style={[styles.forumInput, { borderColor: colors.border, color: colors.text }]}
            placeholder="Thread Title"
            placeholderTextColor={colors.subText}
            value={title}
            onChangeText={setTitle}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <CustomText style={styles.label}>What's on your mind?</CustomText>
          <TextInput
            style={[styles.contentInput, { borderColor: colors.border, color: colors.text }]}
            placeholder="Share your thoughts..."
            placeholderTextColor={colors.subText}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.publishButton, { backgroundColor: colors.mentionText }]}
          onPress={handlePublish}
        >
          <CustomText style={styles.publishText}>Publish</CustomText>
        </TouchableOpacity>
      </View>

      {/* Add Forum Modal */}
      <Modal
        visible={addForumModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddForumModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '85%' }}>
            <CustomText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Add New Forum</CustomText>
            <TextInput
              style={[styles.forumInput, { marginBottom: 10 }]}
              placeholder="Forum Title"
              value={newForumTitle}
              onChangeText={setNewForumTitle}
            />
            <TextInput
              style={[styles.forumInput, { marginBottom: 10 }]}
              placeholder="Description"
              value={newForumDescription}
              onChangeText={setNewForumDescription}
            />
            <TextInput
              style={[styles.forumInput, { marginBottom: 10 }]}
              placeholder="Order (number)"
              value={newForumOrder}
              onChangeText={setNewForumOrder}
              keyboardType="numeric"
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <CustomText style={{ marginRight: 8 }}>Active</CustomText>
              <TouchableOpacity onPress={() => setNewForumActive(!newForumActive)} style={{ padding: 6 }}>
                <CustomText style={{ color: newForumActive ? 'green' : 'red' }}>{newForumActive ? 'Yes' : 'No'}</CustomText>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setAddForumModalVisible(false)} style={{ marginRight: 16 }}>
                <CustomText style={{ color: colors.mentionText }}>Cancel</CustomText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (!newForumTitle.trim() || !newForumDescription.trim() || !newForumOrder.trim()) {
                    Alert.alert('Error', 'Please fill in all fields.');
                    return;
                  }
                  const cookies = await Cookies.get('http://10.0.2.2:8000');
                  const csrfToken = cookies.csrftoken?.value;
                  try {
                    const response = await fetch('http://10.0.2.2:8000/api/forums/', {
                      method: 'POST',
                      headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json',
                        ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
                      },
                      credentials: 'include',
                      body: JSON.stringify({
                        title: newForumTitle.trim(),
                        description: newForumDescription.trim(),
                        order: parseInt(newForumOrder, 10),
                        is_active: newForumActive,
                      }),
                    });
                    if (response.ok) {
                      const newForum = await response.json();
                      setForums([...forums, newForum]);
                      setSelectedForumId(newForum.id);
                      setAddForumModalVisible(false);
                      setNewForumTitle('');
                      setNewForumDescription('');
                      setNewForumOrder('');
                      setNewForumActive(true);
                      Alert.alert('Success', 'Forum created!');
                    } else {
                      const error = await response.text();
                      Alert.alert('Error', error);
                    }
                  } catch (e) {
                    Alert.alert('Error', 'Network error while creating forum');
                  }
                }}
              >
                <CustomText style={{ color: colors.mentionText, fontWeight: 'bold' }}>Add</CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  forumInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 150,
  },
  publishButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  publishText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddNew;
