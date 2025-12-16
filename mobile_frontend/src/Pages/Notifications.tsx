import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';

const { useFocusEffect } = require('@react-navigation/native');
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

import { useTheme } from '../context/ThemeContext';

// ──────────────────────────────────────────────────────────────────────────────
// 📋 Type Definitions
// ──────────────────────────────────────────────────────────────────────────────

interface Notification {
  id: number;
  message: string;
  created_at: string;   // ISO timestamp
  is_read: boolean;
}

// ──────────────────────────────────────────────────────────────────────────────
// 🌐 API Configuration
// ──────────────────────────────────────────────────────────────────────────────

import { API_URL } from '../constants/api';

/**
 * Extracts the origin (base URL) for Referer header
 */
const getOrigin = (): string => {
  return API_URL.replace(/\/api\/?$/, '');
};

/**
 * Retrieves CSRF token stored locally if available.
 */
const getCSRFToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('@csrf_token');
    return token || null;
  } catch (error) {
    console.error('Failed to read CSRF token from storage:', error);
    return null;
  }
};

/**
 * Parses a Response body safely, returning JSON if possible or raw text/null.
 */
const parseJsonOrText = async (res: Response) => {
  const raw = await res.text();
  try { return JSON.parse(raw); } catch { return raw || null; }
};

// ──────────────────────────────────────────────────────────────────────────────
// 🔐 CSRF Utilities (robust for Android emulator)
// ──────────────────────────────────────────────────────────────────────────────

const MIN_CSRF_LEN = 32;

// Try to load csrftoken from AsyncStorage or CookieManager if available
const getCsrfToken = async (): Promise<string | null> => {
  // 1) From AsyncStorage (app-managed)
  const fromStore = (await AsyncStorage.getItem('@csrf_token')) || null;
  if (fromStore && fromStore.length >= MIN_CSRF_LEN) return fromStore;

  // 2) From cookie jar (if @react-native-cookies/cookies is installed)
  try {
    const CookieManager = require('@react-native-cookies/cookies');
    const cookies = await CookieManager.get(API_URL);
    const cookieVal = cookies?.csrftoken?.value ?? cookies?.csrftoken;
    if (cookieVal && String(cookieVal).length >= MIN_CSRF_LEN) {
      return String(cookieVal);
    }
  } catch {
    // CookieManager optional; ignore if missing
  }

  return null;
};

// Ensure we have a valid CSRF token; if not, bootstrap it by hitting a safe GET
// Adjust the URL to whatever endpoint sets the csrftoken cookie in your app:
const ensureCsrfToken = async (): Promise<string> => {
  let token = await getCsrfToken();
  if (token && token.length >= MIN_CSRF_LEN) return token;

  // Attempt to prime the cookie jar (choose one that sets csrftoken):
  const bootstrapCandidates = [
    `${API_URL}csrf/`,
    `${API_URL}auth/session/`,
    `${API_URL}auth/user/`,
    `${API_URL}`,
  ];

  const origin = getOrigin();
  for (const url of bootstrapCandidates) {
    try {
      await fetch(url, { 
        method: 'GET', 
        credentials: 'include',
        headers: {
          'Referer': origin,
        },
      });
      token = await getCsrfToken();
      if (token && token.length >= MIN_CSRF_LEN) return token;
    } catch { /* ignore and try next */ }
  }

  throw new Error(
    'CSRF bootstrap failed: Could not obtain a valid csrftoken. ' +
    'Make sure the backend exposes a GET that sets the csrftoken cookie and that CORS/CSRF trusts http://10.0.2.2.'
  );
};

// Compose headers with valid CSRF; if token is missing/short, we fetch/refresh it.
const buildAuthHeaders = async () => {
  const token = await ensureCsrfToken();
  const origin = getOrigin();
  return {
    'Content-Type': 'application/json',
    'Referer': origin,
    'X-CSRFToken': token,
  } as const;
};

const throwDetailed = async (res: Response, method: string, url: string, label: string) => {
  const body = await parseJsonOrText(res);
  throw new Error(
    `${label} (HTTP ${res.status}) at ${method} ${url} → ` +
    (typeof body === 'string' ? body : JSON.stringify(body))
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// 🔧 API Helper Functions
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Fetch list of notifications from the server.
 * - Uses credentials for cookie-based auth
 * - Passes content type and optional CSRF token
 * - Throws a human-readable error on failure
 */
const fetchNotifications = async (): Promise<Notification[]> => {
  const csrfToken = await getCSRFToken();
  const origin = getOrigin();
  const res = await fetch(`${API_URL}notifications/`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Referer': origin,
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
    },
  });

  if (!res.ok) {
    // Ensure response is consumed to avoid console noise
    try { await res.text(); } catch {}
    throw new Error('Failed to fetch notifications');
  }

  const data: Notification[] = await res.json();
  return data;
};

