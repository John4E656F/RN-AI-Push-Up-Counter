import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as poseDetection from '@tensorflow-models/pose-detection';

let poseModel: poseDetection.PoseDetector | null = null;

export async function initTensorFlow() {
  await tf.ready();
  console.log('TensorFlow.js is ready!');

  poseModel = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);
  console.log('Pose Detection model is ready!');
}

export async function detectPose(imageTensor: tf.Tensor3D) {
  if (!poseModel) {
    throw new Error('Pose model is not initialized');
  }
  const poses = await poseModel.estimatePoses(imageTensor, { flipHorizontal: false });
  return poses;
}
