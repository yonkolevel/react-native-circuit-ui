/**
 * PianoKeyboard — Web implementation.
 *
 * Same visual rendering as the native version but each key is a direct
 * Pressable instead of using MultiTouchOverlay. Removes the row-height
 * mismatch that makes the overlay hit areas wrong on web.
 */
import { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Text } from '../../../../components/Text';
import { palette } from '../../../../theme/colors';

const ALL_SHARP = new Set([1, 3, 6, 8, 10, 13, 15, 18, 20, 22]);
const SQUARE_SHARPS = new Set([8, 20]);
const HAS_LEFT = new Set([1, 6, 13, 18]);
const HAS_RIGHT = new Set([3, 10, 15, 22]);
const NOTE_NAMES: Record<number, string> = {
  0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'B',
};
const NOTE_COLORS: Record<number, string> = {
  0: palette.mcOrange, 2: palette.mcBlue,  4: palette.mcGreen,
  5: palette.mcPink,   7: palette.mcPurple, 9: palette.mcYellow, 11: palette.mcBlue,
};
const SHARP_H = 56;

// QWERTY keyboard → semitone index within the rendered octave range
// Lower octave: A W S E D F T G Y H U J
// Upper octave: K O L P ; '
const QWERTY_KEY_MAP: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
  k: 12, o: 13, l: 14, p: 15, ';': 16, "'": 17,
};

function isTypingTarget(): boolean {
  if (typeof document === 'undefined') return false;
  const tag = (document.activeElement as HTMLElement | null)?.tagName ?? '';
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export interface PianoKeyboardProps {
  numberOfOctaves?: number;
  onNoteOn?: (noteIndex: number) => void;
  onNoteOff?: (noteIndex: number) => void;
  externalPressedNotes?: Set<number>;
  highlightColor?: string;
  showNoteNames?: boolean;
  a11yId?: string;
}

export const PianoKeyboard = memo(function PianoKeyboard({
  numberOfOctaves = 2,
  onNoteOn,
  onNoteOff,
  externalPressedNotes = new Set(),
  highlightColor = palette.mcGreen,
  showNoteNames = false,
  a11yId,
}: PianoKeyboardProps) {
  const { width: screenW } = useWindowDimensions();
  const isPhone = screenW < 768;
  const [pressed, setPressed] = useState<Set<number>>(new Set());

  const totalKeys = numberOfOctaves * 12;
  const keys = useMemo(() => Array.from({ length: totalKeys }, (_, i) => i), [totalKeys]);
  const octaves = useMemo(() => Array.from({ length: numberOfOctaves }, (_, i) => i), [numberOfOctaves]);

  const handlePress = useCallback((k: number) => {
    setPressed(prev => new Set(prev).add(k));
    onNoteOn?.(k);
  }, [onNoteOn]);

  const handleRelease = useCallback((k: number) => {
    setPressed(prev => { const s = new Set(prev); s.delete(k); return s; });
    onNoteOff?.(k);
  }, [onNoteOff]);

  // QWERTY keyboard input
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const held = new Set<string>();

    const onDown = (e: KeyboardEvent) => {
      if (isTypingTarget()) return;
      const key = e.key.toLowerCase();
      if (held.has(key)) return; // suppress OS key-repeat
      const idx = QWERTY_KEY_MAP[key];
      if (idx === undefined || idx >= numberOfOctaves * 12) return;
      held.add(key);
      handlePress(idx);
    };

    const onUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      held.delete(key);
      const idx = QWERTY_KEY_MAP[key];
      if (idx === undefined || idx >= numberOfOctaves * 12) return;
      handleRelease(idx);
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      // Release any held keys on unmount to prevent stuck notes
      held.forEach(key => {
        const idx = QWERTY_KEY_MAP[key];
        if (idx !== undefined) handleRelease(idx);
      });
    };
  }, [handlePress, handleRelease, numberOfOctaves]);

  const renderOctave = (octave: number) => {
    const start = octave * 12;
    const sk = keys.filter(k => k >= start && k < start + 12 && ALL_SHARP.has(k));
    const nk = keys.filter(k => k >= start && k < start + 12 && !ALL_SHARP.has(k));

    return (
      <View key={octave} style={styles.octave}>
        {/* Sharp row — each key is a Pressable */}
        <View style={styles.sharpRow}>
          {sk.map((k) => {
            const active = pressed.has(k) || externalPressedNotes.has(k);
            const sq = SQUARE_SHARPS.has(k);
            return (
              <Pressable
                key={k}
                style={[
                  styles.sharpKey,
                  sq ? styles.sharpSq : styles.sharpRect,
                  { backgroundColor: active ? highlightColor : 'rgba(247,247,247,0.8)' },
                ]}
                onPressIn={() => handlePress(k)}
                onPressOut={() => handleRelease(k)}
              >
                <View style={styles.sharpContent}>
                  {HAS_LEFT.has(k) && !sq && <View style={styles.spacer} />}
                  <View style={styles.circle} />
                  {HAS_RIGHT.has(k) && !sq && <View style={styles.spacer} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Natural row — each key is a Pressable */}
        <View style={styles.natRow}>
          {nk.map((k) => {
            const active = pressed.has(k) || externalPressedNotes.has(k);
            const s = k % 12;
            return (
              <Pressable
                key={k}
                style={[
                  styles.natKey,
                  { backgroundColor: active ? highlightColor : 'rgba(247,247,247,0.8)' },
                ]}
                onPressIn={() => handlePress(k)}
                onPressOut={() => handleRelease(k)}
              >
                {showNoteNames && NOTE_NAMES[s] && NOTE_COLORS[s] && (
                  <View style={[styles.badge, { backgroundColor: NOTE_COLORS[s] }]}>
                    <Text variant="extraSmall" color="#FFF" bold style={styles.badgeTxt}>
                      {NOTE_NAMES[s]}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View
      style={[isPhone ? styles.vCont : styles.hCont, styles.relative]}
      accessibilityLabel="Piano keyboard"
      testID={a11yId}
    >
      {octaves.map(renderOctave)}
    </View>
  );
});

const styles = StyleSheet.create({
  relative: { position: 'relative' },
  vCont: { flex: 1 },
  hCont: { flex: 1, flexDirection: 'row' },
  octave: { flex: 1 },
  sharpRow: { flexDirection: 'row', height: SHARP_H },
  sharpKey: { borderWidth: 1, borderColor: palette.mcBlack },
  sharpRect: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  sharpSq: { minWidth: 56, justifyContent: 'center', alignItems: 'center' },
  sharpContent: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  circle: { width: 34, height: 34, borderRadius: 17, backgroundColor: palette.mcBlack },
  spacer: { flex: 1 },
  natRow: { flexDirection: 'row', flex: 1 },
  natKey: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.mcBlack,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
  },
  badge: { width: 20, height: 20, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  badgeTxt: { fontSize: 10 },
});
