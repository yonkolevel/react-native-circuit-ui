/**
 * SongSettings — matches iOS SongSettingsView layout.
 *
 * All state and actions from useSongContext() — zero callback props.
 *
 * Controls: tempo slider, volume slider, metronome toggle, export buttons.
 */
import { memo, useState } from 'react';
import { View, Switch, Pressable, StyleSheet } from 'react-native';
import { Text } from '../../../../components/Text';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { useTheme } from '../../../../theme';
import { makeSpacing } from '../../../../theme/spacing';
import { useSongContext, useSongActions } from '../../stores/playgroundStore';

// Slider imported dynamically — available when @react-native-community/slider is installed.
let SliderComponent: any = null;
try {
  SliderComponent = require('@react-native-community/slider').default;
} catch {}

export interface SongSettingsProps {
  onExportAudio?: () => void;
  onExportBundle?: () => void;
}

export const SongSettings = memo(function SongSettings({
  onExportAudio,
  onExportBundle,
}: SongSettingsProps) {
  const { colors } = useTheme();

  // State — fine-grained selectors
  const tempo = useSongContext((s) => s.tempo);
  const masterVolume = useSongContext((s) => s.masterVolume);
  const isMetronomeEnabled = useSongContext((s) => s.isMetronomeEnabled);

  // Actions — stable refs, no subscription
  const { setTempo, setMasterVolume, toggleMetronome } = useSongActions();

  // Local display values while dragging (avoids store updates on every frame)
  const [tempoDisplay, setTempoDisplay] = useState<number | null>(null);
  const [volumeDisplay, setVolumeDisplay] = useState<number | null>(null);

  const tempoValue = tempoDisplay ?? tempo;
  const volumeValue = volumeDisplay ?? masterVolume;

  return (
    <View style={styles.container} accessibilityLabel="Song settings">
      {/* Tempo */}
      <SettingRow label="TEMPO" value={`${Math.round(tempoValue)} BPM`}>
        {SliderComponent ? (
          <SliderComponent
            style={styles.slider}
            minimumValue={40}
            maximumValue={240}
            value={tempo}
            step={1}
            onValueChange={setTempoDisplay}
            onSlidingComplete={(v: number) => {
              setTempoDisplay(null);
              setTempo(v);
            }}
            minimumTrackTintColor={colors.mcWhite}
            maximumTrackTintColor={colors.mcBlack4}
            thumbTintColor={colors.mcWhite}
            accessibilityLabel="Tempo"
          />
        ) : (
          <Text variant="label" color={colors.mcWhite}>
            {Math.round(tempoValue)} BPM
          </Text>
        )}
      </SettingRow>

      {/* Volume */}
      <SettingRow label="VOLUME" value={`${Math.round(volumeValue)}%`}>
        {SliderComponent ? (
          <SliderComponent
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            value={masterVolume}
            step={1}
            onValueChange={setVolumeDisplay}
            onSlidingComplete={(v: number) => {
              setVolumeDisplay(null);
              setMasterVolume(v);
            }}
            minimumTrackTintColor={colors.mcWhite}
            maximumTrackTintColor={colors.mcBlack4}
            thumbTintColor={colors.mcWhite}
            accessibilityLabel="Master volume"
          />
        ) : (
          <Text variant="label" color={colors.mcWhite}>
            {Math.round(volumeValue)}%
          </Text>
        )}
      </SettingRow>

      {/* Metronome */}
      <SettingRow label="METRONOME">
        <Switch
          value={isMetronomeEnabled}
          onValueChange={toggleMetronome}
          trackColor={{ false: colors.mcBlack4, true: colors.mcGreen }}
          accessibilityLabel="Metronome"
        />
      </SettingRow>

      {/* Export buttons */}
      <View style={styles.buttonGroup}>
        <ActionButton
          icon={Icons.audioTrack}
          label="EXPORT AUDIO"
          onPress={onExportAudio}
        />
        <ActionButton
          icon={Icons.settings}
          label="EXPORT BUNDLE"
          onPress={onExportBundle}
        />
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SettingRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: any;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.mcBlack4 }]}>
      <Text variant="small" color={colors.mcWhite3} style={styles.rowLabel}>
        {label}
      </Text>
      <View style={styles.rowControl}>{children}</View>
      {value && (
        <Text variant="small" color={colors.mcWhite3} style={styles.rowValue}>
          {value}
        </Text>
      )}
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.actionButton, { backgroundColor: colors.mcWhite4 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon icon={icon} size={16} color={colors.mcWhite} />
      <Text variant="label" color={colors.mcWhite}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    paddingVertical: makeSpacing(4),
    paddingHorizontal: makeSpacing(5),
    gap: makeSpacing(1),
    maxWidth: 480,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: makeSpacing(3),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { width: 80 },
  rowControl: { flex: 1 },
  rowValue: { width: 60, textAlign: 'right' },
  slider: { flex: 1, height: 36 },
  buttonGroup: {
    gap: makeSpacing(3),
    marginTop: makeSpacing(4),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: makeSpacing(3),
    borderRadius: 6,
  },
});
