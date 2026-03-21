import { memo } from 'react';
import { View, Switch, StyleSheet } from 'react-native';
// @ts-ignore - Slider placeholder
const Slider = (p: any) => null;
import { Text } from '../../../../components/Text';
import { useTheme } from '../../../../theme';
import { makeSpacing } from '../../../../theme/spacing';
import type { SongViewState } from '../../types';

export interface SongSettingsProps {
  song: SongViewState;
  onTempoChange?: (bpm: number) => void;
  onToggleMetronome?: () => void;
  onToggleLoop?: () => void;
  onMasterVolumeChange?: (v: number) => void;
}

export const SongSettings = memo(function SongSettings({ song, onTempoChange, onToggleMetronome, onToggleLoop, onMasterVolumeChange }: SongSettingsProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}  accessibilityLabel="Song settings">
      <SettingRow label={`BPM: ${Math.round(song.tempo)}`}>
        <Slider style={styles.slider} minimumValue={40} maximumValue={300} value={song.tempo} step={1}
          onValueChange={onTempoChange} minimumTrackTintColor={colors.mcOrange} maximumTrackTintColor={colors.mcBlack4}
          thumbTintColor={colors.mcOrange} accessibilityLabel="Tempo" />
      </SettingRow>
      <SettingRow label={`Volume: ${Math.round(song.masterVolume)}%`}>
        <Slider style={styles.slider} minimumValue={0} maximumValue={100} value={song.masterVolume} step={1}
          onValueChange={onMasterVolumeChange} minimumTrackTintColor={colors.mcBlue} maximumTrackTintColor={colors.mcBlack4}
          thumbTintColor={colors.mcBlue} accessibilityLabel="Master volume" />
      </SettingRow>
      <SettingRow label="Metronome">
        <Switch value={song.isMetronomeEnabled} onValueChange={onToggleMetronome}
          trackColor={{ false: colors.mcBlack4, true: colors.mcOrange }} />
      </SettingRow>
      <SettingRow label="Loop">
        <Switch value={song.isLoopEnabled} onValueChange={onToggleLoop}
          trackColor={{ false: colors.mcBlack4, true: colors.mcOrange }} />
      </SettingRow>
    </View>
  );
});

const SettingRow = memo(function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.mcBlack4 }]}>
      <Text variant="label" style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowControl}>{children}</View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { paddingVertical: makeSpacing(2) },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: makeSpacing(3), paddingHorizontal: makeSpacing(3), borderBottomWidth: 0.5 },
  rowLabel: { width: 120 },
  rowControl: { flex: 1 },
  slider: { flex: 1, height: 36 },
});
