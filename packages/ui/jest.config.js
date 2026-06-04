/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  rootDir: '.',
  setupFiles: ['<rootDir>/jest.setup.js'],
  modulePathIgnorePatterns: [
    '<rootDir>/../../example/node_modules',
    '<rootDir>/lib/',
  ],
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/src/__mocks__/svgMock.js',
    '@circuit-ui/tokens': '<rootDir>/../tokens/src/index',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-svg|lucide-react-native)/)',
  ],
  projects: [
    {
      displayName: 'unit',
      preset: 'react-native',
      setupFiles: ['<rootDir>/jest.setup.js'],
      modulePathIgnorePatterns: [
        '<rootDir>/../../example/node_modules',
        '<rootDir>/lib/',
      ],
      moduleNameMapper: {
        '\\.svg$': '<rootDir>/src/__mocks__/svgMock.js',
        '@circuit-ui/tokens': '<rootDir>/../tokens/src/index',
      },
      transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|react-native-svg|lucide-react-native)/)',
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/__tests__/visual-regression',
        '<rootDir>/src/__tests__/visual-comparison',
      ],
    },
    {
      displayName: 'visual',
      preset: 'react-native',
      setupFiles: ['<rootDir>/jest.setup.js'],
      modulePathIgnorePatterns: [
        '<rootDir>/../../example/node_modules',
        '<rootDir>/lib/',
      ],
      moduleNameMapper: {
        '\\.svg$': '<rootDir>/src/__mocks__/svgMock.js',
        '@circuit-ui/tokens': '<rootDir>/../tokens/src/index',
      },
      transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|react-native-svg|lucide-react-native)/)',
      ],
      testMatch: [
        '<rootDir>/src/__tests__/visual-regression/**/*.test.ts',
        '<rootDir>/src/__tests__/visual-comparison/**/*.test.ts',
      ],
    },
  ],
};
