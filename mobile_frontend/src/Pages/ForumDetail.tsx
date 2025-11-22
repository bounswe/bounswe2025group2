import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import CustomText from '@components/CustomText';
import { API_URL } from '../constants/api';

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
          ...getAuthHeader(),
        },
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
          <CustomText style={{ color: colors.text }}>No threads found.</CustomText>
        </View>
      )}
    </ScrollView>
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
});

export default ForumDetail;
