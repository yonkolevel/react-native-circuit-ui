/**
 * TrackStrip — Single mixer channel strip
 *
 * Matches SwiftUI TrackStripView:
 * - VStack(spacing:12) {
 *     HStack { TrackLabel, Spacer, HStack { MuteButton, SoloButton } }
 *     VStack { "Volume" label, VolumeFader }
 *     VStack { "Pan" label, PanControl }
 *   }
 * - padding(16), bg(#1A1A1A), cornerRadius(8)
 */
import { memo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import type { TrackState } from '../../types';
import { Text } from '../../../../components/Text';
import { useTheme } from '../../../../theme';
import { MuteButton } from './MuteButton';
import { SoloButton } from './SoloButton';
import { TrackLabel } from './TrackLabel';
import { VolumeFader } from './VolumeFader';
import { PanControl } from './PanControl';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TrackStripProps {
  /** Track state data */
  track: TrackState;
  /** Whether this track is audible (considering mute/solo logic) */
  isAudible: boolean;
  /** Called when volume changes */
  onVolumeChange?: (trackId: number, volume: number) => void;
  /** Called when pan changes */
  onPanChange?: (trackId: number, pan: number) => void;
  /** Called when mute is toggled */
  onMuteToggle?: (trackId: number) => void;
  /** Called when solo is toggled */
  onSoloToggle?: (trackId: number) => void;
  /** Test ID for testing */
  testID?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const TrackStrip: React.FC<TrackStripProps> = memo(function TrackStrip({
  track,
  isAudible,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
  testID = 'track-strip',
}) {
  const { colors } = useTheme();

  const handleVolumeChange = useCallback(
    (volume: number) => {
      onVolumeChange?.(track.id, volume);
    },
    [track.id, onVolumeChange]
  );

  const handlePanChange = useCallback(
    (pan: number) => {
      onPanChange?.(track.id, pan);
    },
    [track.id, onPanChange]
  );

  const handleMuteToggle = useCallback(() => {
    onMuteToggle?.(track.id);
  }, [track.id, onMuteToggle]);

  const handleSoloToggle = useCallback(() => {
    onSoloToggle?.(track.id);
  }, [track.id, onSoloToggle]);

  return (
    <View testID={testID} style={styles.container}>
      {/* Header row: label + mute/solo buttons */}
      <View style={styles.headerRow}>
        <TrackLabel
          color={track.colorHex}
          name={track.title}
          testID={`${testID}-label`}
        />
        <View style={styles.buttonGroup}>
          <MuteButton
            isMuted={track.isMuted}
            onPress={handleMuteToggle}
            testID={`${testID}-mute`}
          />
          <SoloButton
            isSoloed={track.isSoloed}
            onPress={handleSoloToggle}
            testID={`${testID}-solo`}
          />
        </View>
      </View>

      {/* Volume section */}
      <View style={styles.section}>
        <Text variant="small" color={colors.mcWhite2}>
          Volume
        </Text>
        <VolumeFader
          value={track.volume}
          trackColor={track.colorHex}
          isAudible={isAudible}
          onValueChange={handleVolumeChange}
          testID={`${testID}-volume`}
        />
      </View>

      {/* Pan section */}
      <View style={styles.section}>
        <Text variant="small" color={colors.mcWhite2}>
          Pan
        </Text>
        <PanControl
          value={track.pan}
          onValueChange={handlePanChange}
          testID={`${testID}-pan`}
        />
      </View>
    </View>
  );
});

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.mcBlack2,
    borderRadius: 8,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  section: {
    gap: 4,
  },
});

export default TrackStrip;
