import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Pressable, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import CustomText from '@components/CustomText';
import Toast from 'react-native-toast-message';
import Cookies from '@react-native-cookies/cookies';
import { API_URL } from '@constants/api';


type ThreadParam = { threadId: number };

type Comment = {
  id: number;
  author: string;
  content: string;
  created: string;
};

type ThreadDetailData = {
  id: number;
  title: string;
  body: string;
  author: string;
  like_count: number;
  comments: Comment[];
};

const ThreadDetail = () => {
  const { colors } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { threadId } = route.params as ThreadParam;
  const { getAuthHeader } = useAuth();
  const [thread, setThread] = useState<ThreadDetailData | null>(null);
  const [likes, setLikes] = useState<number>(0);
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    fetchThreadDetail();
    fetchComments();
  }, []);

  const fetchThreadDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}threads/${threadId}/`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      });
        if (!res.ok) throw new Error('Failed to load thread');
  const data: ThreadDetailData = await res.json();
  setThread(data);
  setLikes(data.like_count);
        return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading thread');
    } finally {
      setLoading(false);
    }
  };
  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_URL}comments/thread/${threadId}/date/`, { credentials: 'include' });
      if (res.ok) {
        const data: Comment[] = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error('Failed to load comments', e);
    }
  };
  // Trigger like action on thread
  const likeThread = async () => {
    try {
      // Get CSRF token from cookies
      const cookies = await Cookies.get(API_URL);
      const csrf = cookies.csrftoken?.value;
      // Use vote endpoint
      const res = await fetch(`${API_URL}forum/vote/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'X-CSRFToken': csrf } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          content_type: 'THREAD',
          object_id: threadId,
          vote_type: 'UPVOTE',
        }),
      });
        let json: any = {};
        try { json = await res.json(); } catch { json = {}; }
        if (!res.ok) {
          const msg = (json && (json.detail || json.error)) || 'Failed to like thread';
          throw new Error(msg);
        }
        const updatedLikes = json.like_count ?? likes + 1;
  setLikes(updatedLikes);
  // Refresh thread data
  await fetchThreadDetail();
  await fetchComments();
  Toast.show({ type: 'success', text1: 'Liked!', text2: `${updatedLikes} likes` });
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not like thread' });
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
      // Use add comment endpoint
      const res = await fetch(`${API_URL}comments/add/${threadId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'X-CSRFToken': csrf } : {}),
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
      <View style={[styles.center, { flex: 1, backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.active} />
      </View>
    );
  }

  if (error || !thread) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: colors.background }]}> 
        <CustomText style={{ color: colors.text }}>{error || 'Thread not found.'}</CustomText>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}> 
      <CustomText style={[styles.title, { color: colors.text }]}>{thread.title}</CustomText>
      <CustomText style={[styles.body, { color: colors.subText }]}>{thread.body}</CustomText>
      {/* Thread Author - Make clickable */}
      <View style={styles.authorRow}>
        <CustomText style={[styles.author, { color: colors.subText }]}>By </CustomText>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('Profile', { username: thread.author });
          }}
        >
          <CustomText style={[styles.authorName, { color: colors.active }]}>
            @{thread.author}
          </CustomText>
        </TouchableOpacity>
        <CustomText style={[styles.author, { color: colors.subText }]}>
          {' '}• {new Date(thread.created_at).toLocaleDateString()}
        </CustomText>
      </View>
      <View style={styles.likeSection}>
        <Pressable onPress={likeThread} style={styles.likeButton}>
          <CustomText style={[styles.likeText, { color: colors.active }]}>Like ({likes})</CustomText>
        </Pressable>
      </View>
      <CustomText style={[styles.sectionHeading, { color: colors.text }]}>Comments</CustomText>
      <View style={styles.commentInputSection}>
        <TextInput
          style={[styles.commentInput, { borderColor: colors.border, color: colors.text }]}
          placeholder="Write a comment..."
          placeholderTextColor={colors.subText}
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
  <Pressable onPress={submitComment} style={[styles.commentButton, { backgroundColor: colors.active }]} 
       disabled={isSubmitting || !newComment.trim()}>
          <CustomText style={[styles.commentButtonText, { color: colors.background }]}>Post</CustomText>
        </Pressable>
      </View>
      {comments.map(comment => (
        <View key={comment.id} style={[styles.commentCard, { borderColor: colors.border, backgroundColor: colors.navBar }]}> 
          <View style={styles.commentHeader}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('Profile', { username: comment.author });
              }}
            >
              <CustomText style={[styles.commentAuthor, { color: colors.active }]}>
                @{comment.author}
              </CustomText>
            </TouchableOpacity>
            <CustomText style={[styles.commentDate, { color: colors.subText }]}>
              {new Date(comment.created_at).toLocaleDateString()}
            </CustomText>
          </View>
          <CustomText style={[styles.commentContent, { color: colors.text }]}>
            {comment.content}
          </CustomText>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  body: { fontSize: 16, marginBottom: 8 },
  authorRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    alignItems: 'center',
    marginBottom: 8,
  },
  authorName: { 
    fontSize: 14, 
    fontWeight: '600' 
  },
  sectionHeading: { fontSize: 20, fontWeight: '600', marginVertical: 12 },
  commentCard: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8 },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: { 
    fontSize: 14, 
    fontWeight: '600' 
  },
  commentDate: { 
    fontSize: 12, 
    color: '#888' 
  },
  commentContent: { fontSize: 14, marginTop: 4 },
  likeSection: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 16 },
  likeButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, marginRight: 8 },
  likeText: { fontSize: 14 },
  commentInputSection: { flexDirection: 'row', marginBottom: 16 },
  commentInput: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 12, maxHeight: 100 },
  commentButton: { borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  commentButtonText: { fontSize: 14, fontWeight: '600' },
});

export default ThreadDetail;
