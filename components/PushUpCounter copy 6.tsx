import React, { useEffect, useState, useMemo } from 'react';
import { Dimensions, TouchableOpacity, StyleSheet, Text, View, Platform, Button } from 'react-native';
import { TensorflowModel, useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { Camera, useCameraDevice, useCameraPermission, useSkiaFrameProcessor } from 'react-native-vision-camera';
import { PaintStyle, Skia, useFont } from '@shopify/react-native-skia';
import { getBestFormat } from '../lib/formatFilter';

function tensorToString(tensor: TensorflowModel['inputs'][number]): string {
  return `${tensor.dataType} [${tensor.shape}]`;
}

const LINE_WIDTH = 5;
const EMOJI_SIZE = 50;
const MIN_CONFIDENCE = 0.45;

const VIEW_WIDTH = Dimensions.get('screen').width;

export default function App() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const device = useCameraDevice(facing);
  const { resize } = useResizePlugin();

  const delegate = Platform.OS === 'ios' ? 'core-ml' : undefined;
  const plugin = useTensorflowModel(require('../assets/pose-detection-fast.tflite'), delegate);
  const format = useMemo(() => (device != null ? getBestFormat(device, 720, 1000) : undefined), [device]);
  console.log(format?.videoWidth, format?.videoHeight);

  const pixelFormat = Platform.OS === 'ios' ? 'rgb' : 'yuv';

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

  const paint = Skia.Paint();
  paint.setStyle(PaintStyle.Fill);
  paint.setStrokeWidth(LINE_WIDTH * SCALE);
  paint.setColor(Skia.Color('white'));

  const lines = [
    // left shoulder -> elbow
    5, 7,
    // right shoulder -> elbow
    6, 8,
    // left elbow -> wrist
    7, 9,
    // right elbow -> wrist
    8, 10,
    // left hip -> knee
    11, 13,
    // right hip -> knee
    12, 14,
    // left knee -> ankle
    13, 15,
    // right knee -> ankle
    14, 16,

    // left hip -> right hip
    11, 12,
    // left shoulder -> right shoulder
    5, 6,
    // left shoulder -> left hip
    5, 11,
    // right shoulder -> right hip
    6, 12,
  ];

  const emojiFont = useFont(require('../assets/NotoEmoji-Medium.ttf'), EMOJI_SIZE * SCALE, (e) => console.error(e));

  const fillColor = Skia.Color('transparent');
  const fillPaint = Skia.Paint();
  // fillPaint.setColor(fillColor);

  const rotation = Platform.OS === 'ios' ? '0deg' : '270deg'; // hack to get android oriented properly

  const frameProcessor = useSkiaFrameProcessor(
    (frame) => {
      'worklet';

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

        const rect = Skia.XYWHRect(0, 0, frameWidth, frameHeight);
        frame.drawRect(rect, fillPaint);

        for (let i = 0; i < lines.length; i += 2) {
          const from = lines[i];
          const to = lines[i + 1];

          const confidence = output[from * 3 + 2];
          if (confidence > MIN_CONFIDENCE) {
            frame.drawLine(
              Number(output[from * 3 + 1]) * Number(frameWidth),
              Number(output[from * 3]) * Number(frameHeight),
              Number(output[to * 3 + 1]) * Number(frameWidth),
              Number(output[to * 3]) * Number(frameHeight),
              paint,
            );
          }
        }

        if (emojiFont != null) {
          const faceConfidence = output[2];
          if (faceConfidence > MIN_CONFIDENCE) {
            const noseY = Number(output[0]) * frame.height + EMOJI_SIZE * 0.3;
            const noseX = Number(output[1]) * frame.width - EMOJI_SIZE / 2;
            frame.drawText('😄', noseX, noseY, paint, emojiFont);
          }
        }
      }
    },
    [plugin, paint, emojiFont],
  );

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

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

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        format={format}
        pixelFormat={pixelFormat}
      />
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
