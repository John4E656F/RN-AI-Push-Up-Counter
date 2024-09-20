import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Circle, Line } from '@shopify/react-native-skia';

type Keypoints = [number, number][];

type PoseOverlayProps = {
  keypoints: Keypoints;
};

const getConnections = (keypoints: Keypoints): [number, number][] => [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [0, 8],
  [8, 9],
  [9, 10],
  [11, 12],
  [12, 13],
  [13, 14],
  [11, 15],
  [15, 16],
];

const PoseOverlay = ({ keypoints }: PoseOverlayProps) => {
  const canvasWidth = Dimensions.get('window').width;
  const canvasHeight = Dimensions.get('window').height;
  console.log('Canvas Dimensions:', { canvasWidth, canvasHeight });
  console.log('Keypoints:', keypoints);
  const connections = getConnections(keypoints);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill}>
        {connections.map(([start, end], index) => {
          const [x1, y1] = keypoints[start] || [0, 0];
          const [x2, y2] = keypoints[end] || [0, 0];
          return <Line key={index} p1={{ x: x1, y: y1 }} p2={{ x: x2, y: y2 }} strokeWidth={2} color='red' />;
        })}
        {keypoints.map(([x, y], index) => (
          <Circle key={index} cx={x} cy={y} r={5} color='red' />
        ))}
      </Canvas>
    </View>
  );
};

export default PoseOverlay;
