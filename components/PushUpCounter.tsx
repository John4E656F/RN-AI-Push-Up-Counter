// components/PushUpCounter.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';
import * as posenet from '@tensorflow-models/posenet';
import { loadModel } from '../lib/TensorFlow'; // (optional, if needed for future models)

const TensorCamera = cameraWithTensors(Camera);

const PushUpCounter = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const cameraRef = useRef(null);
  const [model, setModel] = useState(null);
  const [count, setCount] = useState(0);
  const [cameraType, setCameraType] = useState(CameraType.front); // Initialize with front camera

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status === 'granted') {
        const model = await posenet.load(); // Load PoseNet model
        setModel(model);
      }
    })();
  }, []);

  const handlePoseEstimation = async (tensor: tf.Tensor3D) => {
    if (!model) return;
    const poses = await model.estimatePoses(tensor.reshape([1, 224, 224, 3]));
    // Analyze poses for push-up detection
    const pose = poses[0]; // Assuming single person detection
    const shoulderY = pose.keypoints[5].y; // Shoulder keypoint y-coordinate
    const hipY = pose.keypoints[8].y; // Hip keypoint y-coordinate
    const threshold = 50; // Adjust threshold based on your needs

    if (shoulderY - hipY > threshold) {
      // If distance between shoulder and hip is large (push-up down)
      setCount(count + 1);
    } else {
      // Check for "up" position based on other keypoints or previous state
      // You can implement logic to check for transition from down to up for a complete push-up
    }
  };

  const toggleCameraType = () => {
    setCameraType((currentType) => (currentType === CameraType.front ? CameraType.back : CameraType.front));
  };

  if (hasPermission === null) {
    return <Text>Requesting Camera Permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <Text>Push-up Counter: {count}</Text>
      <TensorCamera
        ref={(camera) => {
          cameraRef.current = camera as any;
        }}
        style={styles.camera}
        type={cameraType}
        useCustomShadersToResize={false}
        cameraTextureHeight={1920}
        cameraTextureWidth={1080}
        resizeHeight={224}
        resizeWidth={224}
        resizeDepth={3}
        onReady={(images, updateCameraPreview, gl, cameraTexture) => {
          const imageTensor = images.next().value;
          if (imageTensor) {
            handlePoseEstimation(imageTensor);
          }
        }}
        autorender={true}
      />
      <Button title='Flip Camera' onPress={toggleCameraType} />
      <Button
        title='Take Picture'
        onPress={() => {
          // Trigger pose estimation or other actions (optional)
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  camera: {
    width: 200,
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PushUpCounter;
