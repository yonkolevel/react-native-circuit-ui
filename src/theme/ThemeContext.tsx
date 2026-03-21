/**
 * CircuitUI Theme Provider
 *
 * Provides design tokens to the component tree via React Context.
 * Mirrors SwiftUI @Environment(\.colorScheme) behavior.
 */
import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { colors, type ThemeColors } from './colors';
import { typography, type TypographyVariant } from './typography';
import { spacing, layout, borderRadius, shadows, makeSpacing } from './spacing';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  /** Current mode setting */
  mode: ThemeMode;
  /** Resolved boolean: is the UI currently dark? */
  isDark: boolean;
  /** Switch theme mode */
  setMode: (mode: ThemeMode) => void;
  /** Resolved color tokens for the current mode */
  colors: ThemeColors;
  /** Typography styles */
  typography: Record<TypographyVariant, import('react-native').TextStyle>;
  /** Spacing scale */
  spacing: typeof spacing;
  /** Layout tokens */
  layout: typeof layout;
  /** Border radius tokens */
  borderRadius: typeof borderRadius;
  /** Shadow presets */
  shadows: typeof shadows;
  /** Direct makeSpacing(n) helper */
  makeSpacing: typeof makeSpacing;
}

// ─── Default context (for use outside provider — safe fallback) ─────────────

const defaultContext: ThemeContextType = {
  mode: 'system',
  isDark: true, // Midicircuit defaults to dark
  setMode: () => {},
  colors: colors.dark,
  typography,
  spacing,
  layout,
  borderRadius,
  shadows,
  makeSpacing,
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

// ─── Hook ───────────────────────────────────────────────────────────────────

export const useTheme = (): ThemeContextType => useContext(ThemeContext);

// ─── Provider ───────────────────────────────────────────────────────────────

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Initial theme mode. Defaults to 'dark' (matching Midicircuit brand). */
  initialMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialMode = 'dark',
}) => {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  const isDark =
    mode === 'system' ? systemColorScheme === 'dark' : mode === 'dark';

  const themeColors = isDark ? colors.dark : colors.light;

  // Memoize the full context value to prevent unnecessary re-renders
  const value = useMemo<ThemeContextType>(
    () => ({
      mode,
      isDark,
      setMode,
      colors: themeColors,
      typography,
      spacing,
      layout,
      borderRadius,
      shadows,
      makeSpacing,
    }),
    [mode, isDark, themeColors]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export { ThemeContext };
