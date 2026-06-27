const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude temp extraction folders inside node_modules (e.g. react-native-qrcode-svg)
// that contain non-existent paths and crash the file watcher on Windows.
const blockList = config.resolver.blockList
  ? Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : [config.resolver.blockList]
  : [];

config.resolver.blockList = [
  ...blockList,
  /node_modules\/\.react-native-qrcode-svg-.+\/.*/,
];

module.exports = config;
