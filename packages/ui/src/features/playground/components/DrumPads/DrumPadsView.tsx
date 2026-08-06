/**
 * DrumPadsView — 4x4 grid with native multi-touch drag-to-play
 *
 * Renders visual pads underneath, then overlays MultiTouchOverlay
 * which handles all touch input natively (blocks ScrollView stealing).
 *
 * Grid index mapping: visual (0=top-left) → sample (0=bottom-left)
 * sampleIndex = (3 - row) * 4 + col
 */
import { memo, useState, useCallback, useRef } from 'react';
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
  const pressCounts = useRef(new Map<number, number>());

  const handleNativePress = useCallback(
    (visualIdx: number) => {
      const sampleIdx = visualToSample(visualIdx);
      if (!samples[sampleIdx]) return;
      const count = pressCounts.current.get(sampleIdx) ?? 0;
      pressCounts.current.set(sampleIdx, count + 1);
      if (count > 0) return;
      setPressedPads((prev) => new Set(prev).add(sampleIdx));
      onPadPress?.(sampleIdx);
    },
    [onPadPress, samples]
  );

  const handleNativeRelease = useCallback(
    (visualIdx: number) => {
      const sampleIdx = visualToSample(visualIdx);
      const count = pressCounts.current.get(sampleIdx) ?? 0;
      if (count > 1) {
        pressCounts.current.set(sampleIdx, count - 1);
        return;
      }
      if (count === 0) return;
      pressCounts.current.delete(sampleIdx);
      setPressedPads((prev) => {
        const n = new Set(prev);
        n.delete(sampleIdx);
        return n;
      });
      onPadRelease?.(sampleIdx);
    },
    [onPadRelease]
  );

  const handleAccessibleActivation = useCallback(
    (visualIdx: number) => {
      handleNativePress(visualIdx);
      setTimeout(() => handleNativeRelease(visualIdx), 0);
    },
    [handleNativePress, handleNativeRelease]
  );

  return (
    <View style={styles.container} accessibilityLabel="Drum pads">
      {/* Visual grid — pointer events disabled, touch handled by overlay */}
      <View style={[styles.grid, { pointerEvents: 'none' }]}>
        {[0, 1, 2, 3].map((row) => (
          <View key={row} style={styles.row}>
            {[0, 1, 2, 3].map((col) => {
              const visualIdx = row * 4 + col;
              const idx = visualToSample(visualIdx);
              const sample = samples[idx];
              const isActive =
                pressedPads.has(idx) ||
                (!!sample && externalPressedNotes.has(sample.noteNumber));
              const padStyle = [
                styles.pad,
                {
                  backgroundColor: !sample
                    ? colors.mcBlack2
                    : isActive
                      ? highlightColor
                      : colors.mcBlack3,
                },
              ];

              if (!sample) return <View key={col} style={padStyle} />;
              return (
                <View
                  key={col}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={sample.name}
                  accessibilityHint="Play sample"
                  accessibilityActions={[{ name: 'activate' }]}
                  onAccessibilityAction={(event) => {
                    if (event.nativeEvent.actionName === 'activate')
                      handleAccessibleActivation(visualIdx);
                  }}
                  onAccessibilityTap={() =>
                    handleAccessibleActivation(visualIdx)
                  }
                  style={padStyle}
                >
                  <Text
                    variant="small"
                    color={isActive ? colors.mcBlack : colors.mcWhite2}
                    numberOfLines={2}
                    style={styles.label}
                  >
                    {sample.name}
                  </Text>
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
  label: { fontSize: 12, textAlign: 'center' },
});
