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
import {
  Fragment,
  memo,
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import type { LayoutChangeEvent, ViewProps } from 'react-native';
import { Text } from '../Text';
import { Icon, Icons } from '../SFSymbol';
import { useTheme, hexToRgba } from '../../theme';
import type {
  ClipNote,
  InstrumentType,
  Sample,
} from '../../features/playground/types';
import {
  getGridPointNoteTarget,
  getMovedNoteTarget,
  getPianoRollNoteRect,
  getResizedNoteDuration,
  hitTestPianoRollNote,
} from './pianoRollMath';

const LABEL_COL_WIDTH = 60;
const DEFAULT_MELODIC_MIN_PITCH = 48;
const MELODIC_PITCH_COUNT = 24;

// SwiftUI uses black grid strokes, but the RN grid has black rows; these keep
// the same neutral feel while making row/step boundaries readable on web.
const GRID_LINE_COLOR = 'rgba(247,247,247,0.10)';
const GRID_BEAT_COLOR = 'rgba(247,247,247,0.16)';
const GRID_BAR_COLOR = 'rgba(247,247,247,0.30)';

const DRAG_THRESHOLD = 4;
const TOUCH_DRAG_HOLD_MS = 250;

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

type WebPointerEvent = {
  nativeEvent: Pick<
    PointerEvent,
    'button' | 'clientX' | 'clientY' | 'pointerId' | 'pointerType'
  >;
  currentTarget: Element;
  preventDefault?: () => void;
};

type WebKeyboardEvent = {
  nativeEvent?: { key?: string; shiftKey?: boolean };
  key?: string;
  shiftKey?: boolean;
  preventDefault?: () => void;
};

type WebPointerHandlers = {
  onPointerDown: (event: WebPointerEvent) => void;
  onPointerMove: (event: WebPointerEvent) => void;
  onPointerUp: (event: WebPointerEvent) => void;
  onPointerCancel: (event: WebPointerEvent) => void;
  onLostPointerCapture: (event: WebPointerEvent) => void;
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
    return (
      nativeEvent.pageX -
      rect.left -
      (typeof window === 'undefined' ? 0 : window.scrollX)
    );
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
  onNoteResize,
  onNoteMove,
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
  const pointerInteractionRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    noteIndex: number | null;
    type: 'grid' | 'move' | 'resize';
    dragging: boolean;
    touchReady: boolean;
    held: boolean;
  } | null>(null);
  const touchHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    noteIndex: number;
    position: number;
    noteNumber: number;
    duration: number;
  } | null>(null);
  const [keyboardCursor, setKeyboardCursor] = useState({
    pitchIndex: 0,
    step: 0,
  });
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);

  const isDrum = instrumentType === 'drum';
  const basePitch = isDrum ? 0 : (melodicMinPitch ?? DEFAULT_MELODIC_MIN_PITCH);
  const totalPitches = isDrum
    ? (samples ?? []).length || 12
    : MELODIC_PITCH_COUNT;

  // Measure container height for expanded mode
  const [containerH, setContainerH] = useState(0);
  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerH(e.nativeEvent.layout.height);
  }, []);

  // Ctrl+scroll → zoom (trackpad pinch or mouse wheel with modifier)
  useEffect(() => {
    const el = containerRef.current;
    if (!el?.addEventListener) return;
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
      gridWidth,
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
      gridWidth,
      effectiveRowHeight,
      pitchToMidi,
    ]
  );

  const clearPointerInteraction = useCallback(() => {
    if (touchHoldTimerRef.current) clearTimeout(touchHoldTimerRef.current);
    touchHoldTimerRef.current = null;
    pointerInteractionRef.current = null;
    setDragPreview(null);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return clearPointerInteraction;
    }
    const handleVisibilityChange = () => {
      if (document.hidden) clearPointerInteraction();
    };
    window.addEventListener('blur', clearPointerInteraction);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('blur', clearPointerInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearPointerInteraction();
    };
  }, [clearPointerInteraction]);

  const getPointerPoint = useCallback((e: WebPointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nativeEvent = e.nativeEvent;
    return {
      x: getWebGridTapX(e as WebGridTapEvent),
      y: nativeEvent.clientY - rect.top,
    };
  }, []);

  const previewForPointer = useCallback(
    (
      interaction: NonNullable<typeof pointerInteractionRef.current>,
      x: number,
      y: number
    ) => {
      if (interaction.noteIndex == null) return null;
      const note = notes[interaction.noteIndex];
      if (!note) return null;

      if (interaction.type === 'resize') {
        return {
          noteIndex: interaction.noteIndex,
          position: note.position,
          noteNumber: note.noteNumber,
          duration: getResizedNoteDuration(
            note.duration,
            x - interaction.startX,
            pianoRollMathContext,
            note.position
          ),
        };
      }

      const moved = getMovedNoteTarget(
        {
          startX: interaction.startX,
          startY: interaction.startY,
          endX: x,
          endY: y,
          originalPosition: note.position,
          originalDuration: note.duration,
          originalNoteNumber: note.noteNumber,
        },
        pianoRollMathContext
      );
      return {
        noteIndex: interaction.noteIndex,
        position: moved.position,
        noteNumber: moved.noteNumber,
        duration: note.duration,
      };
    },
    [notes, pianoRollMathContext]
  );

  const handlePointerDown = useCallback(
    (e: WebPointerEvent) => {
      const nativeEvent = e.nativeEvent;
      const activeInteraction = pointerInteractionRef.current;
      if (
        activeInteraction &&
        activeInteraction.pointerId !== nativeEvent.pointerId
      ) {
        return;
      }
      if (nativeEvent.button != null && nativeEvent.button !== 0) return;
      const { x, y } = getPointerPoint(e);
      const hit = hitTestPianoRollNote(notes, x, y, pianoRollMathContext);
      const interaction = {
        pointerId: nativeEvent.pointerId,
        startX: x,
        startY: y,
        noteIndex: hit?.idx ?? null,
        type: hit
          ? hit.isResizeEdge
            ? ('resize' as const)
            : ('move' as const)
          : ('grid' as const),
        dragging: false,
        touchReady: nativeEvent.pointerType !== 'touch',
        held: false,
      };
      pointerInteractionRef.current = interaction;
      e.currentTarget.setPointerCapture?.(nativeEvent.pointerId);
      if (hit && nativeEvent.pointerType === 'touch') e.preventDefault?.();

      if (!interaction.touchReady) {
        touchHoldTimerRef.current = setTimeout(() => {
          if (
            pointerInteractionRef.current?.pointerId === interaction.pointerId
          ) {
            pointerInteractionRef.current.touchReady = true;
            pointerInteractionRef.current.held = true;
          }
        }, TOUCH_DRAG_HOLD_MS);
      }
    },
    [getPointerPoint, notes, pianoRollMathContext]
  );

  const handlePointerMove = useCallback(
    (e: WebPointerEvent) => {
      const nativeEvent = e.nativeEvent;
      const interaction = pointerInteractionRef.current;
      if (!interaction || interaction.pointerId !== nativeEvent.pointerId)
        return;
      const { x, y } = getPointerPoint(e);
      const distance = Math.hypot(
        x - interaction.startX,
        y - interaction.startY
      );
      if (!interaction.touchReady) {
        if (distance >= DRAG_THRESHOLD) clearPointerInteraction();
        return;
      }
      if (interaction.noteIndex == null) return;
      if (!interaction.dragging && distance < DRAG_THRESHOLD) return;

      interaction.dragging = true;
      e.preventDefault?.();
      setDragPreview(previewForPointer(interaction, x, y));
    },
    [clearPointerInteraction, getPointerPoint, previewForPointer]
  );

  const handlePointerUp = useCallback(
    (e: WebPointerEvent) => {
      const nativeEvent = e.nativeEvent;
      const interaction = pointerInteractionRef.current;
      if (!interaction || interaction.pointerId !== nativeEvent.pointerId)
        return;
      const { x, y } = getPointerPoint(e);
      const distance = Math.hypot(
        x - interaction.startX,
        y - interaction.startY
      );

      if (interaction.dragging && interaction.noteIndex != null) {
        const preview = previewForPointer(interaction, x, y);
        const note = notes[interaction.noteIndex];
        if (preview && note) {
          if (interaction.type === 'resize') {
            if (preview.duration !== note.duration) {
              onNoteResize?.(interaction.noteIndex, preview.duration);
            }
          } else if (
            preview.position !== note.position ||
            preview.noteNumber !== note.noteNumber
          ) {
            onNoteMove?.(
              interaction.noteIndex,
              preview.position,
              preview.noteNumber
            );
          }
        }
      } else if (
        !interaction.held &&
        interaction.noteIndex != null &&
        distance < DRAG_THRESHOLD
      ) {
        onNotePress?.(interaction.noteIndex);
      } else if (
        !interaction.held &&
        interaction.noteIndex == null &&
        distance < DRAG_THRESHOLD
      ) {
        const target = getGridPointNoteTarget(x, y, pianoRollMathContext);
        if (target) onGridTap?.(target.noteNumber, target.position);
      }

      clearPointerInteraction();
    },
    [
      clearPointerInteraction,
      getPointerPoint,
      notes,
      onGridTap,
      onNoteMove,
      onNotePress,
      onNoteResize,
      pianoRollMathContext,
      previewForPointer,
    ]
  );

  const handlePointerTermination = useCallback(
    (e: WebPointerEvent) => {
      if (
        pointerInteractionRef.current?.pointerId === e.nativeEvent.pointerId
      ) {
        clearPointerInteraction();
      }
    },
    [clearPointerInteraction]
  );

  const webPointerHandlers: WebPointerHandlers = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerTermination,
    onLostPointerCapture: handlePointerTermination,
  };

  const moveKeyboardCursor = useCallback(
    (stepDelta: number, pitchDelta: number) => {
      setKeyboardCursor((cursor) => ({
        step: Math.max(0, Math.min(totalSteps - 1, cursor.step + stepDelta)),
        pitchIndex: Math.max(
          0,
          Math.min(totalPitches - 1, cursor.pitchIndex + pitchDelta)
        ),
      }));
    },
    [totalPitches, totalSteps]
  );

  const addNoteAtKeyboardCursor = useCallback(() => {
    const noteNumber =
      pitchToMidi[keyboardCursor.pitchIndex] ?? keyboardCursor.pitchIndex;
    onGridTap?.(noteNumber, keyboardCursor.step * 0.25);
  }, [keyboardCursor, onGridTap, pitchToMidi]);

  const handleGridKeyDown = useCallback(
    (e: WebKeyboardEvent) => {
      const key = e.nativeEvent?.key ?? e.key;
      const movement =
        key === 'ArrowLeft'
          ? ([-1, 0] as const)
          : key === 'ArrowRight'
            ? ([1, 0] as const)
            : key === 'ArrowUp'
              ? ([0, 1] as const)
              : key === 'ArrowDown'
                ? ([0, -1] as const)
                : null;
      if (movement) {
        e.preventDefault?.();
        moveKeyboardCursor(movement[0], movement[1]);
      } else if (key === 'Enter' || key === ' ') {
        e.preventDefault?.();
        addNoteAtKeyboardCursor();
      }
    },
    [addNoteAtKeyboardCursor, moveKeyboardCursor]
  );

  const webGridHandlers = {
    ...webPointerHandlers,
    onKeyDown: handleGridKeyDown,
    onFocus: () => setIsKeyboardFocused(true),
    onBlur: () => setIsKeyboardFocused(false),
    tabIndex: 0,
  } as unknown as ViewProps;

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
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${getPitchLabel(pitchIdx)} notes`}
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
              {/* Row backgrounds */}
              {Array.from({ length: totalPitches }, (_, rowIdx) => (
                <View
                  key={`row-${rowIdx}`}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: rowIdx * effectiveRowHeight,
                    width: gridWidth,
                    height: effectiveRowHeight,
                    backgroundColor:
                      rowIdx % 2 === 0 ? colors.mcBlack : colors.mcBlack2,
                    borderBottomWidth: 0.5,
                    borderBottomColor: GRID_LINE_COLOR,
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
                        ? GRID_BAR_COLOR
                        : isBeat
                          ? GRID_BEAT_COLOR
                          : GRID_LINE_COLOR,
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
                    backgroundColor: GRID_LINE_COLOR,
                  }}
                />
              ))}

              {/* Notes */}
              {notes.map((note, idx) => {
                const preview =
                  dragPreview?.noteIndex === idx ? dragPreview : null;
                const displayedNote = preview
                  ? {
                      ...note,
                      position: preview.position,
                      noteNumber: preview.noteNumber,
                      duration: preview.duration,
                    }
                  : note;
                const rect = getPianoRollNoteRect(
                  displayedNote,
                  pianoRollMathContext
                );
                const originalRect = getPianoRollNoteRect(
                  note,
                  pianoRollMathContext
                );
                const noteColor = noteColors?.[note.noteNumber] ?? trackColor;
                const pitchIndex = Math.max(
                  0,
                  pitchToMidi.indexOf(note.noteNumber)
                );
                const moveNote = (stepDelta: number, pitchDelta: number) => {
                  const nextPitchIndex = Math.max(
                    0,
                    Math.min(totalPitches - 1, pitchIndex + pitchDelta)
                  );
                  const nextPosition = Math.max(
                    0,
                    Math.min(
                      lengthInBeats - note.duration,
                      note.position + stepDelta * 0.25
                    )
                  );
                  onNoteMove?.(
                    idx,
                    nextPosition,
                    pitchToMidi[nextPitchIndex] ?? note.noteNumber
                  );
                };
                const resizeNote = (stepDelta: number) => {
                  onNoteResize?.(
                    idx,
                    Math.max(
                      0.25,
                      Math.min(
                        lengthInBeats - note.position,
                        note.duration + stepDelta * 0.25
                      )
                    )
                  );
                };
                const handleNoteKeyDown = (e: WebKeyboardEvent) => {
                  const key = e.nativeEvent?.key ?? e.key;
                  const shiftKey = e.nativeEvent?.shiftKey ?? e.shiftKey;
                  if (shiftKey && key === 'ArrowLeft') resizeNote(-1);
                  else if (shiftKey && key === 'ArrowRight') resizeNote(1);
                  else if (key === 'ArrowLeft') moveNote(-1, 0);
                  else if (key === 'ArrowRight') moveNote(1, 0);
                  else if (key === 'ArrowUp') moveNote(0, 1);
                  else if (key === 'ArrowDown') moveNote(0, -1);
                  else return;
                  e.preventDefault?.();
                };
                const noteKeyboardProps = {
                  onKeyDown: handleNoteKeyDown,
                } as unknown as ViewProps;

                return (
                  <Fragment key={`n${idx}`}>
                    {preview && (
                      <View
                        style={{
                          position: 'absolute',
                          left: originalRect.x,
                          top: originalRect.y,
                          width: originalRect.width,
                          height: originalRect.height,
                          backgroundColor: 'rgba(0,0,0,0.2)',
                          borderRadius: 3,
                        }}
                      />
                    )}
                    <Pressable
                      onPress={() => onNotePress?.(idx)}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete note ${getNoteName(note.noteNumber)} at beat ${note.position}, duration ${note.duration}. Arrow keys move; Shift plus Left or Right resizes`}
                      accessibilityHint="Press Enter to delete"
                      {...noteKeyboardProps}
                      style={{
                        position: 'absolute',
                        left: rect.x,
                        top: rect.y,
                        width: rect.width,
                        height: rect.height,
                        backgroundColor: noteColor,
                        borderRadius: 3,
                        opacity: preview ? 1 : 0.85,
                        justifyContent: 'center',
                        paddingHorizontal: 4,
                        overflow: 'hidden',
                      }}
                    >
                      {!preview && (
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
                      )}
                      {showNoteLabels && !preview && rect.width > 18 && (
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
                  </Fragment>
                );
              })}

              {/* One interaction layer keeps pointer and keyboard editing in grid coordinates. */}
              <View
                style={StyleSheet.absoluteFill}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Piano roll note grid, ${getPitchLabel(keyboardCursor.pitchIndex)} at beat ${keyboardCursor.step * 0.25}. Arrow keys move; Enter adds`}
                accessibilityHint="Choose a pitch and beat, then add a note"
                {...webGridHandlers}
              >
                {isKeyboardFocused && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: keyboardCursor.step * stepWidth,
                      top:
                        (totalPitches - 1 - keyboardCursor.pitchIndex) *
                        effectiveRowHeight,
                      width: stepWidth,
                      height: effectiveRowHeight,
                      borderWidth: 2,
                      borderColor: colors.mcOrange,
                    }}
                  />
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Zoom controls */}
      {showControls && (
        <View style={styles.zoomControls} pointerEvents="box-none">
          <Pressable
            onPress={onToggleExpand}
            style={styles.zoomBtn}
            accessibilityRole="button"
            accessibilityLabel={
              isExpanded ? 'Collapse piano roll' : 'Expand piano roll'
            }
          >
            <Icon
              icon={isExpanded ? Icons.collapse : Icons.expand}
              size={14}
              color="white"
            />
          </Pressable>
          <Pressable
            onPress={onZoomIn}
            style={styles.zoomBtn}
            accessibilityRole="button"
            accessibilityLabel="Zoom in"
          >
            <Icon icon={Icons.zoomIn} size={14} color="white" />
          </Pressable>
          <View style={styles.zoomLabel}>
            <Text variant="extraSmall10" color="white" center>
              {Math.round(zoomLevel * 100)}%
            </Text>
          </View>
          <Pressable
            onPress={onZoomOut}
            style={styles.zoomBtn}
            accessibilityRole="button"
            accessibilityLabel="Zoom out"
          >
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