/**
 * Mark a single notification as read on the server with robust fallbacks.
 */
const markAsRead = async (id: number) => {
  const paths = [
    `${API_URL}notifications/${id}/mark-as-read/`,
    `${API_URL}notifications/${id}/mark_as_read/`,
    `${API_URL}notifications/${id}/mark-read/`,
    `${API_URL}notifications/${id}/read/`,
  ];
  const methods: Array<'PATCH' | 'POST'> = ['PATCH', 'POST'];

  for (const url of paths) {
    for (const method of methods) {
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: await buildAuthHeaders(),
      });
      if (res.ok) {
        try { return await res.json(); } catch { return { success: true }; }
      }
      if (res.status === 404 || res.status === 405) continue;
      await throwDetailed(res, method, url, 'Mark-one failed');
    }
  }
  throw new Error('Mark-one endpoint not found or method not allowed. Verify path/method and trailing slash.');
};

/**
 * Mark all notifications as read with robust fallbacks.
 */
const markAllAsRead = async () => {
  const paths = [
    // Common hyphen/underscore variants
    `${API_URL}notifications/mark-all-as-read/`,
    `${API_URL}notifications/mark_all_as_read/`,
    `${API_URL}notifications/mark_all_read/`,
    // Additional real-world variants observed across codebases
    `${API_URL}notifications/mark-all-read/`,
    `${API_URL}notifications/mark_all_read/`,
    `${API_URL}notifications/mark-read-all/`,
    `${API_URL}notifications/mark_read_all/`,
    `${API_URL}notifications/read-all/`,
    `${API_URL}notifications/read_all/`,
  ];
  const methods: Array<'POST' | 'PATCH'> = ['POST', 'PATCH'];

  for (const url of paths) {
    for (const method of methods) {
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: await buildAuthHeaders(),
        // Some backends expect an object body even if unused
        body: JSON.stringify({}),
      });
      if (res.ok) {
        try { return await res.json(); } catch { return { success: true }; }
      }
      if (res.status === 404 || res.status === 405) continue;
      await throwDetailed(res, method, url, 'Mark-all failed');
    }
  }
  throw new Error('Mark-all endpoint not found or method not allowed. Check path/method and trailing slash.');
};

// ──────────────────────────────────────────────────────────────────────────────
// 📬 Notification Item Component
// ──────────────────────────────────────────────────────────────────────────────

const NotificationItem = ({ item, onPress }: { item: Notification; onPress: () => void }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.notification,
        {
          backgroundColor: colors.navBar,
          borderColor: colors.border,
          shadowColor: colors.border,
        },
        item.is_read ? styles.read : [styles.unread, { borderColor: colors.active }],
      ]}
      onPress={onPress}
    >
      <Text style={[styles.message, { color: colors.text }]}>
        {item.message}
      </Text>

      <Text style={[styles.date, { color: colors.subText }]}>
        {new Date(item.created_at).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// 📱 Main Screen Component: Notifications
// ──────────────────────────────────────────────────────────────────────────────

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  // Loads notifications from the backend and updates local state
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh data whenever screen gains focus
  useFocusEffect(useCallback(() => { loadNotifications(); }, [loadNotifications]));

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  // Handle tap on a notification to mark as read
  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to mark notification as read');
    }
  };

  // Mark all notifications as read from header action
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to mark all notifications as read');
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.active} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>        
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.navBar, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>

        <TouchableOpacity onPress={handleMarkAllAsRead}>
          <Text style={[styles.markAll, { color: colors.mentionText }]}>            
            Mark all as read
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notification List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <NotificationItem item={item} onPress={() => handleMarkAsRead(item.id)} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.active}
            colors={[colors.active]}
          />
        }
        ListEmptyComponent={
          <Text
            style={[
              styles.empty,
              {
                color: colors.text,
                backgroundColor: colors.navBar,
                borderColor: colors.border,
              },
            ]}
          >
            No notifications
          </Text>
        }
      />
    </View>
  );
};

export default Notifications;

// ──────────────────────────────────────────────────────────────────────────────
// 🎨 Styles
// ──────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  markAll: { fontWeight: 'bold', fontSize: 16 },
  notification: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  message: { fontSize: 16, fontWeight: 'bold' },
  date: { fontSize: 13, marginTop: 4 },
  read: { opacity: 0.6 },
  unread: { borderWidth: 2 },
  empty: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 18,
    fontWeight: 'bold',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});