const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  return mergeConfig(config, {
    transformer: {
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
    resolver: {
      assetExts: [...config.resolver.assetExts.filter(ext => ext !== 'svg'), 'png', 'jpg', 'jpeg', 'gif'],
      sourceExts: [...config.resolver.sourceExts, 'svg'],
      alias: {
        '@components': path.resolve(__dirname, 'src/components'),
        '@context': path.resolve(__dirname, 'src/context'),
        '@constants': path.resolve(__dirname, 'src/constants'),
        '@assets': path.resolve(__dirname, 'src/assets'),
      },
    },
  });
})();
