/**
 * DashboardScreen — Tab container for the main app
 */
import { memo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';
import { DashboardTabBar } from '../components/DashboardTabBar';
import type { DashboardTab } from '../types';

// Feature screens
import { PlaygroundsDashboardScreen } from '../../playground/screens/PlaygroundsDashboardScreen';
import { Text } from '../../../components/Text';

interface Props {
  onNavigateToPlayground?: (id: string) => void;
}

export const DashboardScreen = memo(function DashboardScreen({ onNavigateToPlayground }: Props) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<DashboardTab>('playgrounds');

  const renderContent = () => {
    switch (activeTab) {
      case 'playgrounds':
        return <PlaygroundsDashboardScreen onNavigateToPlayground={onNavigateToPlayground} />;
      case 'myCircuits':
        return <Placeholder label="My Circuits" />;
      case 'discover':
        return <Placeholder label="Discover" />;
      case 'profile':
        return <Placeholder label="Profile" />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.mcBlack }]}>
      <View style={styles.content}>{renderContent()}</View>
      <DashboardTabBar
        tabs={['myCircuits', 'discover', 'playgrounds', 'profile']}
        selectedTab={activeTab}
        onTabPress={setActiveTab}
      />
    </View>
  );
});

const Placeholder = memo(function Placeholder({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.placeholder}>
      <Text variant="h4" color={colors.mcWhite3}>{label}</Text>
      <Text variant="body" color={colors.mcWhite4}>Coming soon</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
});
