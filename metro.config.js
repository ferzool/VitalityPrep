const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Metro on web (Expo SDK 54) auto-resolves package.json "exports" with the
// "import" condition, which pulls in ESM builds of zustand that contain
// top-level `import.meta` — a SyntaxError in classic <script> output.
// Force-redirect zustand and its subpaths to their CJS counterparts.
const zustandDir = path.dirname(require.resolve('zustand/package.json'));
const zustandCjsMap = {
  zustand: path.join(zustandDir, 'index.js'),
  'zustand/vanilla': path.join(zustandDir, 'vanilla.js'),
  'zustand/middleware': path.join(zustandDir, 'middleware.js'),
  'zustand/shallow': path.join(zustandDir, 'shallow.js'),
  'zustand/traditional': path.join(zustandDir, 'traditional.js'),
  'zustand/context': path.join(zustandDir, 'context.js'),
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const redirect = zustandCjsMap[moduleName];
  if (redirect) {
    return { type: 'sourceFile', filePath: redirect };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Metro skips node_modules for Babel by default. Whitelist Firebase,
// @simplewebauthn, and zustand so babel-plugin-transform-import-meta can
// rewrite any residual import.meta references.
const defaultIgnore = config.transformer.transformIgnorePatterns ?? [
  'node_modules/(?!(react-native|@react-native|expo|@expo).+/)',
];
config.transformer.transformIgnorePatterns = defaultIgnore.map((pattern) => {
  const str = pattern instanceof RegExp ? pattern.source : String(pattern);
  return new RegExp(
    str.replace(
      'node_modules/(?!(',
      'node_modules/(?!(firebase|@firebase|@simplewebauthn|zustand|',
    ),
  );
});

module.exports = config;
