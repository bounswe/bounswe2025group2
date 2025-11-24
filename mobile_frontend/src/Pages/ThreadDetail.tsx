import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Pressable, TextInput, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import CustomText from '@components/CustomText';
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
  const { colors } = useTheme();
  const route = useRoute();
  const { threadId } = route.params as ThreadParam;
  const { getAuthHeader } = useAuth();
  const [thread, setThread] = useState<ThreadDetailData | null>(null);
  const [likes, setLikes] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
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
  // Toggle like on thread
  const toggleLike = async () => {
    // Optimistic update - update UI immediately
    const wasLiked = isLiked;
    const previousLikes = likes;
    
    setIsLiked(!wasLiked);
    setLikes(wasLiked ? likes - 1 : likes + 1);
    
    try {
      // Get CSRF token from cookies
      const cookies = await Cookies.get(API_URL);
      const csrf = cookies.csrftoken?.value;
      const origin = API_URL.replace(/\/api\/?$/, '');
      
      // Use vote endpoint - clicking again will toggle the like
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
        let json: any = {};
        try { json = await res.json(); } catch { json = {}; }
        if (!res.ok) {
          // Revert optimistic update on error
          setIsLiked(wasLiked);
          setLikes(previousLikes);
          const msg = (json && (json.detail || json.error)) || 'Failed to like thread';
          throw new Error(msg);
        }
        
        // Update state based on actual response
        if (json.like_count !== undefined) setLikes(json.like_count);
        if (json.user_has_liked !== undefined) setIsLiked(json.user_has_liked);
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not update like' });
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}> 
      {/* Title with badges */}
      <View style={styles.titleSection}>
        <CustomText style={[styles.title, { color: colors.text }]}>{thread.title}</CustomText>
        <View style={styles.badgesContainer}>
          {thread.is_pinned && (
            <View style={[styles.badge, styles.pinnedBadge]}>
              <CustomText style={styles.badgeText}>📌 PINNED</CustomText>
            </View>
          )}
          {thread.is_locked && (
            <View style={[styles.badge, styles.lockedBadge]}>
              <CustomText style={styles.badgeText}>🔒 LOCKED</CustomText>
            </View>
          )}
        </View>
      </View>
      
      {/* Thread metadata card */}
      <View style={[styles.metadataCard, { borderColor: colors.border }]}>
        <View style={styles.metadataRow}>
          <Image 
            source={thread.author_profile_photo ? { uri: thread.author_profile_photo } : DEFAULT_PROFILE_PIC} 
            style={styles.profilePhoto}
          />
          <CustomText style={[styles.metadataText, { color: colors.text }]}>{thread.author}</CustomText>
        </View>
        <View style={styles.metadataRow}>
          <CustomText style={[styles.metadataIcon, { color: colors.active }]}>📅</CustomText>
          <CustomText style={[styles.metadataText, { color: colors.text }]}>{formatDate(thread.created_at)}</CustomText>
        </View>
        <View style={styles.metadataRow}>
          <CustomText style={[styles.metadataIcon, { color: colors.active }]}>💬</CustomText>
          <CustomText style={[styles.metadataText, { color: colors.text }]}>{thread.comment_count} comment{thread.comment_count !== 1 ? 's' : ''}</CustomText>
        </View>
      </View>

      <CustomText style={[styles.body, { color: colors.text }]}>{thread.content}</CustomText>
      <View style={styles.likeSection}>
        <Pressable 
          onPress={toggleLike} 
          style={[
            styles.likeButton, 
            { 
              borderColor: isLiked ? colors.active : colors.border,
              backgroundColor: isLiked ? `${colors.active}15` : 'transparent'
            }
          ]}
        >
          <CustomText style={[styles.likeText, { color: isLiked ? colors.active : colors.subText }]}>
            {isLiked ? '👍' : '🤍'} {likes}
          </CustomText>
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
        <View key={comment.id} style={[styles.commentCard, { borderColor: colors.border }]}> 
          <View style={styles.commentHeader}>
            <Image 
              source={comment.author_profile_photo ? { uri: comment.author_profile_photo } : DEFAULT_PROFILE_PIC} 
              style={styles.commentProfilePhoto}
            />
            <CustomText style={[styles.commentAuthor, { color: colors.text }]}>{comment.author_username}</CustomText>
          </View>
          <CustomText style={[styles.commentContent, { color: colors.text }]}>{comment.content}</CustomText>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { justifyContent: 'center', alignItems: 'center' },
  titleSection: {
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pinnedBadge: {
    backgroundColor: '#FFD700',
  },
  lockedBadge: {
    backgroundColor: '#FF6B6B',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
  },
  metadataCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profilePhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profilePhotoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
  },
  metadataIcon: {
    fontSize: 16,
  },
  metadataText: {
    fontSize: 14,
    flex: 1,
  },
  body: { fontSize: 16, marginBottom: 16, lineHeight: 24 },
  sectionHeading: { fontSize: 20, fontWeight: '600', marginVertical: 12 },
  commentCard: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8, backgroundColor: 'transparent' },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  commentProfilePhoto: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  commentProfilePhotoPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentPlaceholderText: {
    fontSize: 12,
  },
  commentIcon: {
    fontSize: 14,
  },
  commentAuthor: { fontSize: 14, fontWeight: '700' },
  commentContent: { fontSize: 14, lineHeight: 20 },
  likeSection: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 16 },
  likeButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, marginRight: 8 },
  likeText: { fontSize: 14 },
  commentInputSection: { flexDirection: 'row', marginBottom: 16 },
  commentInput: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 12, maxHeight: 100 },
  commentButton: { borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  commentButtonText: { fontSize: 14, fontWeight: '600' },
});

export default ThreadDetail;
