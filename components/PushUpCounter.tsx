import React, { useState, useEffect, useMemo } from 'react';
import { TensorflowModel, useTensorflowModel } from 'react-native-fast-tflite';
import { Dimensions, Button, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor, useSkiaFrameProcessor } from 'react-native-vision-camera';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { processFrame } from '../lib/processFrame';
import { extractKeypoints } from '../lib/extractKeypoints';
import PoseOverlay from './PoseOverlay';
import { useSharedValue } from 'react-native-reanimated';

import { getBestFormat } from '../lib/formatFilter';

type Keypoints = [number, number][];

function tensorToString(tensor: TensorflowModel['inputs'][number]): string {
  return `${tensor.dataType} [${tensor.shape}]`;
}

const LINE_WIDTH = 5;
const EMOJI_SIZE = 50;
const MIN_CONFIDENCE = 0.45;

const VIEW_WIDTH = Dimensions.get('screen').width;

export default function App() {
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice(facing);
  const { resize } = useResizePlugin();

  const pixelFormat = Platform.OS === 'ios' ? 'rgb' : 'yuv';
  const plugin = useTensorflowModel(require('../assets/pose-detection-fast.tflite'), Platform.OS === 'ios' ? 'core-ml' : undefined);

  const format = useMemo(() => (device != null ? getBestFormat(device, 720, 1000) : undefined), [device]);
  console.log(format?.videoWidth, format?.videoHeight);

  // Initialize a shared value
  const keypoints = useSharedValue<Keypoints>([]);

  useEffect(() => {
    const model = plugin.model;
    if (model == null) {
      return;
    }
    console.log(`Model: ${model.inputs.map(tensorToString)} -> ${model.outputs.map(tensorToString)}`);
  }, [plugin]);

  const inputTensor = plugin.model?.inputs[0];
  const inputWidth = inputTensor?.shape[1] ?? 0;
  const inputHeight = inputTensor?.shape[2] ?? 0;
  if (inputTensor != null) {
    console.log(`Input: ${inputTensor.dataType} ${inputWidth} x ${inputHeight}`);
  }

  // to get from px -> dp since we draw in the camera coordinate system
  const SCALE = (format?.videoWidth ?? VIEW_WIDTH) / VIEW_WIDTH;

  const rotation = Platform.OS === 'ios' ? '0deg' : '270deg';

  const frameProcessor = useSkiaFrameProcessor(async (frame) => {
    'worklet';
    frame.render();
    // if (!frame.isValid) {
    //   console.warn('Invalid frame received');
    //   return;
    // }
    // frame.render();

    if (plugin.model) {
      try {
        // const inputTensor = plugin.model.inputs[0];
        // const processedInput = processFrame(frame, inputTensor.shape);
        const smaller = resize(frame, {
          scale: {
            width: inputWidth,
            height: inputHeight,
          },
          pixelFormat: 'rgb',
          dataType: 'uint8',
          rotation: rotation,
        });

        const outputs = plugin.model.runSync([smaller]);

        // console.log('Model Output:', output);

        // const outputArray = Array.from(output[0] as Float32Array);
        // console.log('Output Array:', outputArray);

        // const detectedKeypoints = extractKeypoints(outputArray);
        // console.log('Detected Keypoints:', detectedKeypoints);

        // Update shared value correctly
        // keypoints.value = detectedKeypoints;
      } catch (error) {
        console.error('Error in frameProcessor:', error);
      }
    }
  }, []);

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
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        pixelFormat={pixelFormat}
        outputOrientation='preview'
        photoQualityBalance='speed'

        // isMirrored={true}
      />
      {/* <PoseOverlay keypoints={keypoints} /> */}
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
