const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');
const { getConfig } = require('react-native-builder-bob/metro-config');
const pkg = require('../packages/ui/package.json');

const root = path.resolve(__dirname, '../packages/ui');
const repoRoot = path.resolve(__dirname, '..');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getConfig(getDefaultConfig(__dirname), {
  root,
  pkg,
  project: __dirname,
});

config.server = {
  ...config.server,
  port: 8083,
};

const defaultResolveRequest = config.resolver?.resolveRequest;

// Allow Metro to resolve workspace packages hoisted to root node_modules
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...(config.resolver.extraNodeModules ?? {}),
    'react-native-circuit-ui': path.resolve(repoRoot, 'packages/ui/src'),
    '@circuit-ui/tokens': path.resolve(repoRoot, 'packages/tokens/src'),
  },
  nodeModulesPaths: [
    path.resolve(repoRoot, 'node_modules'),
    path.resolve(__dirname, 'node_modules'),
  ],
  resolveRequest(context, moduleName, platform) {
    if (moduleName === 'react-native-circuit-ui') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(repoRoot, 'packages/ui/src/index.tsx'),
      };
    }

    if (moduleName === '@circuit-ui/tokens') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(repoRoot, 'packages/tokens/src/index.ts'),
      };
    }

    const resolver = defaultResolveRequest ?? context.resolveRequest;
    return resolver(context, moduleName, platform);
  },
};

// Watch packages/tokens so hot reload works when token values change
config.watchFolders = [
  ...(config.watchFolders ?? []),
  path.resolve(repoRoot, 'packages/tokens'),
  repoRoot,
];

module.exports = config;
