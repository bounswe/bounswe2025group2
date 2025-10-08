import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Cookies from '@react-native-cookies/cookies';
import { useAuth } from '../context/AuthContext';
import ChallengeCard from '../components/ChallengeCard';
import CustomText from '@components/CustomText';

type ChallengeListItem = { id: number };

const API = 'http://10.0.2.2:8000/api';

const Challenges: React.FC = () => {
  const { getAuthHeader } = useAuth();

  const [items, setItems] = useState<ChallengeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // detail modal state
  const [detailId, setDetailId] = useState<number | null>(null);

  // Default filter: active challenges
  const defaultParams = { is_active: 'true' };

  const buildUrl = () => {
    const qs = Object.entries(defaultParams)
      .filter(([, v]) => v != null && String(v).length > 0)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    return `${API}/challenges/search/${qs ? `?${qs}` : ''}`;
  };

  const fetchChallenges = async () => {
    try {
      const cookies = await Cookies.get('http://10.0.2.2:8000');
      const csrf = cookies.csrftoken?.value;

      const res = await fetch(buildUrl(), {
        method: 'GET',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          ...(csrf ? { 'X-CSRFToken': csrf } : {}),
        },
        credentials: 'include',
      });

      if (!res.ok) throw new Error('search failed');

      const json = await res.json();
      const list: ChallengeListItem[] = Array.isArray(json) ? json : (json.results ?? []);
      setItems(list);
    } catch {
      Alert.alert('Error', 'Could not load challenges.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChallenges();
  };

  // Create Challenge 
  
  const [title, setTitle] = useState('');
  const [challengeType, setChallengeType] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');

  // Dates as Date objects, converted to ISO on submit
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Optional fields
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');

  // Date Picker state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | 'datetime'>('date');
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const openDateTimePicker = (which: 'start' | 'end') => {
    setPickerTarget(which);
    if (Platform.OS === 'ios') {
      setPickerMode('datetime');
      setPickerVisible(true);
    } else {
      setPickerMode('date');
      setPickerVisible(true);
    }
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        setPickerVisible(false);
        setTempDate(null);
        return;
      }
      if (pickerMode === 'date') {
        const base = selected || new Date();
        setTempDate(base);
        setPickerVisible(false);
        setTimeout(() => {
          setPickerMode('time');
          setPickerVisible(true);
        }, 0);
      } else if (pickerMode === 'time') {
        const time = selected || new Date();
        const base = tempDate || new Date();
        const merged = new Date(base);
        merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
        if (pickerTarget === 'start') setStartDate(merged);
        if (pickerTarget === 'end') setEndDate(merged);
        setPickerVisible(false);
        setTempDate(null);
      }
    } else {
      if (event.type === 'dismissed') {
        setPickerVisible(false);
        return;
      }
      if (selected) {
        if (pickerTarget === 'start') setStartDate(selected);
        if (pickerTarget === 'end') setEndDate(selected);
      }
      setPickerVisible(false);
    }
  };

  const formatDT = (d: Date | null) =>
    d
      ? d.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Pick date and time';

  const resetForm = () => {
    setTitle('');
    setChallengeType('');
    setTargetValue('');
    setUnit('');
    setStartDate(null);
    setEndDate(null);
    setDescription('');
    setLocation('');
    setMinAge('');
    setMaxAge('');
  };

  // Validation
  const validateRequired = () => {
    if (!title.trim()) return 'Title is required.';
    if (title.trim().length > 255) return 'Title must be at most 255 characters.';
    if (!challengeType.trim()) return 'Challenge type is required.';
    if (challengeType.trim().length > 50) return 'Challenge type must be at most 50 characters.';
    if (!unit.trim()) return 'Unit is required.';
    if (unit.trim().length > 20) return 'Unit must be at most 20 characters.';
    if (!targetValue.trim() || isNaN(Number(targetValue))) return 'Target value must be a number.';
    if (Number(targetValue) <= 0) return 'Target value must be positive.';
    if (!startDate) return 'Start date-time is required.';
    if (!endDate) return 'End date-time is required.';
    if (startDate > endDate) return 'Start must be before end.';
    if (minAge.trim() && (isNaN(Number(minAge)) || Number(minAge) < 0)) return 'Min age must be a non-negative number.';
    if (maxAge.trim() && (isNaN(Number(maxAge)) || Number(maxAge) < 0)) return 'Max age must be a non-negative number.';
    if (minAge.trim() && maxAge.trim() && Number(minAge) > Number(maxAge)) return 'Min age cannot be greater than max age.';
    if (location.trim() && location.trim().length > 255) return 'Location must be at most 255 characters.';
    return null;
  };

  const createChallenge = async () => {
    const err = validateRequired();
    if (err) {
      Alert.alert('Invalid input', err);
      return;
    }

    setCreating(true);
    try {
      const cookies = await Cookies.get('http://10.0.2.2:8000');
      const csrf = cookies.csrftoken?.value;

      const body: any = {
        title: title.trim(),
        challenge_type: challengeType.trim(),
        target_value: Number(targetValue),
        unit: unit.trim(),
        start_date: startDate!.toISOString(), // ISO 8601
        end_date: endDate!.toISOString(),     // ISO 8601
      };
      if (description.trim()) body.description = description.trim();
      if (location.trim()) body.location = location.trim(); // backend geocodes and fills lat/lon
      if (minAge.trim()) body.min_age = Number(minAge);
      if (maxAge.trim()) body.max_age = Number(maxAge);

      const res = await fetch(`${API}/challenges/create/`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          ...(csrf ? { 'X-CSRFToken': csrf } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (res.status === 201) {
        Alert.alert('Success', 'Challenge created.');
        setShowCreate(false);
        resetForm();
        fetchChallenges();
      } else if (res.status === 403) {
        const text = await res.text();
        Alert.alert('Forbidden', text || 'Only coaches can create challenges.');
      } else if (res.status === 400) {
        const text = await res.text();
        Alert.alert('Validation error', text || 'Please check your inputs.');
      } else {
        const text = await res.text();
        Alert.alert('Error', text || 'Could not create challenge.');
      }
    } catch {
      Alert.alert('Network error', 'Please try again.');
    } finally {
      setCreating(false);
    }
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
      <Text style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
        Found {items.length} challenge{items.length === 1 ? '' : 's'}
      </Text>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 96 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={{ padding: 16 }}>No challenges match your filters.</Text>}
        renderItem={({ item }) => (
          <ChallengeCard
            challengeId={item.id}
            baseUrl={API}
            onViewDetails={(id: number) => setDetailId(id)}
          />
        )}
      />

      {/* Floating plus button */}
      <Pressable style={styles.fab} onPress={() => setShowCreate(true)}>
        <Text style={styles.fabText}>＋</Text>
      </Pressable>

      {/* Create modal */}
      <Modal animationType="slide" visible={showCreate} onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalWrap}>
          <Text style={styles.modalTitle}>Create Challenge</Text>
          <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
            <TextInput placeholder="Title *" value={title} onChangeText={setTitle} style={styles.input} />
            <TextInput
              placeholder="Challenge type *  (e.g., Step Count)"
              value={challengeType}
              onChangeText={setChallengeType}
              style={styles.input}
            />
            <TextInput
              placeholder="Target value *  (number)"
              value={targetValue}
              onChangeText={setTargetValue}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              placeholder="Unit *  (e.g., steps, km, minutes)"
              value={unit}
              onChangeText={setUnit}
              style={styles.input}
            />

            {/* Start date-time */}
            <Pressable onPress={() => openDateTimePicker('start')} style={styles.pickBtn}>
              <Text style={styles.pickBtnText}>Start date-time *: {formatDT(startDate)}</Text>
            </Pressable>

            {/* End date-time */}
            <Pressable onPress={() => openDateTimePicker('end')} style={styles.pickBtn}>
              <Text style={styles.pickBtnText}>End date-time *: {formatDT(endDate)}</Text>
            </Pressable>

            {/* Optional fields */}
            <TextInput
              placeholder="Description (optional)"
              value={description}
              onChangeText={setDescription}
              style={[styles.input, { height: 90 }]}
              multiline
            />
            <TextInput
              placeholder="Location (optional)"
              value={location}
              onChangeText={setLocation}
              style={styles.input}
            />
            <TextInput
              placeholder="Min age (optional)"
              value={minAge}
              onChangeText={setMinAge}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              placeholder="Max age (optional)"
              value={maxAge}
              onChangeText={setMaxAge}
              keyboardType="numeric"
              style={styles.input}
            />

            <View style={styles.row}>
              <Pressable onPress={() => setShowCreate(false)} style={[styles.btn, styles.btnSecondary]} disabled={creating}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={createChallenge}
                style={[styles.btn, styles.btnPrimary, creating && { opacity: 0.7 }]}
                disabled={creating}
              >
                <Text style={styles.btnPrimaryText}>{creating ? 'Creating...' : 'Create'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>

        {/* Single DateTimePicker rendered conditionally */}
        {pickerVisible && (
          <DateTimePicker
            value={
              pickerTarget === 'start'
                ? startDate || new Date()
                : pickerTarget === 'end'
                ? endDate || new Date()
                : new Date()
            }
            mode={pickerMode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onPickerChange}
          />
        )}
      </Modal>
      <Modal visible={detailId != null} animationType="slide" onRequestClose={() => setDetailId(null)}>
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          {detailId != null && (
            <ChallengeDetailContent id={detailId} api={API} onClose={() => setDetailId(null)} />
          )}
        </View>
      </Modal>
    </View>
  );
};

