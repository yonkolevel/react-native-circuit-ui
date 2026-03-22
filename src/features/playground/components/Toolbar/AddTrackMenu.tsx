import { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '../../../../components/Text';
import { useTheme } from '../../../../theme';
import type { InstrumentType } from '../../types';
import { Icon, Icons } from '../../../../components/SFSymbol';

/** Matches Swift AddTrackMenuView — SF Symbol → Lucide mapping */
const TRACK_OPTIONS: { type: InstrumentType; label: string; icon: any }[] = [
  { type: 'drum', label: 'Drum Track', icon: Icons.drumTrack },        // square.grid.2x2
  { type: 'melodic', label: 'Melodic Track', icon: Icons.melodicTrack },    // music.quarternote.3
  { type: 'bass', label: 'Bass Track', icon: Icons.bassTrack },          // music.quarternote.3 (same as melodic in Swift)
  { type: 'audio', label: 'Audio Track', icon: Icons.audioTrack },           // mic.fill
];

export interface AddTrackMenuProps {
  onSelect?: (type: InstrumentType) => void;
  onClose?: () => void;
}

export const AddTrackMenu = memo(function AddTrackMenu({ onSelect, onClose: _onClose }: AddTrackMenuProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.mcBlack3 }]}
      accessibilityLabel="Add track">
      <Text variant="h5" uppercase color={colors.mcWhite3} style={styles.title}>Add Track</Text>

      {TRACK_OPTIONS.map(opt => (
        <Pressable key={opt.type} onPress={() => onSelect?.(opt.type)}
          style={[styles.option, { backgroundColor: colors.mcWhite4 }]}
          accessibilityRole="button" accessibilityLabel={`Add ${opt.label}`}>
          <Icon icon={opt.icon} size={18} color={colors.mcWhite} />
          <Text variant="label" color={colors.mcWhite}>{opt.label}</Text>
        </Pressable>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16 },
  title: { textAlign: 'center', paddingTop: 8 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 6,
  },
});
