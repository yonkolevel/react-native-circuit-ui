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
import {
  isEditorCapabilityAllowed,
  useResolvedEditorPolicy,
  type EditorPolicy,
} from '../../stores/editorPolicy';

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
  disabled?: boolean;
  editorPolicy?: EditorPolicy;
}

export const DrumPadsView = memo(function DrumPadsView({
  samples,
  onPadPress,
  onPadRelease,
  externalPressedNotes = new Set(),
  highlightColor = palette.mcGreen,
  disabled: disabledProp = false,
  editorPolicy,
}: DrumPadsViewProps) {
  const { colors } = useTheme();
  const policy = useResolvedEditorPolicy(editorPolicy);
  const disabled =
    disabledProp || !isEditorCapabilityAllowed(policy, 'liveRecording');
  const [pressedPads, setPressedPads] = useState<Set<number>>(new Set());
  const pressCounts = useRef(new Map<number, number>());
  const onPadReleaseRef = useRef(onPadRelease);
  onPadReleaseRef.current = onPadRelease;

  const handleNativePress = useCallback(
    (visualIdx: number) => {
      if (disabled) return;
      const sampleIdx = visualToSample(visualIdx);
      if (!samples[sampleIdx]) return;
      const count = pressCounts.current.get(sampleIdx) ?? 0;
      pressCounts.current.set(sampleIdx, count + 1);
      if (count > 0) return;
      setPressedPads((prev) => new Set(prev).add(sampleIdx));
      onPadPress?.(sampleIdx);
    },
    [disabled, onPadPress, samples]
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

  const releaseHeldPads = useCallback((resetVisual: boolean) => {
    const heldPads = [...pressCounts.current.keys()];
    if (heldPads.length === 0) return;
    pressCounts.current.clear();
    if (resetVisual) setPressedPads(new Set());
    heldPads.forEach((sampleIdx) => onPadReleaseRef.current?.(sampleIdx));
  }, []);

  useEffect(() => {
    if (disabled) releaseHeldPads(true);
  }, [disabled, releaseHeldPads]);

  useEffect(
    () => () => {
      releaseHeldPads(false);
    },
    [releaseHeldPads]
  );

  const handleAccessibleActivation = useCallback(
    (visualIdx: number) => {
      handleNativePress(visualIdx);
      setTimeout(() => handleNativeRelease(visualIdx), 0);
    },
    [handleNativePress, handleNativeRelease]
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

  const sampleIndexFromGrid = (row: number, col: number) =>
    visualToSample(row * 4 + col);

  return (
    <View
      style={styles.container}
      accessibilityLabel="Drum pads"
      accessibilityState={disabled ? { disabled: true } : undefined}
    >
      {/* Visual grid — pointer events disabled, touch handled by overlay */}
      <View style={[styles.grid, { pointerEvents: 'none' }]}>
        {[0, 1, 2, 3].map((row) => (
          <View key={row} style={styles.row}>
            {[0, 1, 2, 3].map((col) => {
              const idx = sampleIndexFromGrid(row, col);
              const sample = samples[idx];
              const isActive =
                pressedPads.has(idx) ||
                (!!sample && externalPressedNotes.has(sample.noteNumber));

              return (
                <View
                  key={col}
                  accessible={!!sample}
                  accessibilityRole={sample ? 'button' : undefined}
                  accessibilityLabel={sample?.name}
                  accessibilityHint={sample ? 'Play sample' : undefined}
                  accessibilityState={disabled ? { disabled: true } : undefined}
                  accessibilityActions={
                    sample && !disabled ? [{ name: 'activate' }] : undefined
                  }
                  onAccessibilityAction={(event) => {
                    if (sample && event.nativeEvent.actionName === 'activate')
                      handleAccessibleActivation(row * 4 + col);
                  }}
                  onAccessibilityTap={() =>
                    sample && handleAccessibleActivation(row * 4 + col)
                  }
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
