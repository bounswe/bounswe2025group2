import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import CustomText from '@components/CustomText';
import { API_URL } from '../constants/api';
import Toast from 'react-native-toast-message';
import Cookies from '@react-native-cookies/cookies';

type Thread = {
  id: number;
  title: string;
  author: string;
  comment_count: number;
  last_activity: string;
};

const ForumDetail = () => {
  const { colors } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { getAuthHeader } = useAuth();
  const { forumId } = route.params as { forumId: number };

  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [contentError, setContentError] = useState('');

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}forums/${forumId}/threads/`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader(),
        },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(res.statusText || 'Failed to load threads');
      const data: Thread[] = await res.json();
      setThreads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load threads');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    setTitleError('');
    setContentError('');

    if (!newThreadTitle.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else if (newThreadTitle.trim().length < 3) {
      setTitleError('Title must be at least 3 characters long');
      isValid = false;
    } else if (newThreadTitle.trim().length > 200) {
      setTitleError('Title must be less than 200 characters');
      isValid = false;
    }

    if (!newThreadContent.trim()) {
      setContentError('Content is required');
      isValid = false;
    } else if (newThreadContent.trim().length < 10) {
      setContentError('Content must be at least 10 characters long');
      isValid = false;
    } else if (newThreadContent.trim().length > 5000) {
      setContentError('Content must be less than 5000 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleCreateThread = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const cookies = await Cookies.get(API_URL);
      const csrf = cookies.csrftoken?.value;
      const origin = API_URL.replace(/\/api\/?$/, '');

      const payload = {
        forum: forumId,
        title: newThreadTitle.trim(),
        content: newThreadContent.trim(),
        is_pinned: false,
        is_locked: false,
      };

      console.log('Creating thread with payload:', payload);
      console.log('CSRF token:', csrf ? 'present' : 'missing');

      const res = await fetch(`${API_URL}threads/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Referer': origin,
          ...(csrf ? { 'X-CSRFToken': csrf } : {}),
          ...getAuthHeader(),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      console.log('Response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`Failed to create thread: ${res.status} ${res.statusText}`);
        }
        throw new Error(errorData.detail || errorData.error || JSON.stringify(errorData) || 'Failed to create thread');
      }

      const responseData = await res.json();
      console.log('Thread created successfully:', responseData);

      Toast.show({
        type: 'success',
        text1: 'Thread Created',
        text2: 'Your thread has been posted successfully',
      });

      setIsModalVisible(false);
      setNewThreadTitle('');
      setNewThreadContent('');
      setTitleError('');
      setContentError('');
      await fetchThreads();
    } catch (err) {
      console.error('Create thread error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err instanceof Error ? err.message : 'Failed to create thread',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    if (!isSubmitting) {
      setIsModalVisible(false);
      setNewThreadTitle('');
      setNewThreadContent('');
      setTitleError('');
      setContentError('');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.active} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}> 
        <CustomText style={[styles.error, { color: colors.text }]}>{error}</CustomText>
        <TouchableOpacity onPress={fetchThreads} style={[styles.retryButton, { backgroundColor: colors.active }]}> 
          <CustomText style={[styles.retryText, { color: colors.background }]}>Retry</CustomText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}> 
        <CustomText style={[styles.heading, { color: colors.text }]}>Threads</CustomText>
        {threads.map(thread => (
          <TouchableOpacity
            key={thread.id}
            style={[styles.threadCard, { borderColor: colors.border }]}
            onPress={() => navigation.navigate('ThreadDetail', { threadId: thread.id })}
          >
            <CustomText style={[styles.threadTitle, { color: colors.text }]}>{thread.title}</CustomText>
            <CustomText style={[styles.threadMeta, { color: colors.subText }]}>By {thread.author} • {thread.comment_count} comments • {new Date(thread.last_activity).toLocaleDateString()}</CustomText>
          </TouchableOpacity>
        ))}
        {threads.length === 0 && (
          <View style={styles.center}>
            <CustomText style={{ color: colors.text, marginBottom: 16 }}>No threads found.</CustomText>
            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: colors.active }]}
              onPress={() => setIsModalVisible(true)}
            >
              <CustomText style={{ color: colors.background, fontWeight: '600' }}>Create First Thread</CustomText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {threads.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.active }]}
          onPress={() => setIsModalVisible(true)}
        >
          <CustomText style={[styles.fabText, { color: colors.background }]}>+</CustomText>
        </TouchableOpacity>
      )}

      {/* Create Thread Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            {/* Header with icon and close button */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.modalTitleRow}>
                <CustomText style={[styles.modalTitle, { color: colors.text }]}>Create New Thread</CustomText>
              </View>
              <TouchableOpacity onPress={closeModal} disabled={isSubmitting} style={styles.closeButtonContainer}>
                <CustomText style={[styles.closeButton, { color: colors.text }]}>✕</CustomText>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              {/* Title Field */}
              <View style={styles.formGroup}>
                <CustomText style={[styles.label, { color: colors.text }]}>THREAD TITLE</CustomText>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      borderColor: titleError ? '#ff4444' : colors.border,
                      color: colors.text,
                      backgroundColor: colors.background,
                    }
                  ]}
                  placeholder="Enter a descriptive title for your thread..."
                  placeholderTextColor={colors.subText}
                  value={newThreadTitle}
                  onChangeText={setNewThreadTitle}
                  maxLength={200}
                  editable={!isSubmitting}
                />
                {titleError ? (
                  <CustomText style={styles.errorText}>{titleError}</CustomText>
                ) : null}
                <CustomText style={[styles.charCount, { color: colors.subText }]}>
                  {newThreadTitle.length}/200 characters
                </CustomText>
              </View>

              {/* Content Field */}
              <View style={styles.formGroup}>
                <CustomText style={[styles.label, { color: colors.text }]}>THREAD CONTENT</CustomText>
                <TextInput
                  style={[
                    styles.textarea,
                    { 
                      borderColor: contentError ? '#ff4444' : colors.border,
                      color: colors.text,
                      backgroundColor: colors.background,
                    }
                  ]}
                  placeholder="Share your thoughts, ask questions, or start a discussion..."
                  placeholderTextColor={colors.subText}
                  value={newThreadContent}
                  onChangeText={setNewThreadContent}
                  maxLength={5000}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  editable={!isSubmitting}
                />
                {contentError ? (
                  <CustomText style={styles.errorText}>{contentError}</CustomText>
                ) : null}
                <CustomText style={[styles.charCount, { color: colors.subText }]}>
                  {newThreadContent.length}/5000 characters
                </CustomText>
              </View>
            </View>

            {/* Actions */}
            <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border, backgroundColor: colors.navBar }]}
                onPress={closeModal}
                disabled={isSubmitting}
              >
                <CustomText style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</CustomText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { 
                    backgroundColor: colors.active,
                    opacity: (isSubmitting || !newThreadTitle.trim() || !newThreadContent.trim()) ? 0.5 : 1
                  }
                ]}
                onPress={handleCreateThread}
                disabled={isSubmitting || !newThreadTitle.trim() || !newThreadContent.trim()}
              >
                {isSubmitting ? (
                  <View style={styles.submitContent}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <CustomText style={[styles.submitButtonText, { color: '#FFFFFF' }]}>Creating...</CustomText>
                  </View>
                ) : (
                  <View style={styles.submitContent}>
                    <CustomText style={[styles.submitButtonText, { color: '#FFFFFF' }]}>Create Thread</CustomText>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  heading: { fontSize: 24, fontWeight: 'bold', margin: 16 },
  threadCard: { padding: 16, borderWidth: 1, borderRadius: 10, marginHorizontal: 16, marginBottom: 12 },
  threadTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  threadMeta: { fontSize: 12 },
  error: { fontSize: 16, marginBottom: 12 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryText: { fontSize: 16, fontWeight: '600' },
  createButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 8 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: { fontSize: 32, fontWeight: '300', marginTop: -2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 16,
    padding: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIcon: {
    fontSize: 24,
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  closeButtonContainer: {
    padding: 4,
  },
  closeButton: { fontSize: 28, fontWeight: 'bold' },
  modalContent: { paddingHorizontal: 20, paddingVertical: 20 },
  formGroup: { marginBottom: 24 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  labelIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  input: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  textarea: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    minHeight: 140,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  errorText: { color: '#ff4444', fontSize: 12, marginTop: 4 },
  charCount: { fontSize: 12, marginTop: 4, textAlign: 'right' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { fontSize: 16, fontWeight: '600' },
  submitButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: { fontSize: 16, fontWeight: '700' },
});

export default ForumDetail;
