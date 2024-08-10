import { useAnimatedStyle, withSpring, AnimatedStyle } from 'react-native-reanimated';

// Define a type for the position value with x and y coordinates
interface Position {
  x: number;
  y: number;
}

// Define a type for the pose object
interface Pose {
  value: {
    [key: string]: Position; // Use index signature for dynamic keys
  };
}

// Define the hook with typed parameters
export const usePosition = (pose: Pose, valueName1: string, valueName2: string): AnimatedStyle<any> => {
  return useAnimatedStyle(
    () => ({
      // Ensure that pose.value[valueName1] and pose.value[valueName2] are valid keys
      transform: [
        {
          translateX: pose.value[valueName1]?.x ?? 0,
        },
        {
          translateY: pose.value[valueName1]?.y ?? 0,
        },
      ],
      // Example of how to handle two sets of coordinates
      // Adjust based on your needs for x2, y2
    }),
    [pose],
  );
};
