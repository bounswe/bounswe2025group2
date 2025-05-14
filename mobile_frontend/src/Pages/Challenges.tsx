import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getToken } from "../utils/auth";

const API_BASE = "http://10.0.2.2:8000/api";

const ChallengeTabs = [
  { key: "active", label: "Active" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" }
];

export default function Challenges() {
  const navigation = useNavigation();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [showCreate, setShowCreate] = useState(false);
  const [showProgress, setShowProgress] = useState(null);
  const [progressValue, setProgressValue] = useState("");
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    challenge_type: "Step Count",
    target_value: "",
    unit: "steps",
    location: "",
    start_date: "",
    end_date: ""
  });
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/challenges/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setChallenges(data);
    } catch (e) {
      Alert.alert("Error", "Failed to load challenges");
    }
    setLoading(false);
  };

  const handleJoin = async (challengeId) => {
    setJoining(challengeId);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/challenges/${challengeId}/join/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 201) {
        fetchChallenges();
      } else {
        const err = await res.json();
        Alert.alert("Join Failed", err.detail || "Could not join challenge");
      }
    } catch (e) {
      Alert.alert("Error", "Could not join challenge");
    }
    setJoining(null);
  };

  const handleUpdateProgress = async (challengeId) => {
    setUpdating(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/challenges/${challengeId}/update-progress/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ current_value: Number(progressValue) })
      });
      if (res.status === 200) {
        fetchChallenges();
        setShowProgress(null);
        setProgressValue("");
      } else {
        const err = await res.json();
        Alert.alert("Update Failed", err.detail || "Could not update progress");
      }
    } catch (e) {
      Alert.alert("Error", "Could not update progress");
    }
    setUpdating(false);
  };

  const handleCreateChallenge = async () => {
    setCreating(true);
    try {
      const token = await getToken();
      const body = { ...newChallenge, target_value: Number(newChallenge.target_value) };
      const res = await fetch(`${API_BASE}/challenges/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (res.status === 201) {
        fetchChallenges();
        setShowCreate(false);
        setNewChallenge({
          title: "",
          description: "",
          challenge_type: "Step Count",
          target_value: "",
          unit: "steps",
          location: "",
          start_date: "",
          end_date: ""
        });
      } else {
        const err = await res.json();
        Alert.alert("Create Failed", err.detail || "Could not create challenge");
      }
    } catch (e) {
      Alert.alert("Error", "Could not create challenge");
    }
    setCreating(false);
  };

  const filteredChallenges = challenges.filter((c) => {
    if (activeTab === "active") return c.status === "active";
    if (activeTab === "completed") return c.status === "completed";
    if (activeTab === "upcoming") return new Date(c.start_date) > new Date() && c.status === "active";
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fitness Challenges</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)}>
          <Ionicons name="add-circle" size={32} color="#800000" />
        </TouchableOpacity>
      </View>
      <View style={styles.tabRow}>
        {ChallengeTabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#800000" />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {filteredChallenges.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="trophy" size={48} color="#800000" />
              <Text style={styles.emptyText}>No challenges found.</Text>
            </View>
          ) : (
            filteredChallenges.map(challenge => (
              <View key={challenge.id} style={styles.card}>
                <Text style={styles.cardTitle}>{challenge.title}</Text>
                <Text style={styles.cardDesc}>{challenge.description}</Text>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Type:</Text>
                  <Text style={styles.cardValue}>{challenge.challenge_type}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Target:</Text>
                  <Text style={styles.cardValue}>{challenge.target_value} {challenge.unit}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Dates:</Text>
                  <Text style={styles.cardValue}>{challenge.start_date?.slice(0,10)} - {challenge.end_date?.slice(0,10)}</Text>
                </View>
                <View style={styles.cardActions}>
                  {challenge.joined ? (
                    <>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => setShowProgress(challenge.id)}>
                        <Text style={styles.actionBtnText}>Update Progress</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleJoin(challenge.id)} disabled={joining===challenge.id}>
                      <Text style={styles.actionBtnText}>{joining===challenge.id ? "Joining..." : "Join Challenge"}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
      {/* Create Challenge Modal */}
      <Modal visible={showCreate} animationType="slide" onRequestClose={()=>setShowCreate(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Create Challenge</Text>
          <ScrollView>
            <TextInput style={styles.input} placeholder="Title" value={newChallenge.title} onChangeText={t=>setNewChallenge({...newChallenge,title:t})} />
            <TextInput style={styles.input} placeholder="Description" value={newChallenge.description} onChangeText={t=>setNewChallenge({...newChallenge,description:t})} />
            <TextInput style={styles.input} placeholder="Type (e.g. Step Count)" value={newChallenge.challenge_type} onChangeText={t=>setNewChallenge({...newChallenge,challenge_type:t})} />
            <TextInput style={styles.input} placeholder="Target Value" keyboardType="numeric" value={newChallenge.target_value} onChangeText={t=>setNewChallenge({...newChallenge,target_value:t})} />
            <TextInput style={styles.input} placeholder="Unit (e.g. steps)" value={newChallenge.unit} onChangeText={t=>setNewChallenge({...newChallenge,unit:t})} />
            <TextInput style={styles.input} placeholder="Location (optional)" value={newChallenge.location} onChangeText={t=>setNewChallenge({...newChallenge,location:t})} />
            <TextInput style={styles.input} placeholder="Start Date (YYYY-MM-DD)" value={newChallenge.start_date} onChangeText={t=>setNewChallenge({...newChallenge,start_date:t})} />
            <TextInput style={styles.input} placeholder="End Date (YYYY-MM-DD)" value={newChallenge.end_date} onChangeText={t=>setNewChallenge({...newChallenge,end_date:t})} />
          </ScrollView>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
            <TouchableOpacity style={styles.cancelBtn} onPress={()=>setShowCreate(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createBtn} onPress={handleCreateChallenge} disabled={creating}>
              <Text style={styles.createBtnText}>{creating ? "Creating..." : "Create"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Update Progress Modal */}
      <Modal visible={!!showProgress} animationType="slide" onRequestClose={()=>setShowProgress(null)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Update Progress</Text>
          <TextInput style={styles.input} placeholder="Your current progress" keyboardType="numeric" value={progressValue} onChangeText={setProgressValue} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
            <TouchableOpacity style={styles.cancelBtn} onPress={()=>setShowProgress(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createBtn} onPress={()=>handleUpdateProgress(showProgress)} disabled={updating}>
              <Text style={styles.createBtnText}>{updating ? "Updating..." : "Update"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#800000"
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },
  tabBtn: {
    paddingVertical: 10,
    flex: 1
  },
  tabBtnActive: {
    borderBottomWidth: 3,
    borderBottomColor: "#800000"
  },
  tabText: {
    textAlign: "center",
    color: "#888"
  },
  tabTextActive: {
    color: "#800000",
    fontWeight: "bold"
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#800000"
  },
  cardDesc: {
    color: "#444",
    marginVertical: 4
  },
  cardRow: {
    flexDirection: "row",
    marginTop: 2
  },
  cardLabel: {
    fontWeight: "bold",
    color: "#800000",
    marginRight: 6
  },
  cardValue: {
    color: "#444"
  },
  cardActions: {
    flexDirection: "row",
    marginTop: 12
  },
  actionBtn: {
    backgroundColor: "#800000",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "bold"
  },
  emptyBox: {
    alignItems: "center",
    marginTop: 60
  },
  emptyText: {
    color: "#800000",
    fontSize: 16,
    marginTop: 8
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    justifyContent: "center"
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#800000",
    marginBottom: 16,
    textAlign: "center"
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
  },
  createBtn: {
    backgroundColor: "#800000",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "bold"
  },
  cancelBtn: {
    backgroundColor: "#eee",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24
  },
  cancelBtnText: {
    color: "#800000",
    fontWeight: "bold"
  }
});