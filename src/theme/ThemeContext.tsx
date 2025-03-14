import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { colors } from './colors';
import { typography } from './typography';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  colors: typeof colors.light & typeof colors.dark;
  typography: typeof typography;
}

const defaultContext: ThemeContextType = {
  mode: 'system',
  isDark: false,
  setMode: () => {},
  colors: colors.light,
  typography: typography,
};

export const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialMode = 'system',
}) => {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  const isDark =
    mode === 'system' ? systemColorScheme === 'dark' : mode === 'dark';

  const baseColors = { ...colors.light, ...colors.dark };
  const themeColors = isDark ? colors.dark : colors.light;
  const currentColors = { ...baseColors, ...themeColors };

  const themeContext: ThemeContextType = {
    mode,
    isDark,
    setMode,
    colors: currentColors,
    typography,
  };

  return (
    <ThemeContext.Provider value={themeContext}>
      {children}
    </ThemeContext.Provider>
  );
};
