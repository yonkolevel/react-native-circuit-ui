/**
 * SkiaPianoRollGrid — Web implementation using standard React Native Views.
 *
 * Matches the native SkiaPianoRollGrid.tsx layout and behaviour:
 * - Vertical ScrollView wraps labels + horizontal grid scroll together
 * - Horizontal ScrollView for the grid area
 * - Tap notes to delete, tap grid rows to add, tap pitch labels to select
 * - Zoom controls, expand toggle
 * - Same row heights, colours, and sizing math as native
 */
import { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Text } from '../Text';
import { Icon, Icons } from '../SFSymbol';
import { useTheme, hexToRgba } from '../../theme';
import type {
  ClipNote,
  InstrumentType,
  Sample,
} from '../../features/playground/types';
import { getGridPointNoteTarget } from './pianoRollMath';

const LABEL_COL_WIDTH = 60;
const DEFAULT_MELODIC_MIN_PITCH = 48;
const MELODIC_PITCH_COUNT = 24;

const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

const getNoteName = (pitch: number): string =>
  `${NOTE_NAMES[pitch % 12]}${Math.floor(pitch / 12) + 1}`;

type WebGridTapEvent = {
  nativeEvent?: {
    locationX?: number;
    offsetX?: number;
    clientX?: number;
    pageX?: number;
  };
  currentTarget?: {
    getBoundingClientRect?: () => { left: number };
  };
};

export const getWebGridTapX = (event: WebGridTapEvent): number => {
  const nativeEvent = event.nativeEvent ?? {};
  const rect = event.currentTarget?.getBoundingClientRect?.();

  if (typeof nativeEvent.clientX === 'number' && rect) {
    return nativeEvent.clientX - rect.left;
  }

  if (typeof nativeEvent.offsetX === 'number') return nativeEvent.offsetX;
  if (typeof nativeEvent.locationX === 'number') return nativeEvent.locationX;
  if (typeof nativeEvent.pageX === 'number' && rect) {
    return nativeEvent.pageX - rect.left;
  }

  return 0;
};

export interface SkiaPianoRollGridProps {
  notes: ClipNote[];
  samples?: Sample[];
  instrumentType?: InstrumentType;
  trackColor: string;
  lengthInBeats: number;
  rowHeight?: number;
  zoomLevel?: number;
  isExpanded?: boolean;
  selectedPitchIndex?: number | null;
  melodicMinPitch?: number;
  onNotePress?: (index: number) => void;
  onNoteResize?: (index: number, newDuration: number) => void;
  onNoteMove?: (
    index: number,
    newPosition: number,
    newNoteNumber: number
  ) => void;
  onGridTap?: (noteNumber: number, position: number) => void;
  onPitchLabelTap?: (pitch: number) => void;
  onToggleExpand?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomChange?: (zoom: number) => void;
  showNoteLabels?: boolean;
  /** Optional per-MIDI-note colors for note bodies and pitch labels. */
  noteColors?: Record<number, string>;
  /** Show built-in expand/zoom controls. */
  showControls?: boolean;
}

