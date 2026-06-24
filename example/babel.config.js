const path = require('path');
const pkg = require('../packages/ui/package.json');

const libraryRoot = path.resolve(__dirname, '../packages/ui');
const tokensRoot = path.resolve(__dirname, '../packages/tokens');
const librarySource = path.join(libraryRoot, 'src');

module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
    overrides: [
      {
        exclude: /\/node_modules\//,
        plugins: [
          [
            require.resolve('babel-plugin-module-resolver'),
            {
              extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
              alias: {
                'react-native-circuit-ui': path.join(libraryRoot, pkg.source),
                '@circuit-ui/tokens': path.join(tokensRoot, 'src/index.ts'),
              },
            },
          ],
        ],
      },
      {
        include: librarySource,
        presets: [
          [
            require.resolve('react-native-builder-bob/babel-preset'),
            {
              supportsStaticESM: true,
            },
          ],
        ],
      },
    ],
  };
};
