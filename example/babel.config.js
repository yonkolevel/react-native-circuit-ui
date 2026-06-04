const path = require('path');
const { getConfig } = require('react-native-builder-bob/babel-config');
const pkg = require('../packages/ui/package.json');

const root = path.resolve(__dirname, '../packages/ui');

module.exports = function (api) {
  api.cache(true);

  return getConfig(
    {
      presets: ['babel-preset-expo'],
      plugins: ['react-native-reanimated/plugin'],
    },
    { root, pkg }
  );
};
