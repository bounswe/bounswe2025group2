import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import CustomText from '@components/CustomText';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://164.90.166.81:8000/api';

type Forum = {
  id: number;
  title: string;
  description: string;
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
      const res = await fetch(`${API_BASE_URL}/forums/`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
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
      <View style={[styles.center, { flex: 1, backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.active} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: colors.background }]}> 
        <CustomText style={{ color: colors.text }}>{error}</CustomText>
        <TouchableOpacity onPress={fetchForums} style={[styles.retryButton, { backgroundColor: colors.active }]}> 
          <CustomText style={{ color: colors.background }}>Retry</CustomText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <FlatList
        data={forums}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.forumItem, { borderColor: colors.border }]}
            onPress={() => {
              const stackNav = navigation.getParent()?.getParent();
              if (stackNav) {
                stackNav.navigate('ForumDetail', { forumId: item.id });
              } else {
                navigation.navigate('ForumDetail', { forumId: item.id });
              }
            }}
          >
            <CustomText style={[styles.title, { color: colors.text }]}>{item.title}</CustomText>
            <CustomText style={[styles.description, { color: colors.subText }]} numberOfLines={2}>
              {item.description}
            </CustomText>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  forumItem: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: 'bold' },
  description: { fontSize: 14, marginTop: 4 },
  retryButton: { padding: 12, borderRadius: 8, marginTop: 12 },
});

export default Forum;
