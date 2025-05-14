import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';

const ApiDemoScreen = () => {
  const [fact, setFact] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchFact = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://catfact.ninja/fact');
      const data = await res.json();
      setFact(data.fact);
    } catch (e) {
      setFact('Failed to fetch fact.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFact();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Random Cat Fact</Text>
      {loading ? <ActivityIndicator /> : <Text style={styles.fact}>{fact}</Text>}
      <Button title="Get Another Fact" onPress={fetchFact} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  fact: { fontSize: 18, marginVertical: 20, textAlign: 'center' },
});

export default ApiDemoScreen;