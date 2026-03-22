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
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Text } from '../../../../components/Text';
import { MultiTouchOverlay } from '../../../../components/MultiTouchOverlay';
import { useTheme } from '../../../../theme';
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
  highlightColor = '#00FF9E',
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

  // Fallback for non-iOS (simple Pressable per pad)
  const handlePressIn = useCallback(
    (idx: number) => {
      setPressedPads((prev) => new Set(prev).add(idx));
      onPadPress?.(idx);
    },
    [onPadPress]
  );

  const handlePressOut = useCallback(
    (idx: number) => {
      setPressedPads((prev) => {
        const n = new Set(prev);
        n.delete(idx);
        return n;
      });
      onPadRelease?.(idx);
    },
    [onPadRelease]
  );

  const sampleIndexFromGrid = (row: number, col: number) => (3 - row) * 4 + col;

  return (
    <View style={styles.container} accessibilityLabel="Drum pads">
      {/* Visual grid */}
      <View
        style={styles.grid}
        pointerEvents={Platform.OS === 'ios' ? 'none' : 'auto'}
      >
        {[0, 1, 2, 3].map((row) => (
          <View key={row} style={styles.row}>
            {[0, 1, 2, 3].map((col) => {
              const idx = sampleIndexFromGrid(row, col);
              const sample = samples[idx];
              const isActive =
                pressedPads.has(idx) || externalPressedNotes.has(idx);

              if (!sample) {
                return (
                  <View
                    key={col}
                    style={[styles.pad, { backgroundColor: colors.mcBlack2 }]}
                  />
                );
              }

              if (Platform.OS !== 'ios') {
                // Android/Web fallback — Pressable per pad
                return (
                  <Pressable
                    key={col}
                    onPressIn={() => handlePressIn(idx)}
                    onPressOut={() => handlePressOut(idx)}
                    style={[
                      styles.pad,
                      {
                        backgroundColor: isActive
                          ? highlightColor
                          : colors.mcBlack3,
                      },
                    ]}
                  >
                    <Text
                      variant="extraSmall"
                      color="rgba(255,255,255,0.5)"
                      numberOfLines={2}
                      style={styles.label}
                    >
                      {sample.fileName}
                    </Text>
                  </Pressable>
                );
              }

              return (
                <View
                  key={col}
                  style={[
                    styles.pad,
                    {
                      backgroundColor: isActive
                        ? highlightColor
                        : colors.mcBlack3,
                    },
                  ]}
                >
                  <Text
                    variant="extraSmall"
                    color="rgba(255,255,255,0.5)"
                    numberOfLines={2}
                    style={styles.label}
                  >
                    {sample.fileName}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* Native touch overlay (iOS only) — sits on top, captures all touches */}
      {Platform.OS === 'ios' && (
        <MultiTouchOverlay
          rows={4}
          columns={4}
          onPadPress={handleNativePress}
          onPadRelease={handleNativeRelease}
          style={StyleSheet.absoluteFill}
        />
      )}
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
