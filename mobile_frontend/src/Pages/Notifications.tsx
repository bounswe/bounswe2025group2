import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Alert } from "react-native";
const { useFocusEffect } = require("@react-navigation/native");
const AsyncStorage = require("@react-native-async-storage/async-storage").default;


// Define types for better type safety
interface Notification {
  id: number;
  message: string;
  created_at: string;
  is_read: boolean;
}

const API_BASE_URL = "http://10.0.2.2:8000/api"; // Using Android emulator localhost

const fetchNotifications = async () => {
  const res = await fetch(`${API_BASE_URL}/notifications/`, {
    headers: { 
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch notifications");
  }
  return res.json();
};

const markAsRead = async (id: number) => {
  const csrfToken = await AsyncStorage.getItem('@csrf_token');
  const res = await fetch(`${API_BASE_URL}/notifications/${id}/mark-as-read/`, {
    method: "PATCH",
    headers: { 
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken || ''
    },
    credentials: 'include'
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to mark notification as read");
  }
  return res.json();
};

const markAllAsRead = async () => {
  const csrfToken = await AsyncStorage.getItem('@csrf_token');
  const res = await fetch(`${API_BASE_URL}/notifications/mark-all-as-read/`, {
    method: "PATCH",
    headers: { 
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken || ''
    },
    credentials: 'include'
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to mark all notifications as read");
  }
  return res.json();
};

const NotificationItem = ({ item, onPress }: { item: Notification; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.notification, item.is_read ? styles.read : styles.unread]}
    onPress={onPress}
  >
    <Text style={styles.message}>{item.message}</Text>
    <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
  </TouchableOpacity>
);

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (e) {
      console.error('Failed to load notifications:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      await loadNotifications();
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      await loadNotifications();
    } catch (e) {
      console.error('Failed to mark all notifications as read:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to mark all notifications as read');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" /></View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllAsRead}>
          <Text style={styles.markAll}>Mark all as read</Text>
        </TouchableOpacity>
      </View>
      <FlatList<Notification>
        data={notifications}
        keyExtractor={(item: Notification) => item.id.toString()}
        renderItem={({ item }: { item: Notification }) => (
          <NotificationItem item={item} onPress={() => handleMarkAsRead(item.id)} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No notifications</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#800000"
  },
  title: { fontSize: 28, fontWeight: "bold", color: "#800000", marginBottom: 4 },
  markAll: { color: "#800000", fontWeight: "bold", fontSize: 16 },
  notification: { 
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#800000",
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 8,
    shadowColor: "#800000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  message: { fontSize: 16, color: "#800000", fontWeight: "bold" },
  date: { fontSize: 13, color: "#800000", marginTop: 4 },
  read: { opacity: 0.6 },
  unread: { borderColor: "#800000", borderWidth: 2 },
  empty: { 
    textAlign: "center", 
    marginTop: 32, 
    color: "#800000", 
    fontSize: 18, 
    fontWeight: "bold",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: "#800000"
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f7f7f7" },
});

export default Notifications;