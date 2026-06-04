module.exports = function (api) {
  api.cache(true);

  if (process.env.NODE_ENV === 'test') {
    return {
      presets: ['module:@react-native/babel-preset'],
    };
  }

  return {
    presets: ['module:react-native-builder-bob/babel-preset'],
  };
};
