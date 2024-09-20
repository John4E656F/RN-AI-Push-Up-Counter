import React, { useState, useEffect } from 'react';
import { TensorflowModel, useTensorflowModel } from 'react-native-fast-tflite';
import { Button, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { processFrame } from '../lib/processFrame';
import { extractKeypoints } from '../lib/extractKeypoints';
import PoseOverlay from './PoseOverlay';

type Keypoints = [number, number][];

function tensorToString(tensor: TensorflowModel['inputs'][number]): string {
  return `${tensor.dataType} [${tensor.shape}]`;
}

export default function App() {
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice(facing);

  const plugin = useTensorflowModel(require('../assets/pose-detection-fast.tflite'), Platform.OS === 'ios' ? 'core-ml' : undefined);

  // Initialize a keypoints state
  const [keypoints, setKeypoints] = useState<Keypoints>([]);

  const frameProcessor = useFrameProcessor(async (frame) => {
    'worklet';
    // console.log('Frame received:', frame);
    if (!frame.isValid) {
      console.warn('Invalid frame received');
      return;
    }

    if (plugin.model) {
      try {
        const inputTensor = plugin.model.inputs[0];

        console.log('Frame shape:', frame.width, frame.height);
        console.log('Input tensor shape:', inputTensor.shape);

        const processedInput = processFrame(frame, inputTensor.shape);
        console.log('Processed input:', processedInput);

        console.log('Running the model with processed input');
        const output = await plugin.model.run([processedInput]);

        console.log('Model ran successfully:', output);

        // const outputArray = Array.from(output[0] as Float32Array);
        // console.log('Output Array:', outputArray);

        // const detectedKeypoints = extractKeypoints(outputArray);
        // console.log('Detected Keypoints:', detectedKeypoints);

        // setKeypoints(detectedKeypoints);
      } catch (error: any) {
        console.error('Error running model:', error.message, error.stack);
        console.error('Error in frameProcessor:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      }
    }
  }, []);

  useEffect(() => {
    if (plugin.model) {
      console.log(`Model: ${plugin.model.inputs.map(tensorToString)} -> ${plugin.model.outputs.map(tensorToString)}`);
    }
  }, [plugin]);

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title='Grant Permission' />
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Device has no camera</Text>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View style={styles.container}>
      <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} frameProcessor={frameProcessor} pixelFormat='rgb' />
      <PoseOverlay keypoints={keypoints} />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
          <Text style={styles.text}>Flip Camera</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});
