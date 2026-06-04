/**
 * AppNavigator — Root navigation for the full app
 *
 * Stack: Welcome → Dashboard (tabs) → Playground (DAW)
 *
 * Feature-driven: each feature owns its screens,
 * the navigator just wires them together.
 */
import { memo, useState } from 'react';

// Feature screens
import { WelcomeView } from '../../features/welcome';
import { DashboardScreen } from '../../features/dashboard/screens/DashboardScreen';
import { PlaygroundScreen } from '../../features/playground/screens/PlaygroundScreen';

type Screen = 'welcome' | 'dashboard' | 'playground';

/**
 * Simple stack navigator without react-navigation dependency.
 * Replace with React Navigation / Expo Router when integrating into monorepo.
 */
export const AppNavigator = memo(function AppNavigator() {
  const [screen, setScreen] = useState<Screen>('dashboard');

  switch (screen) {
    case 'welcome':
      return (
        <WelcomeView
          onGetStarted={() => setScreen('dashboard')}
          onSignIn={() => setScreen('dashboard')}
        />
      );

    case 'playground':
      return <PlaygroundScreen onBack={() => setScreen('dashboard')} />;

    case 'dashboard':
    default:
      return (
        <DashboardScreen
          onNavigateToPlayground={() => setScreen('playground')}
        />
      );
  }
});