export const SkiaPianoRollGrid = memo(function SkiaPianoRollGrid({
  notes,
  samples,
  instrumentType = 'drum',
  trackColor,
  lengthInBeats,
  rowHeight = 34,
  zoomLevel = 1,
  isExpanded,
  selectedPitchIndex,
  melodicMinPitch,
  onNotePress,
  onNoteResize: _onNoteResize,
  onNoteMove: _onNoteMove,
  onGridTap,
  onPitchLabelTap,
  onToggleExpand,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  showNoteLabels = false,
  noteColors,
  showControls = true,
}: SkiaPianoRollGridProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const containerRef = useRef<any>(null);

  const isDrum = instrumentType === 'drum';
  const basePitch = isDrum ? 0 : (melodicMinPitch ?? DEFAULT_MELODIC_MIN_PITCH);
  const totalPitches = isDrum
    ? (samples ?? []).length || 12
    : MELODIC_PITCH_COUNT;

  // Measure container height for expanded mode
  const [containerH, setContainerH] = useState(0);
  const onContainerLayout = useCallback((e: any) => {
    setContainerH(e.nativeEvent.layout.height);
  }, []);

  // Ctrl+scroll → zoom (trackpad pinch or mouse wheel with modifier)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (ev: WheelEvent) => {
      const wheel = ev as WheelEvent & {
        ctrlKey?: boolean;
        metaKey?: boolean;
        deltaY?: number;
      };
      if (!wheel.ctrlKey && !wheel.metaKey) return;
      ev.preventDefault();
      const delta = (wheel.deltaY ?? 0) > 0 ? -0.25 : 0.25;
      onZoomChange?.(Math.max(1, Math.min(3, zoomLevel + delta)));
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [onZoomChange, zoomLevel]);

  const MIN_EXPANDED_ROW = 28;
  const effectiveRowHeight =
    isExpanded && containerH > 0
      ? Math.max(MIN_EXPANDED_ROW, containerH / totalPitches)
      : rowHeight;

  const availableGridWidth = screenWidth - LABEL_COL_WIDTH;
  const stepWidth = (availableGridWidth / 16) * zoomLevel;
  const beatWidth = stepWidth * 4;
  const gridWidth = lengthInBeats * beatWidth;
  const gridHeight = totalPitches * effectiveRowHeight;
  const totalSteps = lengthInBeats * 4;

  const getPitchLabel = useCallback(
    (pitchIdx: number): string => {
      if (isDrum) return (samples ?? [])[pitchIdx]?.name ?? `Note ${pitchIdx}`;
      return getNoteName(basePitch + pitchIdx);
    },
    [isDrum, samples, basePitch]
  );

  const pitchToMidi = useMemo(
    () =>
      isDrum
        ? Array.from(
            { length: totalPitches },
            (_, i) => (samples ?? [])[i]?.noteNumber ?? i
          )
        : Array.from({ length: totalPitches }, (_, i) => basePitch + i),
    [isDrum, totalPitches, samples, basePitch]
  );

  const pianoRollMathContext = useMemo(
    () => ({
      samples,
      isDrum,
      basePitch,
      totalPitches,
      beatWidth,
      stepWidth,
      rowHeight: effectiveRowHeight,
      pitchToMidi,
    }),
    [
      samples,
      isDrum,
      basePitch,
      totalPitches,
      beatWidth,
      stepWidth,
      effectiveRowHeight,
      pitchToMidi,
    ]
  );

  // ── Grid tap handler ──────────────────────────────────────────────────
  const handleGridTap = useCallback(
    (rowIdx: number, locationX: number) => {
      if (!onGridTap) return;
      const target = getGridPointNoteTarget(
        locationX,
        rowIdx * effectiveRowHeight,
        pianoRollMathContext
      );
      if (target) onGridTap(target.noteNumber, target.position);
    },
    [onGridTap, effectiveRowHeight, pianoRollMathContext]
  );

  return (
    <View
      ref={containerRef}
      style={styles.container}
      onLayout={onContainerLayout}
    >
      <ScrollView style={styles.scrollV}>
        <View style={styles.row}>
          {/* Pitch labels */}
          <View style={[styles.labels, { width: LABEL_COL_WIDTH }]}>
            {Array.from({ length: totalPitches }, (_, i) => {
              const pitchIdx = totalPitches - 1 - i;
              const noteNumber = pitchToMidi[pitchIdx] ?? pitchIdx;
              const pitchColor = noteColors?.[noteNumber] ?? trackColor;
              const hasName = !getPitchLabel(pitchIdx).startsWith('Note ');
              return (
                <Pressable
                  key={pitchIdx}
                  onPress={() => onPitchLabelTap?.(pitchIdx)}
                  style={[
                    styles.label,
                    {
                      height: effectiveRowHeight,
                      backgroundColor:
                        selectedPitchIndex === pitchIdx
                          ? colors.mcOrange
                          : hasName
                            ? pitchColor
                            : hexToRgba(pitchColor, 0.6),
                    },
                  ]}
                >
                  <Text
                    variant="extraSmall"
                    color={colors.mcBlack}
                    numberOfLines={2}
                    style={styles.labelText}
                  >
                    {getPitchLabel(pitchIdx)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Grid — horizontal scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.gridScroll}
          >
            <View style={{ width: gridWidth, height: gridHeight }}>
              {/* Row backgrounds + tap targets */}
              {Array.from({ length: totalPitches }, (_, rowIdx) => (
                <Pressable
                  key={`row-${rowIdx}`}
                  onPress={(e) =>
                    handleGridTap(
                      rowIdx,
                      getWebGridTapX(e as unknown as WebGridTapEvent)
                    )
                  }
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: rowIdx * effectiveRowHeight,
                    width: gridWidth,
                    height: effectiveRowHeight,
                    backgroundColor:
                      rowIdx % 2 === 0 ? colors.mcBlack : colors.mcBlack2,
                    borderBottomWidth: 0.5,
                    borderBottomColor: 'rgba(255,255,255,0.06)',
                  }}
                />
              ))}

              {/* Step / beat / bar lines */}
              {Array.from({ length: totalSteps + 1 }, (_, i) => {
                const isBar = i % 16 === 0;
                const isBeat = i % 4 === 0;
                return (
                  <View
                    key={`v${i}`}
                    style={{
                      position: 'absolute',
                      left: i * stepWidth,
                      top: 0,
                      width: isBar ? 1.5 : isBeat ? 1 : 0.5,
                      height: gridHeight,
                      backgroundColor: isBar
                        ? 'rgba(255,255,255,0.25)'
                        : isBeat
                          ? 'rgba(255,255,255,0.12)'
                          : 'rgba(255,255,255,0.04)',
                    }}
                  />
                );
              })}

              {/* Horizontal row lines */}
              {Array.from({ length: totalPitches + 1 }, (_, i) => (
                <View
                  key={`h${i}`}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: i * effectiveRowHeight,
                    width: gridWidth,
                    height: 0.5,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                  }}
                />
              ))}

              {/* Notes */}
              {notes.map((note, idx) => {
                let pitchIdx: number;
                if (isDrum) {
                  const si = (samples ?? []).findIndex(
                    (s) => s.noteNumber === note.noteNumber
                  );
                  pitchIdx = si >= 0 ? si : 0;
                } else {
                  pitchIdx = note.noteNumber - basePitch;
                }
                const rowIdx = totalPitches - 1 - pitchIdx;
                const x = note.position * beatWidth;
                const y = rowIdx * effectiveRowHeight + 1;
                const w = Math.max(note.duration * beatWidth - 1, stepWidth);
                const h = effectiveRowHeight - 2;
                const noteColor = noteColors?.[note.noteNumber] ?? trackColor;

                return (
                  <Pressable
                    key={`n${idx}`}
                    onPress={() => onNotePress?.(idx)}
                    style={{
                      position: 'absolute',
                      left: x,
                      top: y,
                      width: w,
                      height: h,
                      backgroundColor: noteColor,
                      borderRadius: 3,
                      opacity: 0.85,
                      justifyContent: 'center',
                      paddingHorizontal: 4,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Resize indicator */}
                    <View
                      style={{
                        position: 'absolute',
                        right: 2,
                        top: 4,
                        bottom: 4,
                        width: 2,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        borderRadius: 1,
                      }}
                    />
                    {/* Note label */}
                    {showNoteLabels && w > 18 && (
                      <Text
                        variant="extraSmall"
                        color="rgba(0,0,0,0.6)"
                        numberOfLines={1}
                        style={{ fontSize: 9, fontWeight: '600' }}
                      >
                        {isDrum
                          ? ((samples ?? [])
                              .find((s) => s.noteNumber === note.noteNumber)
                              ?.name?.slice(0, 6) ?? '')
                          : getNoteName(note.noteNumber)}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Zoom controls */}
      {showControls && (
        <View style={styles.zoomControls} pointerEvents="box-none">
          <Pressable onPress={onToggleExpand} style={styles.zoomBtn}>
            <Icon
              icon={isExpanded ? Icons.collapse : Icons.expand}
              size={14}
              color="white"
            />
          </Pressable>
          <Pressable onPress={onZoomIn} style={styles.zoomBtn}>
            <Icon icon={Icons.zoomIn} size={14} color="white" />
          </Pressable>
          <View style={styles.zoomLabel}>
            <Text variant="extraSmall10" color="white" center>
              {Math.round(zoomLevel * 100)}%
            </Text>
          </View>
          <Pressable onPress={onZoomOut} style={styles.zoomBtn}>
            <Icon icon={Icons.zoomOut} size={14} color="white" />
          </Pressable>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  scrollV: { flex: 1 },
  row: { flexDirection: 'row' },
  labels: {},
  gridScroll: { flex: 1 },
  label: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.5)',
  },
  labelText: { fontSize: 10, textAlign: 'center' },
  zoomControls: {
    position: 'absolute',
    right: 8,
    top: 8,
    gap: 6,
    alignItems: 'center',
  },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomLabel: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
  },
});
