import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

export async function initTensorFlow() {
  await tf.ready();
  console.log('TensorFlow.js is ready!');
}
