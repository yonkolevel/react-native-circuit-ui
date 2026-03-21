/**
 * App — Root entry point
 *
 * Wraps everything in ThemeProvider + SafeAreaView.
 * No react-navigation dependency — uses simple state-based navigation.
 * Replace with Expo Router when integrating into monorepo.
 */
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { ThemeProvider, useTheme } from '../theme';
import { AppNavigator } from './navigation/AppNavigator';

function AppContent() {
  const { colors, isDark } = useTheme();
  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.mcBlack }]}>
        <AppNavigator />
      </SafeAreaView>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider initialMode="dark">
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
