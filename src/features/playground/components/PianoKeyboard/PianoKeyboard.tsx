/**
 * TeenagePianoView — OP-1 style keyboard with native multi-touch
 *
 * Visual keys rendered underneath, MultiTouchOverlay on top for touch capture.
 * Grid: rows = 2 (sharp row + natural row per octave), columns = max(5,7)
 *
 * For piano, the grid is: each octave is split into 2 rows:
 *   - Top row (sharp keys): 5 columns
 *   - Bottom row (natural keys): 7 columns
 * We use a single overlay with rows = numberOfOctaves * 2, columns = 7
 * and map the visual index to key index.
 */
import { memo, useState, useCallback, useMemo } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Text } from '../../../../components/Text';
import { MultiTouchOverlay } from '../../../../components/MultiTouchOverlay';
import { palette } from '../../../../theme/colors';

const ALL_SHARP = new Set([1, 3, 6, 8, 10, 13, 15, 18, 20, 22]);
const SQUARE_SHARPS = new Set([8, 20]);
const HAS_LEFT = new Set([1, 6, 13, 18]);
const HAS_RIGHT = new Set([3, 10, 15, 22]);
const NOTE_NAMES: Record<number, string> = {
  0: 'C',
  2: 'D',
  4: 'E',
  5: 'F',
  7: 'G',
  9: 'A',
  11: 'B',
};
const NOTE_COLORS: Record<number, string> = {
  0: palette.mcOrange,
  2: palette.mcBlue,
  4: palette.mcGreen,
  5: palette.mcPink,
  7: palette.mcPurple,
  9: palette.mcYellow,
  11: palette.mcBlue,
};
const SHARP_H = 56;
const S_MAP = [1, 3, 6, 8, 10]; // sharp indices within octave
const N_MAP = [0, 2, 4, 5, 7, 9, 11]; // natural indices within octave

export interface PianoKeyboardProps {
  numberOfOctaves?: number;
  onNoteOn?: (noteIndex: number) => void;
  onNoteOff?: (noteIndex: number) => void;
  externalPressedNotes?: Set<number>;
  highlightColor?: string;
  showNoteNames?: boolean;
}

