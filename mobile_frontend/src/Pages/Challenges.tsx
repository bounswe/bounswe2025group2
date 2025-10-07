import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Cookies from '@react-native-cookies/cookies';
import { useAuth } from '../context/AuthContext';
import ChallengeCard from '../components/ChallengeCard';

type ChallengeListItem = {
  id: number;
  // the search endpoint likely returns more fields,
  // but we only need id here since ChallengeCard fetches its own detail
};

const API = 'http://10.0.2.2:8000/api';

const Challenges: React.FC = () => {
  const { getAuthHeader } = useAuth();
  const [items, setItems] = useState<ChallengeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Optional: tweak your default filters here
  // Example: only active challenges
  const defaultParams = { is_active: 'true' };

  const buildUrl = () => {
    const url = new URL(`${API}/challenges/search/`);
    Object.entries(defaultParams).forEach(([k, v]) => {
      if (v != null && String(v).length > 0) url.searchParams.set(k, String(v));
    });
    return url.toString();
  };

  const fetchChallenges = async () => {
    try {
      const cookies = await Cookies.get('http://10.0.2.2:8000');
      const csrf = cookies.csrftoken?.value;

      const response = await fetch(buildUrl(), {
        method: 'GET',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          ...(csrf ? { 'X-CSRFToken': csrf } : {}),
        },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('search failed');

      const json = await response.json();
      const list: ChallengeListItem[] = Array.isArray(json) ? json : (json.results ?? []);
      setItems(list);
    } catch (e) {
      Alert.alert('Error', 'Could not load challenges.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once when this screen mounts

  const onRefresh = () => {
    setRefreshing(true);
    fetchChallenges();
  };

  if (loading) {
    return (
      <View style={{ padding: 16 }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Simple count at the top */}
      <Text style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
        Found {items.length} challenge{items.length === 1 ? '' : 's'}
      </Text>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={{ padding: 16 }}>No challenges match your filters.</Text>
        }
        renderItem={({ item }) => (
          <ChallengeCard
            challengeId={item.id}
            baseUrl={API}
            onViewDetails={(id) => {
              // plug your navigation here, for example:
              // navigation.navigate('ChallengeDetail', { id });
            }}
          />
        )}
      />
    </View>
  );
};

export default Challenges;