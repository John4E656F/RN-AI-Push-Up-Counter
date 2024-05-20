import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera'; // Import Camera only
import * as tf from '@tensorflow/tfjs';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';
import * as posenet from '@tensorflow-models/posenet';
import { initTensorFlow } from '../lib/TensorFlow';

enum MyCameraType {
  FRONT = 'front',
  BACK = 'back',
}

const TensorCamera = cameraWithTensors(Camera as any);

const PushUpCounter = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<any>(null);
  const [model, setModel] = useState<posenet.PoseNet | null>(null);
  const [count, setCount] = useState<number>(0);
  const [isDown, setIsDown] = useState<boolean>(false);
  const [cameraType, setCameraType] = useState<MyCameraType>(MyCameraType.FRONT); // Use MyCameraType

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status === 'granted') {
        await initTensorFlow(); // Initialize TensorFlow
        const loadedModel = await posenet.load(); // Load PoseNet model
        setModel(loadedModel);
      }
    })();
  }, []);

  const handlePoseEstimation = async (tensor: tf.Tensor3D) => {
    if (!model) return;
    const pose = await model.estimateSinglePose(tensor, {
      flipHorizontal: false,
    });

    const keypoints = pose.keypoints;
    const leftShoulder = keypoints.find((k) => k.part === 'leftShoulder');
    const rightShoulder = keypoints.find((k) => k.part === 'rightShoulder');
    const leftHip = keypoints.find((k) => k.part === 'leftHip');
    const rightHip = keypoints.find((k) => k.part === 'rightHip');

    if (leftShoulder && rightShoulder && leftHip && rightHip) {
      const avgShoulderY = (leftShoulder.position.y + rightShoulder.position.y) / 2;
      const avgHipY = (leftHip.position.y + rightHip.position.y) / 2;
      const threshold = 50; // Adjust threshold based on your needs

      if (avgShoulderY > avgHipY + threshold && !isDown) {
        setIsDown(true);
      } else if (avgShoulderY < avgHipY - threshold && isDown) {
        setIsDown(false);
        setCount((prevCount) => prevCount + 1);
      }
    }

    tf.dispose(tensor);
  };

  const toggleCameraType = () => {
    setCameraType((currentType) => (currentType === MyCameraType.FRONT ? MyCameraType.BACK : MyCameraType.FRONT));
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
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        useCustomShadersToResize={false}
        cameraTextureHeight={1920}
        cameraTextureWidth={1080}
        resizeHeight={224}
        resizeWidth={224}
        resizeDepth={3}
        onReady={(images) => {
          const loop = async () => {
            const imageTensor = images.next().value;
            if (imageTensor) {
              await handlePoseEstimation(imageTensor);
            }
            requestAnimationFrame(loop);
          };
          loop();
        }}
        autorender={true}
      />
      <Button title='Flip Camera' onPress={toggleCameraType} />
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
