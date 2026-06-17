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

// Re-exported for backward compatibility. The canonical definition now lives in
// playground/utils so the export view and native side share one rule.
export { hasExportableAudioContent } from '../../utils/hasExportableAudioContent';

// Slider imported dynamically — available when @react-native-community/slider is installed.
let SliderComponent: any = null;
try {
  SliderComponent = require('@react-native-community/slider').default;
} catch {}

export interface SongSettingsProps {
  /**
   * Opens the export-audio view. Mirrors iOS, where the Settings row is plain
   * navigation into ExportAudioView — the actual disabled/empty guard lives
   * inside that view, not on this row. Always enabled.
   */
  onExportAudio?: () => void;
  onExportBundle?: () => void;
  a11yId?: string;
}

export const SongSettings = memo(function SongSettings({
  onExportAudio,
  onExportBundle,
  a11yId,
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
    <View
      style={styles.container}
      accessibilityLabel="Song settings"
      testID={a11yId}
    >
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
            accessibilityRole="adjustable"
            accessibilityValue={{
              min: 40,
              max: 240,
              now: Math.round(tempo),
              text: `${Math.round(tempo)} BPM`,
            }}
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
            accessibilityRole="adjustable"
            accessibilityValue={{
              min: 0,
              max: 100,
              now: Math.round(masterVolume),
              text: `${Math.round(masterVolume)}%`,
            }}
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
  disabled = false,
}: {
  icon: any;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.actionButton,
        { backgroundColor: colors.mcWhite4 },
        ...(disabled ? [styles.actionButtonDisabled] : []),
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
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
  actionButtonDisabled: {
    opacity: 0.4,
  },
});
