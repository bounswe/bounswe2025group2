import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Pressable, ImageSourcePropType, Alert, TouchableOpacity } from 'react-native';
import { 
  ActivityIndicator, 
  Surface, 
  TextInput as PaperTextInput,
  IconButton,
  Card,
  Avatar,
  Text,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import CustomText from './CustomText';
import { useTheme } from '../context/ThemeContext';
import Cookies from '@react-native-cookies/cookies';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '@constants/api';

type ThreadProps = {
  forumName: string;
  content: string;
  imageUrl?: ImageSourcePropType;
  profilePic: ImageSourcePropType;
  username: string;
  threadId: number;
  likeCount?: number;
  commentCount?: number;
};

const Thread = ({ forumName, content, imageUrl, profilePic, username, threadId, likeCount = 0, commentCount = 0 }: ThreadProps) => {
  const { colors, isDark } = useTheme();
  const { getAuthHeader } = useAuth();
  const navigation = useNavigation();
  const [vote, setVote] = useState<null | 'UPVOTE' | 'DOWNVOTE'>(null);
  const [likes, setLikes] = useState(0);
  const [loadingVote, setLoadingVote] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [comments, setComments] = useState(0);
  const [commentList, setCommentList] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  // Fetch data function
  const fetchData = async () => {
    // Fetch fresh thread data to get accurate like count FIRST
    try {
      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies.csrftoken?.value;
      const res = await fetch(`${API_URL}threads/${threadId}/`, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setLikes(data.like_count);
        setComments(data.comment_count);
      }
    } catch (e) {
      console.error('Failed to fetch thread data', e);
      // Fallback to prop values
      setLikes(likeCount);
      setComments(commentCount);
    }

    // Fetch user's vote status AFTER getting the like count
    try {
      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies.csrftoken?.value;
      const res = await fetch(`${API_URL}forum/vote/thread/${threadId}/status/`, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
      });
      
      console.log(`Vote status for thread ${threadId}:`, res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log(`Vote data for thread ${threadId}:`, data);
        setVote(data.vote_type || null);
      } else if (res.status === 404) {
        // No vote exists for this thread by this user
        console.log(`No vote found for thread ${threadId}`);
        setVote(null);
      } else {
        console.warn(`Unexpected vote status response: ${res.status}`);
        setVote(null);
      }
    } catch (e) {
      console.error('Failed to fetch vote status', e);
      setVote(null);
    }
    
    // Fetch comments
    try {
      setCommentsLoading(true);
      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies.csrftoken?.value;
      const res = await fetch(`${API_URL}comments/thread/${threadId}/date/`, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setCommentList(data);
      } else {
        setCommentList([]);
      }
    } catch (e) {
      setCommentList([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [threadId]);

  // Refetch when screen comes back into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });

    return unsubscribe;
  }, [navigation, threadId]);

  const handleVote = async (type: 'UPVOTE' | 'DOWNVOTE') => {
    if (loadingVote) return;
    setLoadingVote(true);
    
    try {
      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies.csrftoken?.value;
      const origin = API_URL.replace(/\/api\/?$/, '');
      
      if (vote === type) {
        // Remove vote
        console.log(`Removing ${type} for thread:`, threadId);
        const res = await fetch(`${API_URL}forum/vote/thread/${threadId}/`, {
          method: 'DELETE',
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
            'Referer': origin,
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
          credentials: 'include',
        });
        if (res.ok) {
          // Immediately update UI
          setVote(null);
        }
      } else {
        // Upvote or downvote
        console.log(`Adding ${type} for thread:`, threadId);
        const res = await fetch(`${API_URL}forum/vote/`, {
          method: 'POST',
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
            'Referer': origin,
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            content_type: 'THREAD',
            object_id: threadId,
            vote_type: type,
          }),
        });
        if (res.ok) {
          // Immediately update UI
          setVote(type);
        }
      }
      
      // Refetch thread data after vote to sync like count
      await fetchData();
    } catch (e) {
      console.error('Vote error:', e);
      Alert.alert('Error', 'Failed to vote.');
      // On error, refetch to ensure UI matches server state
      await fetchData();
    } finally {
      setLoadingVote(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setCommentLoading(true);
    const cookies = await Cookies.get(API_URL);
    const csrfToken = cookies.csrftoken?.value;
    try {
      const res = await fetch(`${API_URL}comments/add/${threadId}/`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ content: commentText }),
      });
      if (res.ok) {
        setCommentText('');
        setComments(comments + 1);
        // Refetch comments
        const fetchComments = async () => {
          setCommentsLoading(true);
          try {
            const cookies = await Cookies.get(API_URL);
            const csrfToken = cookies.csrftoken?.value;
            const res = await fetch(`${API_URL}comments/thread/${threadId}/date/`, {
              headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
                ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
              },
              credentials: 'include',
            });
            if (res.ok) {
              const data = await res.json();
              setCommentList(data);
            } else {
              setCommentList([]);
            }
          } catch (e) {
            setCommentList([]);
          } finally {
            setCommentsLoading(false);
          }
        };
        fetchComments();
      } else {
        const error = await res.text();
        Alert.alert('Error', error);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to post comment.');
    } finally {
      setCommentLoading(false);
    }
  };

  const renderContent = (text?: string) => {
    if (typeof text !== 'string') return null;
    const words = text.split(/(\s+)/);
    return words.map((word, index) => {
      if (word.startsWith('@')) {
        return (
          <CustomText 
            key={index} 
            style={[styles.content, styles.mention, { color: colors.mentionText }]}
          >
            {word}
          </CustomText>
        );
      }
      return (
        <CustomText 
          key={index} 
          style={[styles.content, { color: colors.text }]}
        >
          {word}
        </CustomText>
      );
    });
  };

  const handleUsernamePress = (usernameToNavigate: string) => {
    // @ts-ignore
    navigation.navigate('Profile', { username: usernameToNavigate });
  };

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.forumSection}>
          <CustomText style={[styles.forumName, { color: colors.subText }]}>
            /{forumName}
          </CustomText>
        </View>
      </View>

      <View style={styles.profileSection}>
        <TouchableOpacity onPress={() => handleUsernamePress(username)} activeOpacity={0.7}>
          <Image 
            source={profilePic} 
            style={[styles.profilePic, { borderColor: colors.border }]} 
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleUsernamePress(username)} activeOpacity={0.7}>
          <CustomText style={[styles.username, { color: colors.subText }]}>
            @{username}
          </CustomText>
        </TouchableOpacity>
      </View>

      {imageUrl && (
        <Image
          source={imageUrl}
          style={[styles.image, { borderColor: colors.border }]}
        />
      )}

      <View style={styles.contentContainer}>
        {renderContent(content)}
      </View>

      <View style={styles.votingContainer}>
        {/* Upvote Button */}
        <Pressable 
          onPress={() => handleVote('UPVOTE')} 
          style={[
            styles.voteButton,
            vote === 'UPVOTE' && styles.voteButtonActive,
            { 
              borderColor: vote === 'UPVOTE' ? colors.mentionText : colors.border,
              backgroundColor: vote === 'UPVOTE' ? colors.mentionText + '20' : 'transparent'
            }
          ]}
        >
          <CustomText style={[
            styles.voteIcon,
            { color: vote === 'UPVOTE' ? colors.mentionText : colors.subText }
          ]}>
            👍
          </CustomText>
        </Pressable>
        
        {/* Vote Count */}
        <View style={[styles.voteCountContainer, { backgroundColor: colors.navBar }]}>
          <CustomText style={[styles.voteCount, { color: colors.text }]}>{likes}</CustomText>
        </View>
        
        {/* Downvote Button */}
        <Pressable 
          onPress={() => handleVote('DOWNVOTE')} 
          style={[
            styles.voteButton,
            vote === 'DOWNVOTE' && styles.voteButtonActive,
            { 
              borderColor: vote === 'DOWNVOTE' ? colors.mentionText : colors.border,
              backgroundColor: vote === 'DOWNVOTE' ? colors.mentionText + '20' : 'transparent'
            }
          ]}
        >
          <CustomText style={[
            styles.voteIcon,
            { color: vote === 'DOWNVOTE' ? colors.mentionText : colors.subText }
          ]}>
            👎
          </CustomText>
        </Pressable>
        
        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <CustomText style={[styles.commentIcon, { color: colors.subText }]}>💬</CustomText>
          <CustomText style={[styles.commentCount, { color: colors.text }]}>{comments}</CustomText>
        </View>
      </View>
      {/* Comments list */}
      <View style={{ marginBottom: 8 }}>
        {commentsLoading ? (
          <ActivityIndicator size="small" />
        ) : commentList.length === 0 ? (
          <Text variant="bodySmall" style={{ fontStyle: 'italic', opacity: 0.6 }}>
            No comments yet.
          </Text>
        ) : (
          commentList.map((c, idx) => (
            <Card key={c.id || idx} mode="outlined" style={{ marginBottom: 8 }}>
              <Card.Content style={{ paddingVertical: 8 }}>
                <TouchableOpacity 
                  onPress={() => handleUsernamePress(c.author_username || c.author || 'user')} 
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}
                >
                  <Avatar.Text 
                    size={24} 
                    label={(c.author_username || c.author || 'U')[0].toUpperCase()} 
                    style={{ marginRight: 8 }}
                  />
                  <Text variant="labelLarge" style={{ color: colors.mentionText, fontWeight: '600' }}>
                    @{c.author_username || c.author || 'user'}
                  </Text>
                </TouchableOpacity>
                <Text variant="bodyMedium">{c.content}</Text>
              </Card.Content>
            </Card>
          ))
        )}
      </View>
      
      {/* Comment input */}
      <View style={{ marginBottom: 8, paddingHorizontal: 4 }}>
        <PaperTextInput
          mode="outlined"
          placeholder="Add a comment..."
          value={commentText}
          onChangeText={setCommentText}
          disabled={commentLoading}
          maxLength={500}
          multiline
          dense
          right={
            <PaperTextInput.Icon 
              icon="send" 
              onPress={handleComment}
              disabled={commentLoading || !commentText.trim()}
              loading={commentLoading}
            />
          }
        />
        {commentText.length > 0 && (
          <Text variant="labelSmall" style={{ textAlign: 'right', marginTop: 4, opacity: 0.6 }}>
            {commentText.length}/500
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 30,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  forumSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  forumName: {
    fontSize: 14,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  profilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
  },
  mention: {
    fontWeight: 'bold',
  },
  votingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  voteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  voteButtonActive: {
    // Removed the backgroundColor from here since we're setting it inline now
  },
  voteIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  voteCountContainer: {
    minWidth: 40,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  voteCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    gap: 6,
  },
  commentIcon: {
    fontSize: 18,
  },
  commentCount: {
    fontSize: 16,
    fontWeight: '500',
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commentItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentTime: {
    fontSize: 12,
    color: '#888',
  },
  commentContent: {
    fontSize: 14,
  },
});

export default Thread;
