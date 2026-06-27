const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force Metro to use the package.json "exports" field.
config.resolver.unstable_enablePackageExports = true;

// IMPORTANT: do NOT add "react-native" here. We are bundling a web PWA, and
// Firebase ships separate sub-builds per condition. Having "react-native"
// in the active condition set makes Metro pick firebase/auth's RN build,
// which then prints "INTERNAL ASSERTION FAILED" at runtime in the browser.
config.resolver.unstable_conditionNames = ['browser', 'require', 'default'];

// Metro skips node_modules for Babel by default.
// Firebase and @simplewebauthn ship ESM with `import.meta` which causes a
// SyntaxError in classic scripts. Add them to the transform-include list so
// babel-plugin-transform-import-meta can rewrite those references.
const defaultIgnore = config.transformer.transformIgnorePatterns ?? [
  'node_modules/(?!(react-native|@react-native|expo|@expo).+/)',
];
config.transformer.transformIgnorePatterns = defaultIgnore.map((pattern) => {
  const str = pattern instanceof RegExp ? pattern.source : String(pattern);
  return new RegExp(
    str.replace(
      'node_modules/(?!(',
      'node_modules/(?!(firebase|@firebase|@simplewebauthn|',
    ),
  );
});

module.exports = config;
