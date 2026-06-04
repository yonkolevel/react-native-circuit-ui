/**
 * CircuitUI — React Native Component Library
 *
 * A pixel-perfect port of Midicircuit's SwiftUI design system.
 * Provides themed components, design tokens, and utilities for
 * building React Native apps with the Midicircuit brand identity.
 *
 * @example
 * ```tsx
 * import { ThemeProvider, Button, Text, useTheme } from 'react-native-circuit-ui';
 *
 * function App() {
 *   return (
 *     <ThemeProvider initialMode="dark">
 *       <Text variant="h4">Hello Circuit</Text>
 *       <Button label="Get Started" variant="primary" />
 *     </ThemeProvider>
 *   );
 * }
 * ```
 */

// Theme system
export * from './theme';

// Components
export * from './components';
