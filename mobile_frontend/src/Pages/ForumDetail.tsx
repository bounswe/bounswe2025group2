import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { 
  ActivityIndicator, 
  Button, 
  Card, 
  Text, 
  useTheme,
  Portal,
  Dialog,
  TextInput,
  FAB,
  Chip,
  Snackbar,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../constants/api';
import Cookies from '@react-native-cookies/cookies';

type Thread = {
  id: number;
  title: string;
  author: string;
  comment_count: number;
  last_activity: string;
};

const ForumDetail = () => {
  const theme = useTheme();
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
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

  const showSnackbar = (message: string, type: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

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

      showSnackbar('Thread created successfully!', 'success');

      setIsModalVisible(false);
      setNewThreadTitle('');
      setNewThreadContent('');
      setTitleError('');
      setContentError('');
      await fetchThreads();
    } catch (err) {
      console.error('Create thread error:', err);
      showSnackbar(err instanceof Error ? err.message : 'Failed to create thread', 'error');
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
      <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}> 
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}> 
        <Text variant="bodyLarge" style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchThreads} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={styles.container}> 
        <Text variant="headlineMedium" style={styles.heading}>Threads</Text>
        {threads.map(thread => (
          <Card
            key={thread.id}
            mode="elevated"
            style={styles.threadCard}
            onPress={() => navigation.navigate('ThreadDetail', { threadId: thread.id })}
          >
            <Card.Content>
              <Text variant="titleMedium" style={styles.threadTitle}>{thread.title}</Text>
              <View style={styles.threadMetaContainer}>
                <Text variant="bodySmall">By </Text>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate('Profile', { username: thread.author });
                  }}
                >
                  <Text variant="bodySmall" style={[styles.threadAuthor, { color: theme.colors.primary }]}
                    >
                    {thread.author}
                  </Text>
                </TouchableOpacity>
                <Text variant="bodySmall"> • {thread.comment_count} comments • {new Date(thread.last_activity).toLocaleDateString()}</Text>
              </View>
            </Card.Content>
          </Card>
        ))}
        {threads.length === 0 && (
          <View style={styles.center}>
            <Text variant="bodyLarge" style={styles.emptyText}>No threads found.</Text>
            <Button 
              mode="contained"
              onPress={() => setIsModalVisible(true)}
              style={styles.createButton}
            >
              Create First Thread
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {threads.length > 0 && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setIsModalVisible(true)}
        />
      )}

      {/* Create Thread Dialog */}
      <Portal>
        <Dialog visible={isModalVisible} onDismiss={closeModal}>
          <Dialog.Title>Create New Thread</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={styles.dialogContent}>
              <TextInput
                label="Thread Title"
                value={newThreadTitle}
                onChangeText={setNewThreadTitle}
                mode="outlined"
                error={!!titleError}
                maxLength={200}
                disabled={isSubmitting}
                style={styles.input}
              />
              {titleError ? (
                <Text variant="bodySmall" style={styles.errorTextSmall}>{titleError}</Text>
              ) : null}
              <Text variant="bodySmall" style={styles.charCount}>
                {newThreadTitle.length}/200 characters
              </Text>

              <TextInput
                label="Thread Content"
                value={newThreadContent}
                onChangeText={setNewThreadContent}
                mode="outlined"
                error={!!contentError}
                maxLength={5000}
                multiline
                numberOfLines={6}
                disabled={isSubmitting}
                style={styles.textarea}
              />
              {contentError ? (
                <Text variant="bodySmall" style={styles.errorTextSmall}>{contentError}</Text>
              ) : null}
              <Text variant="bodySmall" style={styles.charCount}>
                {newThreadContent.length}/5000 characters
              </Text>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={closeModal} disabled={isSubmitting}>Cancel</Button>
            <Button 
              mode="contained"
              onPress={handleCreateThread}
              disabled={isSubmitting || !newThreadTitle.trim() || !newThreadContent.trim()}
              loading={isSubmitting}
            >
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>
        
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'OK',
            onPress: () => setSnackbarVisible(false),
          }}
          style={snackbarType === 'error' ? { backgroundColor: theme.colors.error } : undefined}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', flex: 1, padding: 24 },
  heading: { fontWeight: 'bold', margin: 16 },
  threadCard: { marginHorizontal: 16, marginBottom: 12 },
  threadTitle: { fontWeight: '600', marginBottom: 8 },
  threadMetaContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  threadAuthor: { 
    fontWeight: '600',
  },
  errorText: { marginBottom: 16, textAlign: 'center' },
  emptyText: { marginBottom: 16, textAlign: 'center' },
  retryButton: { marginTop: 8 },
  createButton: { marginTop: 8 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  dialogContent: { paddingHorizontal: 24, paddingVertical: 8 },
  input: { marginBottom: 4 },
  textarea: { marginBottom: 4, minHeight: 120 },
  errorTextSmall: { color: '#ff4444', marginBottom: 4 },
  charCount: { marginBottom: 16, opacity: 0.6, textAlign: 'right' },
});

export default ForumDetail;
