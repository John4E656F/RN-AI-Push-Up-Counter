export function processFrame(frame: any, inputShape: number[]): Float32Array {
  'worklet';
  const width = inputShape[1];
  const height = inputShape[2];

  // Resize the frame to the expected dimensions
  const resizedFrame = frame.resize({ width, height });

  // Normalize the frame: assuming frame is Uint8 and model expects float input
  const normalizedFrame = resizedFrame.map((pixel: number) => pixel / 127.5 - 1);
  console.log('Processed Input:', normalizedFrame);
  // Convert the normalized frame to Float32Array (or appropriate format)
  return new Float32Array(normalizedFrame);
}
