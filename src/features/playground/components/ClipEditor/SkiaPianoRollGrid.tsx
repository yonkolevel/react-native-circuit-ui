/**
 * SkiaPianoRollGrid — GPU-rendered piano roll using react-native-skia.
 *
 * Architecture (matches iOS AudioKit PianoRoll):
 * - Grid background: single Skia Path (one draw call for all rows + step lines)
 * - Notes: Skia Rect elements (GPU-drawn, not React Views)
 * - Touch: transparent View overlay handles taps (separate from rendering)
 *
 * Why Skia:
 * - The old PianoRollGrid rendered 70+ React Native Views (rows + lines + notes)
 * - Each note add triggered a full React reconciliation of all children
 * - Skia draws everything in a single GPU pass — adding a note is just
 *   one more Rect in the draw list, no React re-render overhead
 */
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Path as SkiaPath, Rect, RoundedRect, Skia, Line, vec } from '@shopify/react-native-skia';
import { ScrollView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Text } from '../../../../components/Text';
import { useTheme, hexToRgba } from '../../../../theme';
import type { ClipNote, InstrumentType, Sample } from '../../types';

const LABEL_COL_WIDTH = 60;
const DEFAULT_MELODIC_MIN_PITCH = 48;
const MELODIC_PITCH_COUNT = 24;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const getNoteName = (pitch: number): string => `${NOTE_NAMES[pitch % 12]}${Math.floor(pitch / 12) + 1}`;

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
  onNoteMove?: (index: number, newPosition: number, newNoteNumber: number) => void;
  onGridTap?: (noteNumber: number, position: number) => void;
  onPitchLabelTap?: (pitch: number) => void;
  onToggleExpand?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
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
  onNoteResize,
  onNoteMove,
  onGridTap,
  onPitchLabelTap,
  onToggleExpand,
  onZoomIn,
  onZoomOut,
}: SkiaPianoRollGridProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const isDrum = instrumentType === 'drum';
  const basePitch = isDrum ? 0 : (melodicMinPitch ?? DEFAULT_MELODIC_MIN_PITCH);
  const totalPitches = isDrum ? Math.max((samples ?? []).length, 12) : MELODIC_PITCH_COUNT;

  const availableGridWidth = screenWidth - LABEL_COL_WIDTH;
  const stepWidth = (availableGridWidth / 16) * zoomLevel;
  const beatWidth = stepWidth * 4;
  const gridWidth = lengthInBeats * beatWidth;
  const gridHeight = totalPitches * rowHeight;
  const totalSteps = lengthInBeats * 4;

  // Build the grid path once — memoized on dimensions only (not notes)
  const gridPath = useMemo(() => {
    const path = Skia.Path.Make();

    // Horizontal row lines
    for (let i = 0; i <= totalPitches; i++) {
      const y = i * rowHeight;
      path.moveTo(0, y);
      path.lineTo(gridWidth, y);
    }

    // Vertical step lines
    for (let i = 0; i <= totalSteps; i++) {
      const x = i * stepWidth;
      path.moveTo(x, 0);
      path.lineTo(x, gridHeight);
    }

    return path;
  }, [totalPitches, rowHeight, gridWidth, totalSteps, stepWidth, gridHeight]);

  // Row background colors — alternating
  const rowBgColor1 = colors.mcBlack;
  const rowBgColor2 = colors.mcBlack2;

  // Pitch label helpers
  const getPitchLabel = useCallback((pitchIdx: number): string => {
    if (isDrum) return (samples ?? [])[pitchIdx]?.name ?? `Note ${pitchIdx}`;
    return getNoteName(basePitch + pitchIdx);
  }, [isDrum, samples, basePitch]);

  const pitchToMidi = useMemo(() =>
    isDrum
      ? Array.from({ length: totalPitches }, (_, i) => (samples ?? [])[i]?.noteNumber ?? i)
      : Array.from({ length: totalPitches }, (_, i) => basePitch + i),
    [isDrum, totalPitches, samples, basePitch]
  );

  // --- Note hit testing ---
  const hitTestNote = useCallback((x: number, y: number): { idx: number; isResizeEdge: boolean } | null => {
    const RESIZE_HANDLE = stepWidth * 0.5; // right edge zone for resize
    for (let idx = notes.length - 1; idx >= 0; idx--) {
      const note = notes[idx]!;
      let pitchIdx: number;
      if (isDrum) {
        const si = (samples ?? []).findIndex(s => s.noteNumber === note.noteNumber);
        pitchIdx = si >= 0 ? si : 0;
      } else {
        pitchIdx = note.noteNumber - basePitch;
      }
      const rowIdx = totalPitches - 1 - pitchIdx;
      const noteX = note.position * beatWidth;
      const noteY = rowIdx * rowHeight + 2;
      const noteW = Math.max(note.duration * beatWidth - 2, stepWidth);
      const noteH = rowHeight - 4;
      if (x >= noteX && x <= noteX + noteW && y >= noteY && y <= noteY + noteH) {
        const isResizeEdge = x >= noteX + noteW - RESIZE_HANDLE;
        return { idx, isResizeEdge };
      }
    }
    return null;
  }, [notes, isDrum, samples, basePitch, totalPitches, beatWidth, rowHeight, stepWidth]);

  // --- Gesture state ---
  const dragState = useRef<{
    type: 'move' | 'resize';
    noteIdx: number;
    startX: number;
    startY: number;
    origPosition: number;
    origDuration: number;
    origNoteNumber: number;
  } | null>(null);

  // Live drag preview — updated during gesture, rendered as a modified note rect
  const [dragPreview, setDragPreview] = useState<{
    noteIdx: number;
    x: number;
    y: number;
    width: number;
  } | null>(null);

  // --- JS callbacks (must use runOnJS from gesture worklets) ---
  const handleTap = useCallback((x: number, y: number) => {
    const hit = hitTestNote(x, y);
    if (hit) {
      onNotePress?.(hit.idx);
    } else if (onGridTap) {
      const step = Math.floor(x / stepWidth);
      const position = step * 0.25;
      const rowIdx = Math.floor(y / rowHeight);
      const pitchIdx = totalPitches - 1 - rowIdx;
      if (pitchIdx >= 0 && pitchIdx < totalPitches) {
        const noteNumber = pitchToMidi[pitchIdx] ?? pitchIdx;
        onGridTap(noteNumber, position);
      }
    }
  }, [hitTestNote, onNotePress, onGridTap, stepWidth, rowHeight, totalPitches, pitchToMidi]);

  const handleDragStart = useCallback((x: number, y: number) => {
    const hit = hitTestNote(x, y);
    if (!hit) { dragState.current = null; return; }
    const note = notes[hit.idx]!;
    dragState.current = {
      type: hit.isResizeEdge ? 'resize' : 'move',
      noteIdx: hit.idx,
      startX: x,
      startY: y,
      origPosition: note.position,
      origDuration: note.duration,
      origNoteNumber: note.noteNumber,
    };
  }, [hitTestNote, notes]);

  const handleDragUpdate = useCallback((x: number, y: number) => {
    const ds = dragState.current;
    if (!ds) return;
    const dx = x - ds.startX;
    const dy = y - ds.startY;

    if (ds.type === 'resize') {
      const newWidth = Math.max(stepWidth, ds.origDuration * beatWidth + dx);
      const noteX = ds.origPosition * beatWidth;
      setDragPreview({ noteIdx: ds.noteIdx, x: noteX, y: -1, width: newWidth });
    } else {
      const stepsDx = Math.round(dx / stepWidth);
      const rowsDy = Math.round(dy / rowHeight);
      const newPos = Math.max(0, ds.origPosition + stepsDx * 0.25);
      const newRowIdx = Math.floor(ds.startY / rowHeight) + rowsDy;
      const clampedRow = Math.max(0, Math.min(totalPitches - 1, newRowIdx));
      const noteX = newPos * beatWidth;
      const noteY = clampedRow * rowHeight + 2;
      const noteW = ds.origDuration * beatWidth - 2;
      setDragPreview({ noteIdx: ds.noteIdx, x: noteX, y: noteY, width: noteW });
    }
  }, [beatWidth, stepWidth, rowHeight, totalPitches]);

  const handleDragEnd = useCallback((x: number, y: number) => {
    const ds = dragState.current;
    if (!ds) return;
    const dx = x - ds.startX;
    const dy = y - ds.startY;

    if (ds.type === 'resize') {
      const newWidth = ds.origDuration * beatWidth + dx;
      const steps = Math.max(1, Math.round(newWidth / stepWidth));
      onNoteResize?.(ds.noteIdx, steps * 0.25);
    } else {
      const stepsDx = Math.round(dx / stepWidth);
      const rowsDy = Math.round(dy / rowHeight);
      const newPosition = Math.max(0, ds.origPosition + stepsDx * 0.25);
      const newRowIdx = Math.floor(ds.startY / rowHeight) + rowsDy;
      const newPitchIdx = Math.max(0, Math.min(totalPitches - 1, totalPitches - 1 - newRowIdx));
      const newNoteNumber = pitchToMidi[newPitchIdx] ?? newPitchIdx;
      if (newPosition !== ds.origPosition || newNoteNumber !== ds.origNoteNumber) {
        onNoteMove?.(ds.noteIdx, newPosition, newNoteNumber);
      }
    }
    dragState.current = null;
    setDragPreview(null);
  }, [beatWidth, stepWidth, rowHeight, totalPitches, pitchToMidi, onNoteResize, onNoteMove]);

  // --- Gestures (UI thread → runOnJS for callbacks) ---
  const tapGesture = Gesture.Tap()
    .maxDuration(200)
    .onEnd((e) => {
      'worklet';
      runOnJS(handleTap)(e.x, e.y);
    });

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(150)
    .onStart((e) => {
      'worklet';
      runOnJS(handleDragStart)(e.x, e.y);
    })
    .onUpdate((e) => {
      'worklet';
      runOnJS(handleDragUpdate)(e.x, e.y);
    })
    .onEnd((e) => {
      'worklet';
      runOnJS(handleDragEnd)(e.x, e.y);
    });

  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollV}>
        <View style={styles.row}>
          {/* Pitch labels — React Views (interactive, need text) */}
          <View style={[styles.labels, { width: LABEL_COL_WIDTH }]}>
            {Array.from({ length: totalPitches }, (_, i) => {
              const pitchIdx = totalPitches - 1 - i;
              const hasName = !getPitchLabel(pitchIdx).startsWith('Note ');
              return (
                <Pressable
                  key={pitchIdx}
                  onPress={() => onPitchLabelTap?.(pitchIdx)}
                  style={[
                    styles.label,
                    {
                      height: rowHeight,
                      backgroundColor:
                        selectedPitchIndex === pitchIdx
                          ? colors.mcOrange
                          : hasName ? trackColor : hexToRgba(trackColor, 0.6),
                    },
                  ]}
                >
                  <Text variant="extraSmall" color={colors.mcBlack} numberOfLines={2} style={styles.labelText}>
                    {getPitchLabel(pitchIdx)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Grid — Skia Canvas (single GPU draw) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gridScroll}>
            <View style={{ width: gridWidth, height: gridHeight }}>
              <Canvas style={StyleSheet.absoluteFill}>
                {/* Row backgrounds — alternating colors */}
                {Array.from({ length: totalPitches }, (_, i) => (
                  <Rect
                    key={`bg${i}`}
                    x={0}
                    y={i * rowHeight}
                    width={gridWidth}
                    height={rowHeight}
                    color={i % 2 === 0 ? rowBgColor1 : rowBgColor2}
                  />
                ))}

                {/* Grid lines — single path, one draw call */}
                <SkiaPath
                  path={gridPath}
                  color="rgba(255,255,255,0.06)"
                  style="stroke"
                  strokeWidth={0.5}
                />

                {/* Beat lines (stronger) */}
                {Array.from({ length: Math.floor(totalSteps / 4) + 1 }, (_, i) => (
                  <Line
                    key={`beat${i}`}
                    p1={vec(i * 4 * stepWidth, 0)}
                    p2={vec(i * 4 * stepWidth, gridHeight)}
                    color="rgba(255,255,255,0.12)"
                    strokeWidth={1}
                  />
                ))}

                {/* Bar lines (strongest) */}
                {Array.from({ length: Math.floor(totalSteps / 16) + 1 }, (_, i) => (
                  <Line
                    key={`bar${i}`}
                    p1={vec(i * 16 * stepWidth, 0)}
                    p2={vec(i * 16 * stepWidth, gridHeight)}
                    color="rgba(255,255,255,0.25)"
                    strokeWidth={1.5}
                  />
                ))}

                {/* Notes — styled to match AudioKit PianoRoll */}
                {notes.map((note, idx) => {
                  let pitchIdx: number;
                  if (isDrum) {
                    const si = (samples ?? []).findIndex(s => s.noteNumber === note.noteNumber);
                    pitchIdx = si >= 0 ? si : 0;
                  } else {
                    pitchIdx = note.noteNumber - basePitch;
                  }
                  const rowIdx = totalPitches - 1 - pitchIdx;
                  const x = note.position * beatWidth;
                  const y = rowIdx * rowHeight + 1; // 1px padding from row edge
                  const w = Math.max(note.duration * beatWidth - 1, stepWidth); // 1px gap between consecutive
                  const h = rowHeight - 2;
                  const r = 3; // corner radius matching old MidiNoteView

                  const isDragging = dragPreview?.noteIdx === idx;
                  if (isDragging && dragPreview) {
                    const previewY = dragPreview.y >= 0 ? dragPreview.y : y;
                    return (
                      <React.Fragment key={`n${idx}`}>
                        {/* Ghost at original position */}
                        <RoundedRect x={x} y={y} width={w} height={h} r={r} color="rgba(0,0,0,0.2)" />
                        {/* Dragged note */}
                        <RoundedRect x={dragPreview.x} y={previewY} width={dragPreview.width} height={h} r={r} color={trackColor} />
                        {/* Resize handle on dragged note */}
                        <Line
                          p1={vec(dragPreview.x + dragPreview.width - 3, previewY + 4)}
                          p2={vec(dragPreview.x + dragPreview.width - 3, previewY + h - 4)}
                          color="rgba(0,0,0,0.4)"
                          strokeWidth={2}
                        />
                      </React.Fragment>
                    );
                  }

                  return (
                    <React.Fragment key={`n${idx}`}>
                      {/* Note body — rounded rect with slight transparency */}
                      <RoundedRect x={x} y={y} width={w} height={h} r={r} color={trackColor} opacity={0.85} />
                      {/* Resize handle — dark line at right edge (matches AudioKit DefaultNoteView) */}
                      <Line
                        p1={vec(x + w - 3, y + 4)}
                        p2={vec(x + w - 3, y + h - 4)}
                        color="rgba(0,0,0,0.3)"
                        strokeWidth={2}
                      />
                    </React.Fragment>
                  );
                })}
              </Canvas>

              {/* Touch overlay — gesture handler for tap/drag/resize */}
              <GestureDetector gesture={composedGesture}>
                <View style={StyleSheet.absoluteFill} />
              </GestureDetector>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Zoom controls */}
      <View style={styles.zoomControls}>
        <Pressable onPress={onToggleExpand} style={styles.zoomBtn}>
          <Text variant="extraSmall" color="white">{isExpanded ? '↙' : '↗'}</Text>
        </Pressable>
        <Pressable onPress={onZoomIn} style={styles.zoomBtn}>
          <Text variant="extraSmall" color="white">+</Text>
        </Pressable>
        <View style={styles.zoomLabel}>
          <Text variant="extraSmall10" color="white" center>{Math.round(zoomLevel * 100)}%</Text>
        </View>
        <Pressable onPress={onZoomOut} style={styles.zoomBtn}>
          <Text variant="extraSmall" color="white">−</Text>
        </Pressable>
      </View>
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