export const PianoKeyboard = memo(function PianoKeyboard({
  numberOfOctaves = 2,
  onNoteOn,
  onNoteOff,
  externalPressedNotes = new Set(),
  highlightColor = palette.mcGreen,
  showNoteNames = false,
}: PianoKeyboardProps) {
  const { width: screenW } = useWindowDimensions();
  const isPhone = screenW < 768;
  const [pressed, setPressed] = useState<Set<number>>(new Set());

  const totalKeys = numberOfOctaves * 12;
  const keys = useMemo(
    () => Array.from({ length: totalKeys }, (_, i) => i),
    [totalKeys]
  );
  const octaves = useMemo(
    () => Array.from({ length: numberOfOctaves }, (_, i) => i),
    [numberOfOctaves]
  );

  // Grid for overlay: rows = octaves * 2 (sharp row + natural row per octave), columns = 7
  const overlayRows = numberOfOctaves * 2;
  const overlayCols = 7;

  // Map overlay grid index → key index
  const overlayToKey = useCallback(
    (visualIdx: number): number | null => {
      const row = Math.floor(visualIdx / overlayCols);
      const col = visualIdx % overlayCols;
      const octave = Math.floor(row / 2);
      const isSharpRow = row % 2 === 0;

      if (octave >= numberOfOctaves) return null;

      if (isSharpRow) {
        // Sharp row — only 5 keys, map columns 0-4 to sharps, 5-6 are dead zones
        if (col >= 5) return null;
        return S_MAP[col]! + octave * 12;
      } else {
        // Natural row — 7 keys
        return N_MAP[col]! + octave * 12;
      }
    },
    [numberOfOctaves, overlayCols]
  );

  const handleNativePress = useCallback(
    (visualIdx: number) => {
      const key = overlayToKey(visualIdx);
      if (key == null) return;
      setPressed((prev) => new Set(prev).add(key));
      onNoteOn?.(key);
    },
    [overlayToKey, onNoteOn]
  );

  const handleNativeRelease = useCallback(
    (visualIdx: number) => {
      const key = overlayToKey(visualIdx);
      if (key == null) return;
      setPressed((prev) => {
        const s = new Set(prev);
        s.delete(key);
        return s;
      });
      onNoteOff?.(key);
    },
    [overlayToKey, onNoteOff]
  );

  // Fallback callbacks for non-iOS
  const handleIn = useCallback(
    (k: number) => {
      setPressed((prev) => new Set(prev).add(k));
      onNoteOn?.(k);
    },
    [onNoteOn]
  );

  const handleOut = useCallback(
    (k: number) => {
      setPressed((prev) => {
        const s = new Set(prev);
        s.delete(k);
        return s;
      });
      onNoteOff?.(k);
    },
    [onNoteOff]
  );

  const renderOctave = (octave: number) => {
    const start = octave * 12;
    const sk = keys.filter(
      (k) => k >= start && k < start + 12 && ALL_SHARP.has(k)
    );
    const nk = keys.filter(
      (k) => k >= start && k < start + 12 && !ALL_SHARP.has(k)
    );

    const useNative = Platform.OS === 'ios';

    return (
      <View key={octave} style={styles.octave}>
        <View
          style={styles.sharpRow}
          pointerEvents={useNative ? 'none' : 'auto'}
        >
          {sk.map((k) => {
            const active = pressed.has(k) || externalPressedNotes.has(k);
            const sq = SQUARE_SHARPS.has(k);
            const KeyWrapper = useNative ? View : Pressable;
            const pressProps = useNative
              ? {}
              : {
                  onPressIn: () => handleIn(k),
                  onPressOut: () => handleOut(k),
                };
            return (
              <KeyWrapper
                key={k}
                {...pressProps}
                style={[
                  styles.sharpKey,
                  sq ? styles.sharpSq : styles.sharpRect,
                  {
                    backgroundColor: active
                      ? highlightColor
                      : 'rgba(247,247,247,0.8)',
                  },
                ]}
              >
                <View style={styles.sharpContent}>
                  {HAS_LEFT.has(k) && !sq && <View style={styles.spacer} />}
                  <View style={styles.circle} />
                  {HAS_RIGHT.has(k) && !sq && <View style={styles.spacer} />}
                </View>
              </KeyWrapper>
            );
          })}
        </View>
        <View style={styles.natRow} pointerEvents={useNative ? 'none' : 'auto'}>
          {nk.map((k) => {
            const active = pressed.has(k) || externalPressedNotes.has(k);
            const s = k % 12;
            const KeyWrapper = useNative ? View : Pressable;
            const pressProps = useNative
              ? {}
              : {
                  onPressIn: () => handleIn(k),
                  onPressOut: () => handleOut(k),
                };
            return (
              <KeyWrapper
                key={k}
                {...pressProps}
                style={[
                  styles.natKey,
                  {
                    backgroundColor: active
                      ? highlightColor
                      : 'rgba(247,247,247,0.8)',
                  },
                ]}
              >
                {showNoteNames && NOTE_NAMES[s] && NOTE_COLORS[s] && (
                  <View
                    style={[styles.badge, { backgroundColor: NOTE_COLORS[s] }]}
                  >
                    <Text
                      variant="extraSmall"
                      color="#FFF"
                      bold
                      style={styles.badgeTxt}
                    >
                      {NOTE_NAMES[s]}
                    </Text>
                  </View>
                )}
              </KeyWrapper>
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
    >
      {octaves.map(renderOctave)}

      {/* Native overlay for iOS drag-to-play */}
      {Platform.OS === 'ios' && (
        <MultiTouchOverlay
          rows={overlayRows}
          columns={overlayCols}
          onPadPress={handleNativePress}
          onPadRelease={handleNativeRelease}
          style={StyleSheet.absoluteFill}
        />
      )}
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
  sharpRect: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  sharpSq: { minWidth: 56, justifyContent: 'center', alignItems: 'center' },
  sharpContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.mcBlack,
  },
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
  badge: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeTxt: { fontSize: 10 },
});
