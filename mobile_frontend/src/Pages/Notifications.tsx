import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "../utils/auth";

const API_BASE_URL = "https://your-api-url.com"; // TODO: Replace with actual API base URL

const fetchNotifications = async (token) => {
  const res = await fetch(`${API_BASE_URL}/notifications/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
};

const markAsRead = async (id, token) => {
  await fetch(`${API_BASE_URL}/notifications/${id}/mark-as-read/`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
};

const markAllAsRead = async (token) => {
  await fetch(`${API_BASE_URL}/notifications/mark-all-as-read/`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
};

const NotificationItem = ({ item, onPress }) => (
  <TouchableOpacity
    style={[styles.notification, item.is_read ? styles.read : styles.unread]}
    onPress={onPress}
  >
    <Text style={styles.message}>{item.message}</Text>
    <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
  </TouchableOpacity>
);

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState("");

  const loadToken = async () => {
    const t = await getToken();
    setToken(t);
    return t;
  };

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const t = token || (await loadToken());
      const data = await fetchNotifications(t);
      setNotifications(data);
    } catch (e) {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [token]);

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

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id, token);
      await loadNotifications();
    } catch (e) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(token);
      await loadNotifications();
    } catch (e) {}
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
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <NotificationItem item={item} onPress={() => handleMarkAsRead(item.id)} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No notifications</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  title: { fontSize: 24, fontWeight: "bold" },
  markAll: { color: "#007bff" },
  notification: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#eee" },
  message: { fontSize: 16 },
  date: { fontSize: 12, color: "#888", marginTop: 4 },
  read: { backgroundColor: "#f7f7f7" },
  unread: { backgroundColor: "#e6f0ff" },
  empty: { textAlign: "center", marginTop: 32, color: "#888" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default Notifications;