/**
 * PlaygroundScreen — prototype connected screen
 * In production, this lives in midicircuit-rn and uses the real songStore.
 */
import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SongView } from '../components/SongView';
import { useTheme } from '../../../theme';
import { createMockSong } from '../mocks';
import type { SongCallbacks } from '../types';

interface Props { onBack?: () => void; }

export const PlaygroundScreen = memo(function PlaygroundScreen({ onBack }: Props) {
  const { colors } = useTheme();
  const mockSong = createMockSong();

  const callbacks: SongCallbacks = {
    onBack,
    onPlay: () => console.log('play'),
    onPause: () => console.log('pause'),
    onNavigate: (dest) => console.log('navigate', dest),
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.mcBlack }]}>
      <SongView song={mockSong} callbacks={callbacks} />
    </View>
  );
});

const styles = StyleSheet.create({ container: { flex: 1 } });
