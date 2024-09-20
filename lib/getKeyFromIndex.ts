export function getKeyFromIndex(index: number): string {
  const keypoints = [
    'nose', // 0
    'leftEye', // 1
    'rightEye', // 2
    'leftEar', // 3
    'rightEar', // 4
    'leftShoulder', // 5
    'rightShoulder', // 6
    'leftElbow', // 7
    'rightElbow', // 8
    'leftWrist', // 9
    'rightWrist', // 10
    'leftHip', // 11
    'rightHip', // 12
    'leftKnee', // 13
    'rightKnee', // 14
    'leftAnkle', // 15
    'rightAnkle', // 16
  ];

  if (index >= 0 && index < keypoints.length) {
    return keypoints[index];
  } else {
    return 'unknown';
  }
}
