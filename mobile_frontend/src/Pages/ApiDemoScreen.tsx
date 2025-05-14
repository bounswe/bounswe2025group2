import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';

const BACKEND_URL = 'http://10.0.2.2:8000/api/cats/fact/'; // Android emulator

const ApiDemoScreen: React.FC = () => {
  const [fact, setFact] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchFact = async () => {
    setLoading(true);
    try {
      const response = await fetch(BACKEND_URL);
      const data = await response.json();
      if (data.fact) {
        setFact(data.fact);
      } else {
        setFact('No fact available');
      }
    } catch (error) {
      console.error('Error fetching cat fact:', error);
      setFact('Failed to fetch fact from our server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFact();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Random Cat Fact</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <View style={styles.factContainer}>
          <Text style={styles.fact}>{fact}</Text>
        </View>
      )}
      <Button 
        title="Get Another Fact" 
        onPress={fetchFact} 
        color="#4CAF50"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  factContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginVertical: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fact: {
    fontSize: 18,
    textAlign: 'center',
    color: '#555',
    lineHeight: 26,
  },
});

export default ApiDemoScreen; 