import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const Motivation = () => {
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifLoading, setGifLoading] = useState(true);
  const [gifError, setGifError] = useState(false);

  const fetchGif = async () => {
    setGifLoading(true);
    setGifError(false);
    try {
      const response = await fetch('http://10.0.2.2:8000/api/fitness-gifs/');
      if (response.ok) {
        const data = await response.json();
        setGifUrl(data.url);
      } else {
        setGifError(true);
      }
    } catch (error) {
      setGifError(true);
    } finally {
      setGifLoading(false);
    }
  };

  useEffect(() => {
    fetchGif();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Motivational Gif</Text>
      {gifLoading ? (
        <View style={styles.gifBox}>
          <ActivityIndicator size="large" color="#800000" />
        </View>
      ) : gifError ? (
        <View style={styles.gifBox}>
          <Text style={{ color: '#800000' }}>Could not load motivational gif.</Text>
          <TouchableOpacity onPress={fetchGif} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : gifUrl && (
        <View style={styles.gifBox}>
          <WebView
            source={{ uri: gifUrl }}
            style={styles.webview}
            originWhitelist={["*"]}
            javaScriptEnabled={true}
            allowsFullscreenVideo={true}
            startInLoadingState={true}
            renderLoading={() => <ActivityIndicator size="large" color="#800000" style={{marginTop: 40}} />}
            accessibilityLabel="Motivational Gif"
            automaticallyAdjustContentInsets={true}
            scrollEnabled={false}
          />
          <TouchableOpacity onPress={fetchGif} style={styles.retryButton}>
            <Text style={styles.retryText}>Show Another</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#800000',
  },
  gifBox: {
    width: 320,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 8,
  },
  webview: {
    width: 300,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#800000',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Motivation;