// Minimal detail content for the popup
const ChallengeDetailContent: React.FC<{ id: number; api: string; onClose: () => void }> = ({ id, api, onClose }) => {
  const { getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [joined, setJoined] = useState<boolean>(false);
  const [challenge, setChallenge] = useState<any>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [participantsCount, setParticipantsCount] = useState<number | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);

  type LeaderboardRow = {
    id?: number;
    user?: number;
    username?: string;
    current_value?: number;
    finish_date?: string;
  };

  // Leaderboard
  const cookieOrigin = api.replace(/\/api\/?$/, '');

  const loadLeaderboard = async () => {
    if (leaderboardLoading || leaderboardLoaded) return;
    setLeaderboardLoading(true);
    try {
      const cookies = await Cookies.get(cookieOrigin);
      const csrf = cookies.csrftoken?.value;
      const r2 = await fetch(`${api}/challenges/${id}/leaderboard/`, {
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRFToken': csrf } : {}) },
        credentials: 'include',
      });
      if (r2.ok) {
        const list = await r2.json();
        setLeaderboard(Array.isArray(list) ? list : []);
      }
    } finally {
      setLeaderboardLoading(false);
      setLeaderboardLoaded(true);
    }
  };

  const onToggleParticipants = async () => {
    const next = !showParticipants;
    setShowParticipants(next);
    if (next && !leaderboardLoaded) {
      await loadLeaderboard();
    }
  };


  const medal = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '');
  
  const pct = (value?: number) => {
    const t = Number(challenge?.target_value || 0);
    if (!t) return 0;
    return Math.max(0, Math.min(100, Math.round(((value ?? 0) / t) * 100)));
  };

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const cookies = await Cookies.get(api.replace(/\/api\/?$/, ''));
        const csrf = cookies.csrftoken?.value;

        // detail
        const res = await fetch(`${api}/challenges/${id}/`, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
            ...(csrf ? { 'X-CSRFToken': csrf } : {}),
          },
          credentials: 'include',
        });
        if (!res.ok) throw new Error('detail failed');
        const data = await res.json();
        if (!alive) return;
        setJoined(!!data.joined);
        setChallenge(data.challenge);
        setParticipant(data.participant ?? null);

        // participants count via leaderboard
        const r2 = await fetch(`${api}/challenges/${id}/leaderboard/`, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
            ...(csrf ? { 'X-CSRFToken': csrf } : {}),
          },
          credentials: 'include',
        });
        if (r2.ok) {
          const list = await r2.json();
          setLeaderboard(Array.isArray(list) ? list : []);
          if (alive) setParticipantsCount(Array.isArray(list) ? list.length : null);
        }
      } catch (e: any) {
        if (alive) setErr('Could not load challenge details.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [id, api, getAuthHeader]);

  const fmt = (d?: string) =>
    d ? new Date(d).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  if (loading) return <View style={{ padding: 16 }}><ActivityIndicator /></View>;
  if (err || !challenge) return (
    <View style={{ padding: 16 }}>
      <Text style={{ marginBottom: 8 }}>{err ?? 'Not found.'}</Text>
      <Pressable onPress={onClose} style={{ paddingVertical: 8 }}>
        <Text style={{ color: '#8a2e2e' }}>Close</Text>
      </Pressable>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#8a2e2e', flexShrink: 1 }}>{challenge.title}</Text>
        <Pressable onPress={onClose} style={{ padding: 8 }}><Text>Close</Text></Pressable>
      </View>

      {/* Basic facts */}
      <Text style={{ marginTop: 12 }}>Type: {challenge.challenge_type || '—'}</Text>
      <Text>Target: {challenge.target_value ?? '—'} {challenge.unit || ''}</Text>
      <Text>Joined: {joined ? 'Yes' : 'No'}</Text>
      {participantsCount != null && <Text>Participants: {participantsCount}</Text>}
      <View style={{ marginTop: 12 }}>
        <Pressable
          onPress={onToggleParticipants}
          style={{ paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#b46d6d', borderRadius: 8 }}
        >
          <CustomText style={{ color: '#8a2e2e' }}>
            {showParticipants ? 'Hide participants' : `Show participants${participantsCount != null ? ` (${participantsCount})` : ''}`}
          </CustomText>
        </Pressable>

        {showParticipants && (
          <View style={{ marginTop: 10 }}>
            {leaderboardLoading ? (
              <ActivityIndicator />
            ) : leaderboard.length === 0 ? (
              <CustomText>No participants yet.</CustomText>
            ) : (
              leaderboard.map((p) => (
                <View key={p.id ?? `${p.user}-${p.username ?? 'u'}`} style={{ paddingVertical: 6 }}>
                  <CustomText style={{ fontWeight: '600' }}>{p.username || `User #${p.user}`}</CustomText>
                  <CustomText>
                    {(p.current_value ?? 0)} / {challenge.target_value} {challenge.unit || ''}
                  </CustomText>
                  {p.finish_date && (
                    <CustomText style={{ color: '#666' }}>Finished: {fmt(p.finish_date)}</CustomText>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </View>
      {/* Time window */}
      <Text style={{ marginTop: 12, fontWeight: '600' }}>Schedule</Text>
      <Text>Starts: {fmt(challenge.start_date)}</Text>
      <Text>Ends:   {fmt(challenge.end_date)}</Text>

      {/* Location */}
      <Text style={{ marginTop: 12, fontWeight: '600' }}>Location</Text>
      <Text>{challenge.location || '—'}</Text>
      {(challenge.latitude != null && challenge.longitude != null) && (
        <Text>Lat/Lon: {challenge.latitude}, {challenge.longitude}</Text>
      )}

      {/* Age limits */}
      <Text style={{ marginTop: 12, fontWeight: '600' }}>Age Limits</Text>
      <Text>Min: {challenge.min_age ?? '—'}   Max: {challenge.max_age ?? '—'}</Text>

      {/* Description */}
      <Text style={{ marginTop: 12, fontWeight: '600' }}>Description</Text>
      <Text style={{ marginTop: 4 }}>{challenge.description || '—'}</Text>

      {/* Personal progress if joined */}
      {participant && (
        <>
          <Text style={{ marginTop: 12, fontWeight: '600' }}>Your Progress</Text>
          <Text>Current: {participant.current_value} / {challenge.target_value} {challenge.unit || ''}</Text>
          {participant.finish_date && <Text>Finished at: {fmt(participant.finish_date)}</Text>}
          <Text>Last updated: {fmt(participant.last_updated)}</Text>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8a2e2e',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, marginTop: -2 },
  modalWrap: { flex: 1, padding: 16, backgroundColor: '#fff' },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: '#8a2e2e' },
  input: {
    borderWidth: 1,
    borderColor: '#b46d6d',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  pickBtn: {
    borderWidth: 1,
    borderColor: '#b46d6d',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  pickBtnText: { color: '#8a2e2e' },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  btnSecondary: { borderWidth: 1, borderColor: '#b46d6d' },
  btnSecondaryText: { color: '#8a2e2e' },
  btnPrimary: { backgroundColor: '#8a2e2e' },
  btnPrimaryText: { color: '#fff', fontWeight: '600' },
});

export default Challenges;