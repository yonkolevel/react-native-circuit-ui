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
import { runOnJS, useSharedValue } from 'react-native-reanimated';
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
  // Expanded touch target: 12px padding around the visual note rect.
  // Resize handle zone: rightmost 20px (or half the note, whichever is smaller).
  const hitTestNote = useCallback((x: number, y: number): { idx: number; isResizeEdge: boolean } | null => {
    const TOUCH_PADDING = 12;
    const MIN_RESIZE_ZONE = 20;
    let bestIdx = -1;
    let bestDist = Infinity;
    let bestIsResize = false;

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
      const noteY = rowIdx * rowHeight + 1;
      const noteW = Math.max(note.duration * beatWidth - 1, stepWidth);
      const noteH = rowHeight - 2;

      // Expanded hit area
      if (x >= noteX - TOUCH_PADDING && x <= noteX + noteW + TOUCH_PADDING &&
          y >= noteY - TOUCH_PADDING && y <= noteY + noteH + TOUCH_PADDING) {
        // Distance to note center — pick the closest note if overlapping
        const cx = noteX + noteW / 2;
        const cy = noteY + noteH / 2;
        const dist = Math.abs(x - cx) + Math.abs(y - cy);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
          const resizeZone = Math.min(MIN_RESIZE_ZONE, noteW / 2);
          bestIsResize = x >= noteX + noteW - resizeZone;
        }
      }
    }

    return bestIdx >= 0 ? { idx: bestIdx, isResizeEdge: bestIsResize } : null;
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

  // Live drag preview — Reanimated shared values read directly by Skia on UI thread.
  // No React re-renders during drag — GPU updates every frame.
  const dragNoteIdx = useSharedValue(-1);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragW = useSharedValue(0);
  const dragOpacity = useSharedValue(0);
  // Which note index is currently being dragged (-1 = none).
  // React state — only set on drag start/end (2 renders per gesture, not per frame).
  const [activeNoteIdx, setActiveNoteIdx] = useState(-1);

  // Drag state mirrored as shared values for worklet access
  const dragType = useSharedValue(0); // 0 = none, 1 = move, 2 = resize
  const dragStartX = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  const dragOrigPos = useSharedValue(0);
  const dragOrigDur = useSharedValue(0);

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
    if (!hit) { dragState.current = null; dragType.value = 0; setActiveNoteIdx(-1); return; }
    setActiveNoteIdx(hit.idx);
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
    // Mirror to shared values for worklet access
    dragType.value = hit.isResizeEdge ? 2 : 1;
    dragNoteIdx.value = hit.idx;
    dragStartX.value = x;
    dragStartY.value = y;
    dragOrigPos.value = note.position;
    dragOrigDur.value = note.duration;
    dragOpacity.value = 1;
  }, [hitTestNote, notes]);

  // Drag update — pure worklet, reads/writes shared values only.
  // Runs on UI thread every gesture frame. Skia picks up changes on next GPU frame.
  // Captures JS constants via closure (stepWidth, beatWidth, rowHeight, totalPitches are stable numbers).
  const swRef = stepWidth;
  const bwRef = beatWidth;
  const rhRef = rowHeight;
  const tpRef = totalPitches;

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
    // Clear preview after the store update renders — avoids flicker where
    // the original note reappears at the old position for one frame.
    requestAnimationFrame(() => {
      dragNoteIdx.value = -1;
      dragOpacity.value = 0;
      setActiveNoteIdx(-1);
    });
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
      if (dragType.value === 0) return;
      const dx = e.x - dragStartX.value;
      const dy = e.y - dragStartY.value;

      if (dragType.value === 2) {
        // Resize
        dragX.value = dragOrigPos.value * bwRef;
        dragW.value = Math.max(swRef, dragOrigDur.value * bwRef + dx);
        const origRow = Math.floor(dragStartY.value / rhRef);
        dragY.value = origRow * rhRef + 1;
      } else {
        // Move
        const stepsDx = Math.round(dx / swRef);
        const rowsDy = Math.round(dy / rhRef);
        const newPos = Math.max(0, dragOrigPos.value + stepsDx * 0.25);
        const newRowIdx = Math.floor(dragStartY.value / rhRef) + rowsDy;
        const clampedRow = Math.max(0, Math.min(tpRef - 1, newRowIdx));
        dragX.value = newPos * bwRef;
        dragY.value = clampedRow * rhRef + 1;
        dragW.value = dragOrigDur.value * bwRef - 1;
      }
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
                  const y = rowIdx * rowHeight + 1;
                  const w = Math.max(note.duration * beatWidth - 1, stepWidth);
                  const h = rowHeight - 2;
                  const r = 3;

                  // Hide the original note while it's being dragged — the shared-value
                  // preview rect shows the live position instead.
                  if (idx === activeNoteIdx) return null;

                  return (
                    <React.Fragment key={`n${idx}`}>
                      <RoundedRect x={x} y={y} width={w} height={h} r={r} color={trackColor} opacity={0.85} />
                      <Line
                        p1={vec(x + w - 3, y + 4)}
                        p2={vec(x + w - 3, y + h - 4)}
                        color="rgba(0,0,0,0.3)"
                        strokeWidth={2}
                      />
                    </React.Fragment>
                  );
                })}

                {/* Drag preview — driven by shared values, updates on UI thread */}
                <RoundedRect
                  x={dragX}
                  y={dragY}
                  width={dragW}
                  height={rowHeight - 2}
                  r={3}
                  color={trackColor}
                  opacity={dragOpacity}
                />
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
