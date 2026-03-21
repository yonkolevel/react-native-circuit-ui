/**
 * PlaygroundsDashboardScreen — connected to playgroundStore
 */
import { memo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { PlaygroundsDashboard } from '../components/PlaygroundsDashboard';
import { usePlaygroundStore } from '../stores/playgroundStore';
import { useTheme } from '../../../theme';

interface Props {
  onNavigateToPlayground?: (id: string) => void;
}

export const PlaygroundsDashboardScreen = memo(function PlaygroundsDashboardScreen({ onNavigateToPlayground }: Props) {
  const { colors } = useTheme();
  const { playgrounds, isLoading, selectPlayground, createPlayground, deletePlayground } = usePlaygroundStore();

  const handleSelect = useCallback((id: string) => {
    selectPlayground(id);
    onNavigateToPlayground?.(id);
  }, [selectPlayground, onNavigateToPlayground]);

  return (
    <View style={[styles.container, { backgroundColor: colors.mcBlack }]}>
      <PlaygroundsDashboard
        playgrounds={playgrounds}
        isLoading={isLoading}
        onSelect={handleSelect}
        onCreate={createPlayground}
        onMenuPress={deletePlayground}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
});
