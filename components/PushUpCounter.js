import React, { useState, useEffect } from 'react';
import { Camera, CameraType } from 'expo-camera';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

const PushUpCounter = () => {
  const [type, setType] = useState(CameraType.back); // Use CameraType for specifying camera type
  const [permission, requestPermission] = Camera.useCameraPermissions(); // This line seems redundant given the manual permission request below

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        console.log('Camera permission status:', status); // Confirming permission status
      } catch (error) {
        console.error('Error requesting camera permissions:', error);
      }
    })();
  }, []);

  function toggleCameraType() {
    setType((current) => (current === CameraType.back ? CameraType.front : CameraType.back));
  }

  if (!permission || permission.status === 'undetermined') {
    return (
      <View style={styles.container}>
        <Text>Requesting Permissions...</Text>
      </View>
    );
  }

  if (permission.status === 'denied') {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraType}>
            <Text style={styles.text}>Flip Camera</Text>
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    flex: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  button: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 20,
  },
  text: {
    fontSize: 18,
    color: 'black',
  },
});

export default PushUpCounter;
