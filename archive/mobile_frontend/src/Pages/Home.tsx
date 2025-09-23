import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import Thread from '../components/Thread';
import { useThreads } from '../context/ThreadContext';
import { useTheme } from '../context/ThemeContext';
import Cookies from '@react-native-cookies/cookies';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const Home = () => {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const { getAuthHeader } = useAuth();

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const cookies = await Cookies.get('http://10.0.2.2:8000');
      const csrfToken = cookies.csrftoken?.value;
      const response = await fetch('http://10.0.2.2:8000/api/threads/', {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setThreads(data);
      } else {
        setThreads([]);
      }
    } catch (e) {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchThreads();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchThreads();
    setRefreshing(false);
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={[colors.mentionText]}
          tintColor={colors.mentionText}
        />
      }
    >
      <View style={styles.content}>
        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Thread
              key="loading"
              forumName=""
              content="Loading threads..."
              profilePic={require('../assets/temp_images/profile.png')}
              username=""
              threadId={-1}
              likeCount={0}
              commentCount={0}
            />
          </View>
        ) : threads.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Thread
              key="empty"
              forumName=""
              content="No threads found. Be the first to post!"
              profilePic={require('../assets/temp_images/profile.png')}
              username=""
              threadId={-1}
              likeCount={0}
              commentCount={0}
            />
          </View>
        ) : (
          threads.map((thread, idx) => (
            <Thread
              key={thread.id || idx}
              forumName={thread.forum?.title || thread.forum || 'Forum'}
              content={`${thread.title ? thread.title + '\n' : ''}${thread.content || ''}`}
              profilePic={thread.profilePic || require('../assets/temp_images/profile.png')}
              username={thread.author?.username || thread.author || thread.username || 'User'}
              threadId={thread.id}
              likeCount={thread.like_count || 0}
              commentCount={thread.comment_count || 0}
            />
          ))
        )}
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
});

export default Home;
