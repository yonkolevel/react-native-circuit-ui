/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  modulePathIgnorePatterns: [
    '<rootDir>/example/node_modules',
    '<rootDir>/lib/',
  ],
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/src/__mocks__/svgMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-svg|lucide-react-native)/)',
  ],
  projects: [
    {
      // Default unit/integration test project
      displayName: 'unit',
      preset: 'react-native',
      setupFiles: ['./jest.setup.js'],
      modulePathIgnorePatterns: [
        '<rootDir>/example/node_modules',
        '<rootDir>/lib/',
      ],
      moduleNameMapper: {
        '\\.svg$': '<rootDir>/src/__mocks__/svgMock.js',
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
      // Visual regression + cross-platform comparison tests — runs separately
      displayName: 'visual',
      preset: 'react-native',
      setupFiles: ['./jest.setup.js'],
      modulePathIgnorePatterns: [
        '<rootDir>/example/node_modules',
        '<rootDir>/lib/',
      ],
      moduleNameMapper: {
        '\\.svg$': '<rootDir>/src/__mocks__/svgMock.js',
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
