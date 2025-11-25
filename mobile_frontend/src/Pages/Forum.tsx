import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { ActivityIndicator, Button, Card, Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../constants/api';

type Forum = {
  id: number;
  title: string;
  description: string;
};

const Forum = () => {
  const theme = useTheme();
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
      const res = await fetch(`${API_URL}forums/`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader(),
        },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(res.statusText || 'Failed to load forums');
      const data: Forum[] = await res.json();
      setForums(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forums');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: theme.colors.background }]}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: theme.colors.background }]}>
        <Text variant="bodyLarge" style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchForums} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={forums}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card
            mode="elevated"
            style={styles.forumCard}
            onPress={() => {
              const stackNav = navigation.getParent()?.getParent();
              if (stackNav) {
                stackNav.navigate('ForumDetail', { forumId: item.id });
              } else {
                navigation.navigate('ForumDetail', { forumId: item.id });
              }
            }}
          >
            <Card.Content>
              <Text variant="titleLarge" style={styles.title}>{item.title}</Text>
              <Text variant="bodyMedium" numberOfLines={2} style={styles.description}>
                {item.description}
              </Text>
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, gap: 12 },
  forumCard: { marginBottom: 8 },
  title: { marginBottom: 8, fontWeight: 'bold' },
  description: { opacity: 0.7 },
  errorText: { marginBottom: 16, textAlign: 'center' },
  retryButton: { marginTop: 8 },
});

export default Forum;
