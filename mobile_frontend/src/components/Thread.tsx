import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Pressable, ImageSourcePropType, Alert, TextInput, Button, ActivityIndicator } from 'react-native';
import CustomText from './CustomText';
import { useTheme } from '../context/ThemeContext';
import Cookies from '@react-native-cookies/cookies';
import { useAuth } from '../context/AuthContext';

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
  const [vote, setVote] = useState<null | 'UPVOTE' | 'DOWNVOTE'>(null);
  const [likes, setLikes] = useState(likeCount);
  const [loadingVote, setLoadingVote] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [comments, setComments] = useState(commentCount);
  const [commentList, setCommentList] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  useEffect(() => {
    // Fetch user's vote status
    const fetchVoteStatus = async () => {
      try {
        const cookies = await Cookies.get('http://164.90.166.81:8000');
        const csrfToken = cookies.csrftoken?.value;
        const res = await fetch(`http://164.90.166.81:8000/api/forum/vote/thread/${threadId}/status/`, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setVote(data.vote_type);
        } else {
          setVote(null);
        }
      } catch (e) {
        setVote(null);
      }
    };
    fetchVoteStatus();
    setLikes(likeCount);
    setComments(commentCount);
    // Fetch comments
    const fetchComments = async () => {
      setCommentsLoading(true);
      try {
        const cookies = await Cookies.get('http://164.90.166.81:8000');
        const csrfToken = cookies.csrftoken?.value;
        const res = await fetch(`http://164.90.166.81:8000/api/comments/thread/${threadId}/date/`, {
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
  }, [threadId, likeCount, commentCount]);

  const handleVote = async (type: 'UPVOTE' | 'DOWNVOTE') => {
    if (loadingVote) return;
    setLoadingVote(true);
    const cookies = await Cookies.get('http://164.90.166.81:8000');
    const csrfToken = cookies.csrftoken?.value;
    try {
      if (vote === type) {
        // Remove vote
        const res = await fetch(`http://164.90.166.81:8000/api/forum/vote/thread/${threadId}/`, {
          method: 'DELETE',
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
          credentials: 'include',
        });
        if (res.ok) {
          setVote(null);
          setLikes(likes + (type === 'UPVOTE' ? -1 : 1));
        }
      } else {
        // Upvote or downvote
        const res = await fetch('http://164.90.166.81:8000/api/forum/vote/', {
          method: 'POST',
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
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
          setVote(type);
          setLikes(likes + (type === 'UPVOTE' ? (vote === 'DOWNVOTE' ? 2 : 1) : (vote === 'UPVOTE' ? -2 : -1)));
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to vote.');
    } finally {
      setLoadingVote(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setCommentLoading(true);
    const cookies = await Cookies.get('http://164.90.166.81:8000');
    const csrfToken = cookies.csrftoken?.value;
    try {
      const res = await fetch(`http://164.90.166.81:8000/api/comments/add/${threadId}/`, {
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
            const cookies = await Cookies.get('http://164.90.166.81:8000');
            const csrfToken = cookies.csrftoken?.value;
            const res = await fetch(`http://164.90.166.81:8000/api/comments/thread/${threadId}/date/`, {
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
        <Image 
          source={profilePic} 
          style={[styles.profilePic, { borderColor: colors.border }]} 
        />
        <CustomText style={[styles.username, { color: colors.subText }]}>
          @{username}
        </CustomText>
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
            { borderColor: vote === 'UPVOTE' ? colors.mentionText : colors.border }
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
            { borderColor: vote === 'DOWNVOTE' ? colors.mentionText : colors.border }
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
          <ActivityIndicator size="small" color={colors.mentionText} />
        ) : commentList.length === 0 ? (
          <CustomText style={{ color: colors.subText, fontStyle: 'italic' }}>No comments yet.</CustomText>
        ) : (
          commentList.map((c, idx) => (
            <View key={c.id || idx} style={{ marginBottom: 4, padding: 6, backgroundColor: isDark ? '#555555' : '#f7f7f7', borderRadius: 6 }}>
              <CustomText style={{ fontWeight: 'bold', color: colors.mentionText }}>@{c.author_username || c.author || 'user'}</CustomText>
              <CustomText style={{ color: colors.text }}>{c.content}</CustomText>
            </View>
          ))
        )}
      </View>
      {/* Comment input */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <TextInput
          style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 8, color: isDark ? '#333333' : colors.text, backgroundColor: '#fff' }}
          placeholder="Add a comment..."
          placeholderTextColor={colors.subText}
          value={commentText}
          onChangeText={setCommentText}
          editable={!commentLoading}
        />
        <Button title={commentLoading ? '' : 'Post'} onPress={handleComment} disabled={commentLoading || !commentText.trim()} />
        {commentLoading && <ActivityIndicator size="small" color={colors.mentionText} style={{ marginLeft: 8 }} />}
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
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
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
});

export default Thread;
