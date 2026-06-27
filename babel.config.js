module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Firebase and some other ESM packages use import.meta (e.g. import.meta.url).
      // Metro outputs a classic script (not <script type="module">), so import.meta
      // causes a SyntaxError at runtime. This plugin rewrites all import.meta.*
      // references to safe CommonJS equivalents before the bundle is written.
      'babel-plugin-transform-import-meta',
    ],
  };
};
