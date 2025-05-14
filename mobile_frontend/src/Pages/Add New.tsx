import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import CustomText from '@components/CustomText';
import { useThreads } from '../context/ThreadContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';

const AddNew = () => {
  const [content, setContent] = useState('');
  const [forumName, setForumName] = useState('GeneralDiscussion');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const { addThread } = useThreads();
  const { colors } = useTheme();
  const navigation = useNavigation();

  const handlePickImage = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to pick image');
      } else if (response.assets && response.assets.length > 0) {
        const selectedAsset = response.assets[0];
        if (selectedAsset.uri) {
          setImageUri(selectedAsset.uri);
        }
      }
    });
  };

  const handleRemoveImage = () => {
    setImageUri(null);
  };

  const handlePublish = () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your post.');
      return;
    }

    // Add the new thread
    addThread({
      forumName,
      content,
      username: 'John Doe', // Default username
      profilePic: require('../assets/temp_images/profile.png'),
      // Use the selected image if available
      ...(imageUri && { imageUrl: { uri: imageUri } }),
    });

    // Reset form and navigate to home
    setContent('');
    setImageUri(null);
    Alert.alert('Success', 'Your post has been published!');
    // @ts-ignore - Ignoring type checking for navigation
    navigation.navigate('Home');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <CustomText style={styles.title}>Create New Post</CustomText>
        
        <View style={styles.inputContainer}>
          <CustomText style={styles.label}>Forum</CustomText>
          <TextInput
            style={[styles.forumInput, { borderColor: colors.border, color: colors.text }]}
            placeholder="Forum Name"
            placeholderTextColor={colors.subText}
            value={forumName}
            onChangeText={setForumName}
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

        {/* Image Preview Section */}
        {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={handleRemoveImage}
            >
              <CustomText style={styles.removeImageText}>Remove</CustomText>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Image Button */}
        <TouchableOpacity 
          style={[styles.imageButton, { borderColor: colors.border }]}
          onPress={handlePickImage}
        >
          <CustomText style={{ color: colors.text }}>
            {imageUri ? 'Change Image' : 'Add Image From Gallery'} 
          </CustomText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.publishButton, { backgroundColor: colors.mentionText }]}
          onPress={handlePublish}
        >
          <CustomText style={styles.publishText}>Publish</CustomText>
        </TouchableOpacity>
      </View>
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
  imageButton: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  imagePreviewContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeImageText: {
    color: 'white',
    fontSize: 12,
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
