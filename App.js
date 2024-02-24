import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { initTensorFlow } from './lib/TensorFlow';
import PushUpCounter from './components/PushUpCounter';

export default function App() {
  useEffect(() => {
    initTensorFlow().then(() => {
      console.log('TensorFlow.js initialization complete.');
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text>Testing Screen Render</Text>
      <PushUpCounter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
