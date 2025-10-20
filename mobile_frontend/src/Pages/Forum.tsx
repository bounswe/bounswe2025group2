import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://164.90.166.81:8000/api';

type Forum = {
  id: number;
  title: string;
  description: string;
  thread_count: number;
  updated_at: string;
  created_by?: string;
  is_active?: boolean;
  order?: number;
};

const ForumCard = ({
  forum,
  colors,
  onPress,
}: {
  forum: Forum;
  colors: any;
  onPress: () => void;
}) => {
  const scale = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.navBar,
            borderColor: colors.border,
            transform: [{ scale }],
          },
        ]}
      >
        <CustomText style={[styles.cardTitle, { color: colors.text }]}>
          {forum.title}
        </CustomText>
        <CustomText style={[styles.cardDescription, { color: colors.subText }]}>
          {forum.description}
        </CustomText>
        <View style={styles.cardStats}>
          <CustomText style={[styles.statText, { color: colors.subText2 }]}>
            💬 {forum.thread_count} Threads
          </CustomText>
          <CustomText style={[styles.statText, { color: colors.subText2 }]}>
            🕒 {new Date(forum.updated_at).toLocaleDateString()}
          </CustomText>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const Forum = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { getAuthHeader } = useAuth();
  const [forums, setForums] = useState<Forum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForums();
  }, []);

  const fetchForums = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/forums/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch forums: ${response.statusText}`);
      }

      const data: Forum[] = await response.json();
      setForums(data);
    } catch (err) {
      console.error('Error fetching forums:', err);
      setError(err instanceof Error ? err.message : 'Failed to load forums');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForumPress = (forumId: number) => {
    // TODO: Implement ForumDetail page and add route to navigation
    console.log('Forum pressed:', forumId);
    // navigation.navigate('ForumDetail', { forumId });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.active} />
        <CustomText style={[styles.loadingText, { color: colors.subText }]}>Loading forums...</CustomText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}> 
        <CustomText style={[styles.errorText, { color: colors.text }]}>Unable to load forums</CustomText>
        <CustomText style={[styles.loadingText, { color: colors.subText, marginTop: 8 }]}>{error}</CustomText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.active, marginTop: 16 }]} onPress={fetchForums}>
          <CustomText style={[styles.buttonText, { color: colors.background }]}>Retry</CustomText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.header}>
        <View style={styles.headerText}>
          <CustomText style={[styles.title, { color: colors.text }]}>Forums</CustomText>
          <CustomText style={[styles.subtitle, { color: colors.subText }]}>Join discussions, share experiences</CustomText>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.forumList}>
          {forums.map((forum: Forum) => (
            <ForumCard
              key={forum.id}
              forum={forum}
              colors={colors}
              onPress={() => handleForumPress(forum.id)}
            />
          ))}
          {forums.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <CustomText style={{ color: colors.text, fontSize: 16, textAlign: 'center' }}>
                No forums available
              </CustomText>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  headerText: {
    marginLeft: 48,
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  forumList: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  statText: {
    fontSize: 12,
  },
  emptyState: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  menuButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default Forum;
