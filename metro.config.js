const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = {};

module.exports = withNativeWind(getDefaultConfig(__dirname), { input: './global.css' });
