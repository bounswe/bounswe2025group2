// ChallengeCard.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Cookies from '@react-native-cookies/cookies';
import { useAuth } from '../context/AuthContext';

type Challenge = {
  id: number;
  title: string;
  challenge_type?: string;
  difficulty_level?: 'Beginner' | 'Intermediate' | 'Advanced';
  target_value?: number;
  unit?: string;
  start_date?: string; // ISO
  end_date?: string;   // ISO
};

type Props = {
  challengeId: number;
  onViewDetails?: (id: number) => void;
  baseUrl?: string;
  joined?: boolean; // controlled from parent
  onMembershipChange?: (id: number, joined: boolean) => void;
};

const ChallengeCard: React.FC<Props> = ({
  challengeId,
  onViewDetails,
  baseUrl,
  joined: joinedProp,
  onMembershipChange,
}) => {
  const { getAuthHeader } = useAuth();
  const API = baseUrl ?? 'http://164.90.166.81:8000/api';
  const cookieOrigin = API.replace(/\/api\/?$/, '');

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // Local mirror of "joined" so the button can disable immediately.
  // Initialized from prop if provided; otherwise null until we fetch.
  const [localJoined, setLocalJoined] = useState<boolean | null>(
    typeof joinedProp === 'boolean' ? joinedProp : null
  );

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participants, setParticipants] = useState(0);

  // Keep local state in sync if parent changes its truth
  useEffect(() => {
    if (typeof joinedProp === 'boolean') {
      setLocalJoined(joinedProp);
    }
  }, [joinedProp]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const cookies = await Cookies.get(cookieOrigin);
        const csrf = cookies.csrftoken?.value;

        // Detail
        const response = await fetch(`${API}/challenges/${challengeId}/`, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
            ...(csrf ? { 'X-CSRFToken': csrf } : {}),
          },
          credentials: 'include',
        });
        if (!response.ok) throw new Error('detail failed');
        const data = await response.json();
        if (!mounted) return;

        setChallenge(data.challenge);

        // Only set joined from server if parent didn't supply it
        if (typeof joinedProp !== 'boolean') {
          setLocalJoined(Boolean(data.joined));
        }

        // Participants via leaderboard length
        const response2 = await fetch(`${API}/challenges/${challengeId}/leaderboard/`, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
            ...(csrf ? { 'X-CSRFToken': csrf } : {}),
          },
          credentials: 'include',
        });
        if (response2.ok && mounted) {
          const list = await response2.json();
          setParticipants(Array.isArray(list) ? list.length : 0);
        } else if (mounted) {
          setParticipants(0);
        }
      } catch {
        Alert.alert('Error', 'Could not load challenge.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [API, challengeId, getAuthHeader, cookieOrigin, joinedProp]);

  const join = async () => {
    if (joining || localJoined) return;
    setJoining(true);
    try {
      const cookies = await Cookies.get(cookieOrigin);
      const csrf = cookies.csrftoken?.value;

      const response = await fetch(`${API}/challenges/${challengeId}/join/`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          ...(csrf ? { 'X-CSRFToken': csrf } : {}),
        },
        credentials: 'include',
      });

      if (response.ok || response.status === 201) {
        setLocalJoined(true);
        setParticipants((p) => p + 1);
        onMembershipChange?.(challengeId, true); // notify parent
      } else {
        const text = await response.text();
        Alert.alert('Join failed', text || 'Unable to join.');
      }
    } catch {
      Alert.alert('Join failed', 'Network error.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={[styles.card, styles.center]}>
        <Text>Challenge not found.</Text>
      </View>
    );
  }

  const dateStr =
    challenge.start_date || challenge.end_date
      ? new Date(challenge.start_date || challenge.end_date!).toLocaleDateString(undefined, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : '';

  const joinedUI = Boolean(localJoined);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        {challenge.challenge_type ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>{challenge.challenge_type}</Text>
          </View>
        ) : (
          <View />
        )}
        <Text style={styles.dateText}>{dateStr}</Text>
      </View>

      <Text style={styles.title}>{challenge.title}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          🏆 {challenge.target_value ?? '-'} {challenge.unit ?? ''}
        </Text>
        {challenge.difficulty_level && (
          <View style={[
            styles.difficultyBadge,
            challenge.difficulty_level === 'Beginner' && styles.difficultyBeginner,
            challenge.difficulty_level === 'Intermediate' && styles.difficultyIntermediate,
            challenge.difficulty_level === 'Advanced' && styles.difficultyAdvanced,
          ]}>
            <Text style={styles.difficultyText}>{challenge.difficulty_level}</Text>
          </View>
        )}
        <Text style={styles.metaText}>👥 {participants} participants</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={join}
          disabled={joinedUI || joining}
          style={[styles.primaryBtn, (joinedUI || joining) && styles.disabledBtn]}
        >
          <Text style={styles.primaryBtnText}>
            {joinedUI ? 'Joined' : 'Join Challenge'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            onViewDetails?.(challengeId);
          }}
          hitSlop={8}
          android_ripple={{ color: '#e0e0e0' }}
          style={styles.linkBtn}
        >
          <Text style={styles.linkText}>View Details</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#b46d6d',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    backgroundColor: '#fff8f8',
  },
  center: { alignItems: 'center', justifyContent: 'center', height: 120 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#f5dede',
  },
  pillText: { color: '#8a2e2e', fontSize: 12 },
  dateText: { color: '#8a2e2e', fontSize: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#8a2e2e' },
  metaRow: { flexDirection: 'row', gap: 16, alignItems: 'center', flexWrap: 'wrap' },
  metaText: { color: '#8a2e2e' },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  difficultyBeginner: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  difficultyIntermediate: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  difficultyAdvanced: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
  },
  actions: { marginTop: 8, gap: 8 },
  primaryBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#b46d6d',
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { color: '#8a2e2e', fontWeight: '600' },
  linkBtn: { alignItems: 'center', paddingVertical: 6 },
  linkText: { color: '#8a2e2e' },
});

export default ChallengeCard;