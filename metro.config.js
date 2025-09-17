const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ttf', 'otf', 'woff', 'woff2', 'mp3', 'wav', 'aac', 'm4a'],
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
    resolverMainFields: ['react-native', 'browser', 'main'],
    platforms: ['ios', 'android', 'native', 'web'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        inlineRequires: true,
      },
    }),
  },
  watchFolders: [
    require('path').resolve(__dirname, 'node_modules'),
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);