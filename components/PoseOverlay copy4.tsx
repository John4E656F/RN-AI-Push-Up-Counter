import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { SharedValue, useAnimatedProps, withSpring } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Keypoints = [number, number][];

type PoseOverlayProps = {
  keypoints: SharedValue<Keypoints>;
};

const getConnections = (): [number, number][] => [
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
  const keypointsArray = keypoints.value;

  // Create animated props for lines
  const animatedLines = getConnections().map(([start, end], index) => {
    const animatedProps = useAnimatedProps(() => {
      const [x1, y1] = keypointsArray[start] || [0, 0];
      const [x2, y2] = keypointsArray[end] || [0, 0];

      return {
        x1: withSpring(x1),
        y1: withSpring(y1),
        x2: withSpring(x2),
        y2: withSpring(y2),
      };
    });

    return { key: index, animatedProps };
  });

  // Create animated props for circles
  const animatedCircles = keypointsArray.map(([x, y], index) => {
    const animatedProps = useAnimatedProps(() => ({
      cx: withSpring(x),
      cy: withSpring(y),
      r: 5,
    }));

    return { key: index, animatedProps };
  });

  return (
    <Animated.View style={StyleSheet.absoluteFill}>
      <Svg style={StyleSheet.absoluteFill}>
        {animatedLines.map(({ key, animatedProps }) => (
          <AnimatedLine key={key} animatedProps={animatedProps} stroke='red' strokeWidth='2' />
        ))}
        {animatedCircles.map(({ key, animatedProps }) => (
          <AnimatedCircle key={key} animatedProps={animatedProps} fill='red' />
        ))}
      </Svg>
    </Animated.View>
  );
};

export default PoseOverlay;
