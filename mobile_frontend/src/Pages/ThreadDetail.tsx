import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { 
  ActivityIndicator, 
  Button, 
  Card, 
  Text, 
  TextInput,
  Chip,
  Avatar,
  IconButton,
  useTheme
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';
import Cookies from '@react-native-cookies/cookies';
import { API_URL } from '@constants/api';

const DEFAULT_PROFILE_PIC = require('../assets/temp_images/profile.png');


type ThreadParam = { threadId: number };

type Comment = {
  id: number;
  author_id: number;
  author_username: string;
  author_profile_photo?: string;
  content: string;
  created_at: string;
  like_count: number;
  subcomment_count: number;
};

type ThreadDetailData = {
  id: number;
  title: string;
  content: string;
  author: string;
  author_profile_photo?: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  user_has_liked?: boolean;
  comments: Comment[];
};

const ThreadDetail = () => {
  const theme = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { threadId } = route.params as ThreadParam;
  const { getAuthHeader } = useAuth();
  const [thread, setThread] = useState<ThreadDetailData | null>(null);
  const [likes, setLikes] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [voteStatus, setVoteStatus] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    fetchThreadDetail();
    fetchComments();
    fetchVoteStatus();
  }, []);

  // Refetch data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchThreadDetail();
      fetchVoteStatus();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchVoteStatus = async () => {
    try {
      const res = await fetch(`${API_URL}forum/vote/thread/${threadId}/status/`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader(),
        },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setVoteStatus(data.vote_type);
        setIsLiked(data.vote_type === 'UPVOTE');
      } else {
        // No vote exists
        setVoteStatus(null);
        setIsLiked(false);
      }
    } catch (e) {
      console.error('Failed to load vote status', e);
    }
  };

  const fetchThreadDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}threads/${threadId}/`, {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader() 
        },
        credentials: 'include',
      });
        if (!res.ok) throw new Error('Failed to load thread');
  const data: ThreadDetailData = await res.json();
  setThread(data);
  setLikes(data.like_count);
  setIsLiked(data.user_has_liked || false);
        return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading thread');
    } finally {
      setLoading(false);
    }
  };
  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_URL}comments/thread/${threadId}/`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader(),
        },
        credentials: 'include',
      });
      if (res.ok) {
        const data: Comment[] = await res.json();
        console.log('Fetched comments:', JSON.stringify(data, null, 2));
        setComments(data);
      } else {
        console.error('Failed to fetch comments, status:', res.status);
      }
    } catch (e) {
      console.error('Failed to load comments', e);
    }
  };
  // Toggle like on thread - matches web implementation
  const toggleLike = async () => {
    try {
      // Get CSRF token from cookies
      const cookies = await Cookies.get(API_URL);
      const csrf = cookies.csrftoken?.value;
      const origin = API_URL.replace(/\/api\/?$/, '');
      
      const hasUpvoted = voteStatus === 'UPVOTE';
      
      if (hasUpvoted) {
        // Remove vote if clicking upvote when already upvoted
        console.log('Removing upvote for thread:', threadId);
        const res = await fetch(`${API_URL}forum/vote/thread/${threadId}/`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Referer': origin,
            ...(csrf ? { 'X-CSRFToken': csrf } : {}),
            ...getAuthHeader(),
          },
          credentials: 'include',
        });
        
        if (!res.ok) {
          throw new Error(`Failed to remove vote (${res.status})`);
        }
        
        setVoteStatus(null);
        setIsLiked(false);
      } else {
        // Add or change vote to upvote
        console.log('Adding upvote for thread:', threadId);
        const res = await fetch(`${API_URL}forum/vote/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Referer': origin,
            ...(csrf ? { 'X-CSRFToken': csrf } : {}),
            ...getAuthHeader(),
          },
          credentials: 'include',
          body: JSON.stringify({
            content_type: 'THREAD',
            object_id: threadId,
            vote_type: 'UPVOTE',
          }),
        });
        
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.detail || json.error || `Failed to vote (${res.status})`);
        }
        
        setVoteStatus('UPVOTE');
        setIsLiked(true);
      }
      
      // Refresh thread data and vote status
      await fetchThreadDetail();
      await fetchVoteStatus();
    } catch (e) {
      console.error('Like toggle error:', e);
      Toast.show({ type: 'error', text1: 'Error', text2: e instanceof Error ? e.message : 'Could not update like' });
    }
  };
  // Submit a new comment
  const submitComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      // Get CSRF token from cookies
      const cookies = await Cookies.get(API_URL);
      const csrf = cookies.csrftoken?.value;
      const origin = API_URL.replace(/\/api\/?$/, '');
      // Use add comment endpoint
      const res = await fetch(`${API_URL}comments/add/${threadId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Referer': origin,
          ...(csrf ? { 'X-CSRFToken': csrf } : {}),
          ...getAuthHeader(),
        },
        credentials: 'include',
        body: JSON.stringify({ content: newComment.trim() }),
      });
        let json: any = {};
        try { json = await res.json(); } catch { json = {}; }
        if (!res.ok) {
          const msg = (json && (json.detail || json.error)) || 'Failed to post comment';
          throw new Error(msg);
        }
        setNewComment('');
        await fetchThreadDetail();
        await fetchComments();
        Toast.show({ type: 'success', text1: 'Comment posted' });
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not post comment' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: theme.colors.background }]}> 
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  if (error || !thread) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: theme.colors.background }]}> 
        <Text variant="bodyLarge">{error || 'Thread not found.'}</Text>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      {/* Title with badges */}
      <View style={styles.titleSection}>
        <Text variant="headlineMedium" style={styles.title}>{thread.title}</Text>
        <View style={styles.badgesContainer}>
          {thread.is_pinned && (
            <Chip icon="pin" compact>PINNED</Chip>
          )}
          {thread.is_locked && (
            <Chip icon="lock" compact>LOCKED</Chip>
          )}
        </View>
      </View>
      
      {/* Thread metadata card */}
      <Card mode="outlined" style={styles.metadataCard}>
        <Card.Content>
          <TouchableOpacity 
            style={styles.metadataRow}
            onPress={() => navigation.navigate('Profile', { username: thread.author })}
          >
            <Avatar.Image 
              size={32}
              source={thread.author_profile_photo ? { uri: thread.author_profile_photo } : DEFAULT_PROFILE_PIC} 
            />
            <Text variant="bodyMedium" style={[styles.clickableUsername, { color: theme.colors.primary }]}
              >
              @{thread.author}
            </Text>
          </TouchableOpacity>
          <View style={styles.metadataRow}>
            <Text variant="bodyMedium">📅 {formatDate(thread.created_at)}</Text>
          </View>
          <View style={styles.metadataRow}>
            <Text variant="bodyMedium">💬 {thread.comment_count} comment{thread.comment_count !== 1 ? 's' : ''}</Text>
          </View>
        </Card.Content>
      </Card>

      <Text variant="bodyLarge" style={styles.body}>{thread.content}</Text>
      
      <View style={styles.likeSection}>
        <Button
          mode={isLiked ? "contained" : "outlined"}
          icon="thumb-up"
          onPress={toggleLike}
          style={styles.likeButton}
        >
          {likes}
        </Button>
      </View>

      <Text variant="titleLarge" style={styles.sectionHeading}>Comments</Text>
      
      <View style={styles.commentInputSection}>
        <TextInput
          mode="outlined"
          placeholder="Write a comment..."
          value={newComment}
          onChangeText={setNewComment}
          multiline
          style={styles.commentInput}
        />
        <Button 
          mode="contained"
          onPress={submitComment} 
          disabled={isSubmitting || !newComment.trim()}
          loading={isSubmitting}
          style={styles.commentButton}
        >
          Post
        </Button>
      </View>

      {comments.map(comment => (
        <Card key={comment.id} mode="outlined" style={styles.commentCard}>
          <Card.Content>
            <TouchableOpacity 
              style={styles.commentHeader}
              onPress={() => navigation.navigate('Profile', { username: comment.author_username })}
            >
              <Avatar.Image 
                size={28}
                source={comment.author_profile_photo ? { uri: comment.author_profile_photo } : DEFAULT_PROFILE_PIC} 
              />
              <Text variant="bodyMedium" style={[styles.clickableUsername, { color: theme.colors.primary }]}
                >
                @{comment.author_username}
              </Text>
            </TouchableOpacity>
            <Text variant="bodyMedium" style={styles.commentContent}>{comment.content}</Text>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { justifyContent: 'center', alignItems: 'center' },
  titleSection: { marginBottom: 16 },
  title: { fontWeight: 'bold', marginBottom: 8 },
  badgesContainer: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metadataCard: { marginBottom: 16 },
  metadataRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  clickableUsername: { textDecorationLine: 'underline', fontWeight: '600' },
  body: { marginBottom: 16, lineHeight: 24 },
  sectionHeading: { fontWeight: '600', marginVertical: 12 },
  commentCard: { marginBottom: 12 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  commentContent: { lineHeight: 20 },
  likeSection: { flexDirection: 'row', marginBottom: 16 },
  likeButton: { marginRight: 8 },
  commentInputSection: { flexDirection: 'row', marginBottom: 16, gap: 8, alignItems: 'flex-start' },
  commentInput: { flex: 1 },
  commentButton: {},
});

export default ThreadDetail;
