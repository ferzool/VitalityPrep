const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force Metro to use the package.json "exports" field.
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = [
  'require',
  'default',
  'browser',
  'react-native',
];

// Metro skips node_modules for Babel by default.
// Firebase and @simplewebauthn ship ESM with `import.meta` which causes a
// SyntaxError in classic scripts. Add them to the transform-include list so
// babel-plugin-transform-import-meta can rewrite those references.
const defaultIgnore = config.transformer.transformIgnorePatterns ?? [
  'node_modules/(?!(react-native|@react-native|expo|@expo).+/)',
];
config.transformer.transformIgnorePatterns = defaultIgnore.map((pattern) => {
  const str = pattern instanceof RegExp ? pattern.source : String(pattern);
  // Inject firebase + simplewebauthn into the existing exclusion group.
  return new RegExp(
    str.replace(
      'node_modules/(?!(',
      'node_modules/(?!(firebase|@firebase|@simplewebauthn|',
    ),
  );
});

module.exports = config;
