/**
 * PlaygroundsDashboardScreen — example screen for circuit-ui storybook/demo.
 * The real app (midicircuit-rn) has its own dashboard screen.
 */
import { memo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { PlaygroundsDashboard } from '../components/PlaygroundsDashboard';
import { createMockPlaygroundsList } from '../mocks';
import { useTheme } from '../../../theme';

interface Props {
  onNavigateToPlayground?: (id: string) => void;
}

export const PlaygroundsDashboardScreen = memo(function PlaygroundsDashboardScreen({ onNavigateToPlayground }: Props) {
  const { colors } = useTheme();

  const handleSelect = useCallback((id: string) => {
    onNavigateToPlayground?.(id);
  }, [onNavigateToPlayground]);

  return (
    <View style={[styles.container, { backgroundColor: colors.mcBlack }]}>
      <PlaygroundsDashboard
        playgrounds={createMockPlaygroundsList(4)}
        onSelect={handleSelect}
        onCreate={() => {}}
        onMenuPress={() => {}}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
});
