import React, { useEffect, useState, useMemo } from 'react';
import { Dimensions, StatusBar, StyleSheet, Text, View, Platform } from 'react-native';
import { TensorflowModel, useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { Camera, useCameraDevice, useSkiaFrameProcessor } from 'react-native-vision-camera';
import { PaintStyle, Skia } from '@shopify/react-native-skia';
import { getBestFormat } from '../lib/formatFilter';

const keypoints = [
  'nose',
  'leftEye',
  'rightEye',
  'leftEar',
  'rightEar',
  'leftShoulder',
  'rightShoulder',
  'leftElbow',
  'rightElbow',
  'leftWrist',
  'rightWrist',
  'leftHip',
  'rightHip',
  'leftKnee',
  'rightKnee',
  'leftAnkle',
  'rightAnkle',
];

const LINE_WIDTH = 5;
const CIRCLE_RADIUS = 8;
const MIN_CONFIDENCE = 0.45;

const VIEW_WIDTH = Dimensions.get('screen').width;

export default function App() {
  const [hasPermission, setHasPermission] = useState(false);
  const [position, setPosition] = useState<'back' | 'front'>('front');
  const device = useCameraDevice(position);
  const { resize } = useResizePlugin();

  const delegate = Platform.OS === 'ios' ? 'core-ml' : undefined;
  const plugin = useTensorflowModel(require('../assets/pose-detection-fast.tflite'), delegate);
  const format = useMemo(() => (device != null ? getBestFormat(device, 720, 1000) : undefined), [device]);
  const pixelFormat = Platform.OS === 'ios' ? 'rgb' : 'yuv';

  useEffect(() => {
    Camera.requestCameraPermission().then((p) => setHasPermission(p === 'granted'));
  }, []);

  const inputTensor = plugin.model?.inputs[0];
  const inputWidth = inputTensor?.shape[1] ?? 0;
  const inputHeight = inputTensor?.shape[2] ?? 0;

  // Scaling for correct drawing on canvas
  const SCALE = (format?.videoWidth ?? VIEW_WIDTH) / VIEW_WIDTH;

  // Paint for drawing lines and circles
  const paint = Skia.Paint();
  paint.setStyle(PaintStyle.Fill);
  paint.setStrokeWidth(LINE_WIDTH * SCALE);
  paint.setColor(Skia.Color('white'));

  const circlePaint = Skia.Paint();
  circlePaint.setStyle(PaintStyle.Fill);
  circlePaint.setColor(Skia.Color('red'));

  const rotation = Platform.OS === 'ios' ? '0deg' : '270deg'; // correct orientation for Android

  // First test: Static circle to ensure Skia is drawing correctly
  const frameProcessor = useSkiaFrameProcessor(
    (frame) => {
      'worklet';
      // Draw a static red circle at (100, 100) for testing
      frame.drawCircle(100, 100, CIRCLE_RADIUS * SCALE, circlePaint);
      console.log('Static circle drawn');

      // Uncomment the below code to test keypoint drawing after verifying static drawing works
      /*
      if (plugin.model != null) {
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
        const output = outputs[0];

        const frameWidth = frame.width;
        const frameHeight = frame.height;

        // Draw a single keypoint (e.g., 'nose')
        const confidence = output[2]; // nose confidence
        if (confidence > MIN_CONFIDENCE) {
          const x = Number(output[1]) * frameWidth; // nose x-coordinate
          const y = Number(output[0]) * frameHeight; // nose y-coordinate

          console.log(`Nose keypoint detected at (${x}, ${y})`);

          frame.drawCircle(x, y, CIRCLE_RADIUS * SCALE, circlePaint);
        }
      }
      */
    },
    [circlePaint],
  );

  const flipCamera = () => setPosition((p) => (p === 'back' ? 'front' : 'back'));

  return (
    <View style={styles.container} onTouchEnd={flipCamera}>
      <StatusBar barStyle='light-content' />
      {!hasPermission && <Text style={styles.text}>No Camera Permission.</Text>}
      {hasPermission && device != null && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          frameProcessor={frameProcessor}
          format={format}
          pixelFormat={pixelFormat}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  text: {
    color: 'red',
    fontSize: 20,
  },
});
