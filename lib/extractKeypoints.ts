import { runOnJS } from 'react-native-reanimated';

// Add 'worklet' keyword to the function
export function extractKeypoints(output: Float32Array): [number, number][] {
  'worklet'; // Ensure this function runs in the worklet context

  const keypoints: [number, number][] = [];
  for (let i = 0; i < output.length; i += 2) {
    keypoints.push([output[i], output[i + 1]]);
  }

  // console.log(keypoints);

  return keypoints;
}
