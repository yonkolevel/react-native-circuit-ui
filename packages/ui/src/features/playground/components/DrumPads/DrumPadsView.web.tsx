/**
 * DrumPadsView — Web platform override.
 *
 * Same visual rendering and MultiTouchOverlay pointer-based multi-touch
 * as DrumPadsView.tsx. Adds QWERTY keyboard input:
 *
 *   Q W E R  →  top visual row    (samples 12–15)
 *   A S D F  →  second visual row (samples 8–11)
 *   Z X C V  →  third visual row  (samples 4–7)
 *   1 2 3 4  →  bottom visual row (samples 0–3)
 */
import { memo, useState, useCallback, useEffect, useRef } from 'react';
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

// QWERTY → visual grid index (row-major, top-left = 0)
const DRUM_KEY_MAP: Record<string, number> = {
  'q': 0,
  'w': 1,
  'e': 2,
  'r': 3,
  'a': 4,
  's': 5,
  'd': 6,
  'f': 7,
  'z': 8,
  'x': 9,
  'c': 10,
  'v': 11,
  '1': 12,
  '2': 13,
  '3': 14,
  '4': 15,
};

function isTypingTarget(): boolean {
  if (typeof document === 'undefined') return false;
  const tag = (document.activeElement as HTMLElement | null)?.tagName ?? '';
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
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

  // QWERTY keyboard input.
  // Handlers go through a ref so the effect mounts once — depending on the
  // handlers directly re-runs the effect whenever a parent re-render changes
  // their identity, and the cleanup would release held pads mid-press.
  const keyHandlersRef = useRef({ handleNativePress, handleNativeRelease });
  keyHandlersRef.current = { handleNativePress, handleNativeRelease };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const held = new Set<string>();
    const releaseHeld = () => {
      held.forEach((key) => {
        const visualIdx = DRUM_KEY_MAP[key];
        if (visualIdx !== undefined) {
          keyHandlersRef.current.handleNativeRelease(visualIdx);
        }
      });
      held.clear();
    };
    const onVisibilityChange = () => {
      if (document.hidden) releaseHeld();
    };

    const onDown = (e: KeyboardEvent) => {
      if (isTypingTarget()) return;
      const key = e.key.toLowerCase();
      if (held.has(key)) return;
      const visualIdx = DRUM_KEY_MAP[key];
      if (visualIdx === undefined) return;
      held.add(key);
      keyHandlersRef.current.handleNativePress(visualIdx);
    };

    const onUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (!held.delete(key)) return;
      const visualIdx = DRUM_KEY_MAP[key];
      if (visualIdx !== undefined) {
        keyHandlersRef.current.handleNativeRelease(visualIdx);
      }
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', releaseHeld);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', releaseHeld);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      releaseHeld();
    };
  }, []);

  const sampleIndexFromGrid = (row: number, col: number) => (3 - row) * 4 + col;

  return (
    <View style={styles.container} accessibilityLabel="Drum pads">
      {/* Visual grid — pointer events disabled, touch handled by overlay */}
      <View style={[styles.grid, { pointerEvents: 'none' }]}>
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

      {/* Multi-touch overlay — pointer events for multi-touch + drag on web */}
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
