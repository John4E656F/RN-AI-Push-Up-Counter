const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');

// Get default Expo configuration
const defaultConfig = getDefaultConfig(__dirname);

// Define custom configuration
const customConfig = {
  resolver: {
    assetExts: ['tflite', ...defaultConfig.resolver.assetExts],
  },
};

// Merge custom configuration with default configuration
module.exports = mergeConfig(defaultConfig, customConfig);

// const config = getDefaultConfig(__dirname, {
//   isCSSEnabled: true,
//   resolver: {
//     sourceExts: ["jsx", "js", "ts", "tsx", "cjs", "json"]
//   },
// });

// config.resolver.assetExts.push("tflite");
