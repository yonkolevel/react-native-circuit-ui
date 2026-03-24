/**
 * DrumPadsView — 4x4 grid with native multi-touch drag-to-play
 *
 * Renders visual pads underneath, then overlays MultiTouchOverlay
 * which handles all touch input natively (blocks ScrollView stealing).
 *
 * Grid index mapping: visual (0=top-left) → sample (0=bottom-left)
 * sampleIndex = (3 - row) * 4 + col
 */
import { memo, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../../../components/Text';
import { MultiTouchOverlay } from '../../../../components/MultiTouchOverlay';
import { useTheme } from '../../../../theme';
import { palette } from '../../../../theme/colors';
import type { Sample } from '../../types';

function visualToSample(visualIndex: number): number {
  const row = Math.floor(visualIndex / 4);
  const col = visualIndex % 4;
  return (3 - row) * 4 + col;
}

export interface DrumPadsViewProps {
  samples: Sample[];
  onPadPress?: (sampleIndex: number) => void;
  onPadRelease?: (sampleIndex: number) => void;
  externalPressedNotes?: Set<number>;
  highlightColor?: string;
}

export const DrumPadsView = memo(function DrumPadsView({
  samples,
  onPadPress,
  onPadRelease,
  externalPressedNotes = new Set(),
  highlightColor = palette.mcGreen,
}: DrumPadsViewProps) {
  const { colors } = useTheme();
  const [pressedPads, setPressedPads] = useState<Set<number>>(new Set());

  // Native overlay callbacks (receive visual grid index, convert to sample index)
  const handleNativePress = useCallback(
    (visualIdx: number) => {
      const sampleIdx = visualToSample(visualIdx);
      setPressedPads((prev) => new Set(prev).add(sampleIdx));
      onPadPress?.(sampleIdx);
    },
    [onPadPress]
  );

  const handleNativeRelease = useCallback(
    (visualIdx: number) => {
      const sampleIdx = visualToSample(visualIdx);
      setPressedPads((prev) => {
        const n = new Set(prev);
        n.delete(sampleIdx);
        return n;
      });
      onPadRelease?.(sampleIdx);
    },
    [onPadRelease]
  );

  const sampleIndexFromGrid = (row: number, col: number) => (3 - row) * 4 + col;

  return (
    <View style={styles.container} accessibilityLabel="Drum pads">
      {/* Visual grid — pointerEvents none, touch handled by overlay */}
      <View style={styles.grid} pointerEvents="none">
        {[0, 1, 2, 3].map((row) => (
          <View key={row} style={styles.row}>
            {[0, 1, 2, 3].map((col) => {
              const idx = sampleIndexFromGrid(row, col);
              const sample = samples[idx];
              const isActive =
                pressedPads.has(idx) || externalPressedNotes.has(idx);

              return (
                <View
                  key={col}
                  style={[
                    styles.pad,
                    {
                      backgroundColor: !sample
                        ? colors.mcBlack2
                        : isActive
                          ? highlightColor
                          : colors.mcBlack3,
                    },
                  ]}
                >
                  {sample && (
                    <Text
                      variant="extraSmall"
                      color="rgba(255,255,255,0.5)"
                      numberOfLines={2}
                      style={styles.label}
                    >
                      {sample.name}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* Multi-touch overlay — captures all touches on both platforms */}
      <MultiTouchOverlay
        rows={4}
        columns={4}
        onPadPress={handleNativePress}
        onPadRelease={handleNativeRelease}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  grid: { flex: 1, gap: 1 },
  row: { flexDirection: 'row', flex: 1, gap: 1 },
  pad: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 4 },
  label: { fontSize: 8, textAlign: 'center' },
});
