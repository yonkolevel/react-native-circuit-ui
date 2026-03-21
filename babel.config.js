module.exports = function (api) {
  api.cache(true);

  // When running under Jest (NODE_ENV=test), use the React Native babel preset
  // which includes babel-plugin-syntax-hermes-parser. This is required to parse
  // RN 0.76's internal Flow mapped-type syntax (e.g. `[K in keyof T]` in
  // EventEmitter.js) that @babel/preset-flow cannot handle.
  //
  // For library builds (via react-native-builder-bob), keep the builder-bob
  // preset which targets the correct output formats (commonjs / module / types).
  if (process.env.NODE_ENV === 'test') {
    return {
      presets: ['module:@react-native/babel-preset'],
    };
  }

  return {
    presets: ['module:react-native-builder-bob/babel-preset'],
  };
};
