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
import React, {
  memo,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import {
  Canvas,
  Path as SkiaPath,
  Rect,
  RoundedRect,
  Skia,
  Line,
  vec,
  Text as SkiaText,
  Group,
  matchFont,
} from '@shopify/react-native-skia';
import {
  ScrollView,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Text } from '../Text';
import { Icon, Icons } from '../SFSymbol';
import { useTheme, hexToRgba } from '../../theme';
import type {
  ClipNote,
  InstrumentType,
  Sample,
} from '../../features/playground/types';
import {
  getDragPreviewSeed,
  getGridPointNoteTarget,
  getMovedGridTarget,
  getMovedNoteTarget,
  getPianoRollNoteRect,
  getResizedNoteDuration,
  getResizeMagneticTarget,
  getSelectedLabelColor,
  getVelocityColor,
  hitTestPianoRollNote,
  UNSNAPPED_MIN_DURATION_STEPS,
  type RecordingNotePreviewData,
} from './pianoRollMath';

// Bright red — reads as "actively recording" against any track color,
// matching the convention most DAWs use for an in-progress take.
const RECORDING_OUTLINE_COLOR = '#FF3B30';

/**
 * Live preview of a note currently held during recording. Grows from its
 * press beat to the live playhead position via a SharedValue read on the UI
 * thread — no React re-renders while recording (matches the drag-preview
 * and playhead patterns elsewhere in this file).
 */
const RecordingNotePreview = memo(function RecordingNotePreview({
  x,
  rowIdx,
  effectiveRowHeight,
  playheadPosX,
  color,
}: {
  x: number;
  rowIdx: number;
  effectiveRowHeight: number;
  playheadPosX: SharedValue<number>;
  color: string;
}) {
  const y = rowIdx * effectiveRowHeight + 1;
  const h = effectiveRowHeight - 2;
  const width = useDerivedValue(() =>
    Math.max(4, playheadPosX.value - x)
  );
  return (
    <>
      <RoundedRect x={x} y={y} width={width} height={h} r={3} color={color} opacity={1} />
      <RoundedRect
        x={x}
        y={y}
        width={width}
        height={h}
        r={3}
        color={RECORDING_OUTLINE_COLOR}
        style="stroke"
        strokeWidth={2}
      />
    </>
  );
});

// Snap-zone ease duration for resize live-preview — short enough to feel
// immediate, long enough to read as a glide rather than a jump.
const SNAP_EASE_MS = 90;

const LABEL_COL_WIDTH = 60;
const DEFAULT_MELODIC_MIN_PITCH = 48;
const MELODIC_PITCH_COUNT = 24;

// Matches native's PianoRoll package: every grid line (step, beat, and bar
// boundary alike) is drawn with the same uniform black stroke — no separate
// emphasis tier for beats/bars.
const GRID_LINE_COLOR = '#000000';

// A touch that releases within this window without much movement is a tap
// (add/delete). Drag recognition is distance-based (see PAN_MIN_DISTANCE)
// so a fast flick still counts as a drag instead of being dropped.
const DRAG_HOLD_MS = 250;

// Movement past this many pixels commits the gesture to a move/resize drag,
// regardless of how quickly it happened.
const PAN_MIN_DISTANCE = 8;

// Optional peer dep — if present at runtime the require() succeeds,
// otherwise haptics are a no-op (same pattern as whats-new/utils/haptics).
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch {
  // expo-haptics not installed — haptics are optional
}

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
  /**
   * Whether dragging a note to move/resize it snaps to whole 16th-note
   * steps (default) or moves/resizes freely at exact pixel resolution.
   * Placing a *new* note (tap on empty grid) always snaps regardless of
   * this flag — matches the melodic-sequencer reference behavior.
   */
  snapToGrid?: boolean;
  /** Drum clips only — when true (the default), notes can't be resized
   * longer: a one-shot sample doesn't sustain just because the note block
   * got longer. Irrelevant for non-drum instrument types. */
  lockNoteDuration?: boolean;
  /** Notes currently held during live recording — rendered as a growing
   * "in progress" preview from the press beat to the live playhead. */
  recordingNotes?: RecordingNotePreviewData[];
  /** Whether the transport is playing; draws the playhead inside the
   * horizontally scrolling Skia content when true. */
  isPlaying?: boolean;
  /** Live playhead X position (pixels), updated on the UI thread via a
   * SharedValue. Also drives recordingNotes previews. */
  playheadPosX?: SharedValue<number>;
  /** Fired on horizontal scroll with the visible beat range [start, end) — lets
   * callers (e.g. the bar-range pill selector) show which bars are in view. */
  onVisibleBeatRangeChange?: (start: number, end: number) => void;
  /** Fired on horizontal scroll with the raw scroll-x pixel offset — lets
   * callers keep another horizontally-scrolling view (e.g. NotePrecisionPanel,
   * which shares the same beat-to-pixel scale) in sync. */
  onScrollXChange?: (x: number) => void;
  /** Live velocity override for a single note, keyed by index into `notes` —
   * mirrors an in-progress velocity-handle drag on NotePrecisionPanel so this
   * note's color updates in real time instead of only once the drag commits. */
  velocityPreview?: { noteIndex: number; velocity: number } | null;
}

/** Imperative handle for scrolling the grid programmatically (e.g. to jump to an isolated bar, or to mirror another view's scroll position). */
export interface SkiaPianoRollGridHandle {
  scrollToX: (x: number, animated?: boolean) => void;
}

export const SkiaPianoRollGrid = memo(forwardRef<SkiaPianoRollGridHandle, SkiaPianoRollGridProps>(function SkiaPianoRollGrid({
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
  isPlaying = false,
  snapToGrid = false,
  lockNoteDuration,
  recordingNotes,
  playheadPosX,
  onVisibleBeatRangeChange,
  onScrollXChange,
  velocityPreview,
}: SkiaPianoRollGridProps, ref) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  // Fallback SharedValue when no live playhead is supplied (e.g. not
  // recording) — recordingNotes is empty in that case, so this stays unused.
  const internalPlayheadPosX = useSharedValue(0);
  const effectivePlayheadPosX = playheadPosX ?? internalPlayheadPosX;

  // Computed here (not module scope) so CanvasKit is ready when matchFont runs
  const noteFont = useMemo(
    () =>
      matchFont({ fontFamily: 'monospace', fontSize: 9, fontWeight: '600' }),
    []
  );

  const isDrum = instrumentType === 'drum';
  // Locked (notes can't resize) by default for drum clips — only relevant
  // for drum, and only unlocked if the clip's own flag explicitly says so.
  const isNoteResizeLocked = isDrum && (lockNoteDuration ?? true);
  const basePitch = isDrum ? 0 : (melodicMinPitch ?? DEFAULT_MELODIC_MIN_PITCH);
  const totalPitches = isDrum
    ? (samples ?? []).length || 12 // Use exact sample count (no minimum)
    : MELODIC_PITCH_COUNT;

  // Measure available height for expanded mode
  const [containerH, setContainerH] = useState(0);
  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerH(e.nativeEvent.layout.height);
  }, []);

  // When expanded: grow row height to fill available space (matching native behavior)
  // Native: isExpandedAndDrum ? max(28, availableH / pitchCount) : 34
  const MIN_EXPANDED_ROW = 28;
  const effectiveRowHeight =
    isExpanded && containerH > 0
      ? Math.max(MIN_EXPANDED_ROW, containerH / totalPitches)
      : rowHeight;

  // Scroll ref — keep the offset inside the current content bounds. Android
  // can retain an old offset after the content width shrinks, which exposes
  // the black viewport past the end of the Skia canvas.
  const hScrollRef = useRef<any>(null);
  const scrollXRef = useRef(0);

  const availableGridWidth = screenWidth - LABEL_COL_WIDTH;
  const stepWidth = (availableGridWidth / 16) * zoomLevel;
  const beatWidth = stepWidth * 4;
  const gridWidth = lengthInBeats * beatWidth;
  const maxScrollX = Math.max(0, gridWidth - availableGridWidth);

  const scrollToX = useCallback(
    (x: number, animated = true) => {
      const clampedX = Math.max(0, Math.min(x, maxScrollX));
      scrollXRef.current = clampedX;
      hScrollRef.current?.scrollTo?.({ x: clampedX, animated });
    },
    [maxScrollX]
  );

  useImperativeHandle(ref, () => ({ scrollToX }), [scrollToX]);

  const prevZoom = useRef(zoomLevel);
  useEffect(() => {
    if (zoomLevel < prevZoom.current) {
      // Zoomed out — clamp scroll to prevent blank space on the right.
      scrollToX(0, false);
    }
    prevZoom.current = zoomLevel;
  }, [zoomLevel, scrollToX]);

  // A shorter clip can make the previous offset invalid before the native
  // ScrollView clamps itself. Move to the last visible bar immediately.
  useEffect(() => {
    const clampedX = Math.min(scrollXRef.current, maxScrollX);
    if (clampedX === scrollXRef.current) return;
    scrollToX(clampedX, false);
    onVisibleBeatRangeChange?.(
      clampedX / beatWidth,
      (clampedX + availableGridWidth) / beatWidth
    );
    onScrollXChange?.(clampedX);
  }, [
    maxScrollX,
    beatWidth,
    availableGridWidth,
    onVisibleBeatRangeChange,
    onScrollXChange,
    scrollToX,
  ]);

  const handleGridScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const scrollX = Math.max(
        0,
        Math.min(e.nativeEvent.contentOffset.x, maxScrollX)
      );
      scrollXRef.current = scrollX;
      onVisibleBeatRangeChange?.(scrollX / beatWidth, (scrollX + availableGridWidth) / beatWidth);
      onScrollXChange?.(scrollX);
    },
    [onVisibleBeatRangeChange, onScrollXChange, beatWidth, availableGridWidth, maxScrollX]
  );

  // Report the initial viewport (scroll resets to 0 on zoom-out above) so the
  // bar selector's "in viewport" state isn't empty before the first scroll.
  useEffect(() => {
    onVisibleBeatRangeChange?.(0, availableGridWidth / beatWidth);
  }, [onVisibleBeatRangeChange, beatWidth, availableGridWidth]);
  const gridHeight = totalPitches * effectiveRowHeight;
  const totalSteps = lengthInBeats * 4;
  const playheadP1 = useDerivedValue(() =>
    vec(effectivePlayheadPosX.value, 0)
  );
  const playheadP2 = useDerivedValue(() =>
    vec(effectivePlayheadPosX.value, gridHeight)
  );

  // Build the grid path once — memoized on dimensions only (not notes)
  const gridPath = useMemo(() => {
    // PathBuilder exists in the app's Skia runtime; the UI package's local
    // Skia types can lag the app version, so keep this narrowed escape hatch
    // local to the migration away from deprecated SkPath mutations.
    const builder = (Skia as any).PathBuilder.Make();

    // Horizontal row lines
    for (let i = 0; i <= totalPitches; i++) {
      const y = i * effectiveRowHeight;
      builder.moveTo(0, y).lineTo(gridWidth, y);
    }

    // Vertical step lines
    for (let i = 0; i <= totalSteps; i++) {
      const x = i * stepWidth;
      builder.moveTo(x, 0).lineTo(x, gridHeight);
    }

    return builder.detach();
  }, [
    totalPitches,
    effectiveRowHeight,
    gridWidth,
    totalSteps,
    stepWidth,
    gridHeight,
  ]);

  // Column background colors — alternating per beat, matching native's
  // makeBackgroundNotes (vertical bands, not per-row horizontal stripes).
  const colBgColor1 = colors.mcBlack3;
  const colBgColor2 = colors.mcBlack2;

  // Pitch label helpers
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
        ? Array.from({ length: totalPitches }, (_, i) => {
            const sample = (samples ?? [])[i];

            if (!sample)
              console.warn(
                `[PianoRoll] No sample for drum row ${i}, samples length: ${samples?.length ?? 0}`
              );
            return sample?.noteNumber ?? i;
          })
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

  const hitTestNote = useCallback(
    (x: number, y: number) =>
      hitTestPianoRollNote(notes, x, y, pianoRollMathContext),
    [notes, pianoRollMathContext]
  );

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
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragW = useSharedValue(0);
  // Which note index is currently being dragged (-1 = none).
  // React state — only set on drag start/end (2 renders per gesture, not per frame).
  const [activeNoteIdx, setActiveNoteIdx] = useState(-1);

  // Resize handle position while dragging — tracks the live shared values so
  // the handle stays glued to the note body instead of disappearing.
  const dragHandleP1 = useDerivedValue(() =>
    vec(dragX.value + dragW.value - 3, dragY.value + 4)
  );
  const dragHandleP2 = useDerivedValue(() =>
    vec(
      dragX.value + dragW.value - 3,
      dragY.value + (effectiveRowHeight - 2) - 4
    )
  );

  // Note label position while dragging — same idea as the handle, so the
  // label stays glued to the note instead of disappearing during a drag.
  const dragLabelX = useDerivedValue(() => dragX.value + 4);
  const dragLabelY = useDerivedValue(
    () => dragY.value + (effectiveRowHeight - 2) - 4
  );

  // Drag state mirrored as shared values for worklet access
  const dragType = useSharedValue(0); // 0 = none, 1 = move, 2 = resize
  const dragStartX = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  const dragOrigPos = useSharedValue(0);
  const dragOrigDur = useSharedValue(0);
  const dragOrigRow = useSharedValue(0);
  // Touch point at onBegin (first contact) — see handleDragStart.
  const dragBeginX = useSharedValue(0);
  const dragBeginY = useSharedValue(0);

  // --- JS callbacks (scheduled from gesture worklets onto the React Native JS runtime) ---
  const handleTap = useCallback(
    (x: number, y: number) => {
      const hit = hitTestNote(x, y);
      if (hit) {
        onNotePress?.(hit.idx);
      } else if (onGridTap) {
        const target = getGridPointNoteTarget(x, y, pianoRollMathContext);
        if (target) onGridTap(target.noteNumber, target.position);
      }
    },
    [hitTestNote, onNotePress, onGridTap, pianoRollMathContext]
  );

  const handleDragStart = useCallback(
    (x: number, y: number, hitX: number, hitY: number) => {
      // Hit-test (and therefore the move-vs-resize decision) uses the touch
      // point from the moment the finger first landed (onBegin), not where
      // it ended up once the long-press hold finished (onStart). RNGH allows
      // up to PAN_MIN_DISTANCE of drift during that hold before failing the
      // gesture, and on narrow notes that drift alone can cross into the
      // resize zone — turning an intended move into an accidental resize
      // (most visible on Android, where that drift shows up more often).
      const hit = hitTestNote(hitX, hitY);
      if (!hit) {
        dragState.current = null;
        dragType.value = 0;
        setActiveNoteIdx(-1);
        return;
      }
      setActiveNoteIdx(hit.idx);
      // Confirm entering drag mode so a hold-then-move feels intentional.
      Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
      const note = notes[hit.idx]!;
      // Drum notes never resize — a one-shot sample doesn't sustain just
      // because the note block got longer, so any drag on a drum note is
      // always a move, regardless of where it started.
      const isResizeEdge = !isNoteResizeLocked && hit.isResizeEdge;
      dragState.current = {
        type: isResizeEdge ? 'resize' : 'move',
        noteIdx: hit.idx,
        startX: x,
        startY: y,
        origPosition: note.position,
        origDuration: note.duration,
        origNoteNumber: note.noteNumber,
      };
      // Mirror to shared values for worklet access
      dragType.value = isResizeEdge ? 2 : 1;
      dragStartX.value = x;
      dragStartY.value = y;
      dragOrigPos.value = note.position;
      dragOrigDur.value = note.duration;
      dragOrigRow.value = getPianoRollNoteRect(
        note,
        pianoRollMathContext
      ).rowIdx;
      // Seed the live preview at the note's current rect — the note switches
      // to these shared values on this same render, but onUpdate only fires
      // once the finger moves, so stale values from a previous drag would
      // otherwise teleport the note while it's just being held.
      const seed = getDragPreviewSeed(
        note,
        isResizeEdge,
        pianoRollMathContext
      );
      dragX.value = seed.x;
      dragY.value = seed.y;
      dragW.value = seed.width;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reanimated SharedValues are stable refs
    [hitTestNote, notes, isNoteResizeLocked, pianoRollMathContext]
  );

  // Drag update — pure worklet, reads/writes shared values only.
  // Runs on UI thread every gesture frame. Skia picks up changes on next GPU frame.
  // Captures JS constants via closure (stepWidth, beatWidth, effectiveRowHeight, totalPitches are stable numbers).
  const swRef = stepWidth;
  const bwRef = beatWidth;
  const rhRef = effectiveRowHeight;
  const tpRef = totalPitches;
  const lengthRef = lengthInBeats;
  const snapRef = snapToGrid;

  const handleDragEnd = useCallback(
    (x: number, y: number) => {
      const ds = dragState.current;
      if (!ds) return;
      const dx = x - ds.startX;

      if (ds.type === 'resize') {
        onNoteResize?.(
          ds.noteIdx,
          getResizedNoteDuration(
            ds.origDuration,
            dx,
            pianoRollMathContext,
            ds.origPosition,
            snapRef
          )
        );
      } else {
        const target = getMovedNoteTarget(
          {
            startX: ds.startX,
            startY: ds.startY,
            endX: x,
            endY: y,
            originalPosition: ds.origPosition,
            originalDuration: ds.origDuration,
            originalNoteNumber: ds.origNoteNumber,
          },
          pianoRollMathContext,
          snapRef
        );
        if (
          target.position !== ds.origPosition ||
          target.noteNumber !== ds.origNoteNumber
        ) {
          onNoteMove?.(ds.noteIdx, target.position, target.noteNumber);
        }
      }
      dragState.current = null;
      setActiveNoteIdx(-1);
    },
    [pianoRollMathContext, onNoteResize, onNoteMove, snapRef]
  );

  // --- Gestures (UI thread → scheduleOnRN for callbacks) ---
  // Memoized with useMemo (mandatory for RNGH v2's builder API) — without
  // it, a new gesture object is created on every render, forcing the
  // GestureDetector to tear down and re-attach its recognizers. That reset
  // is what caused the horizontal ScrollView to intermittently "win" a note
  // drag mid-gesture, since the recognizer relationship (Exclusive/
  // Simultaneous) has to be rebuilt from scratch every time.
  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(DRAG_HOLD_MS)
        .onEnd((e) => {
          'worklet';
          scheduleOnRN(handleTap, e.x, e.y);
        }),
    [handleTap]
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        // Let an immediate horizontal swipe belong to the ScrollView. Note moves
        // still work after a short hold, matching the previous note-view gesture.
        // Vertical movement should fail quickly so the outer vertical ScrollView
        // can win instead of the note gesture.
        .activateAfterLongPress(120)
        .failOffsetY([-12, 12])
        .minDistance(PAN_MIN_DISTANCE)
        .onBegin((e) => {
          'worklet';
          // Earliest reliable touch point — before the long-press hold can
          // accumulate drift. See handleDragStart for why this must be kept
          // separate from onStart's (possibly drifted) point.
          dragBeginX.value = e.x;
          dragBeginY.value = e.y;
        })
        .onStart((e) => {
          'worklet';
          scheduleOnRN(
            handleDragStart,
            e.x,
            e.y,
            dragBeginX.value,
            dragBeginY.value
          );
        })
        .onUpdate((e) => {
          'worklet';
          if (dragType.value === 0) return;
          const dx = e.x - dragStartX.value;
          const dy = e.y - dragStartY.value;

          if (dragType.value === 2) {
            // Resize — gradual/free-following outside the magnetic zone around
            // a snap point (grid edge or cell center); eased with withTiming
            // when inside one, so it reads as a smooth glide instead of a jump.
            const maxWidth = (lengthRef - dragOrigPos.value) * bwRef;
            dragX.value = dragOrigPos.value * bwRef;
            if (snapRef) {
              const target = getResizeMagneticTarget(
                dragOrigPos.value,
                dragOrigDur.value,
                dx,
                bwRef,
                swRef,
                maxWidth
              );
              dragW.value = target.isSnapping
                ? withTiming(target.widthPx, { duration: SNAP_EASE_MS })
                : target.widthPx;
            } else {
              const minWidth = swRef * UNSNAPPED_MIN_DURATION_STEPS;
              dragW.value = Math.min(
                maxWidth,
                Math.max(minWidth, dragOrigDur.value * bwRef + dx)
              );
            }
            // Use the note's own row (mirrored at drag start), not the touch
            // Y — the hit test allows ±12px padding, so the finger can start
            // in the adjacent row.
            dragY.value = dragOrigRow.value * rhRef + 1;
          } else {
            // Move
            const target = getMovedGridTarget(
              dx,
              dy,
              dragOrigPos.value,
              dragOrigRow.value,
              swRef,
              rhRef,
              tpRef,
              lengthRef - dragOrigDur.value,
              snapRef
            );
            dragX.value = target.position * bwRef;
            dragY.value = target.rowIdx * rhRef + 1;
            dragW.value = dragOrigDur.value * bwRef - 1;
          }
        })
        .onEnd((e) => {
          'worklet';
          scheduleOnRN(handleDragEnd, e.x, e.y);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reanimated SharedValues (dragType, dragStartX/Y, dragBeginX/Y, dragOrig*, dragX/Y/W) are stable refs
    [handleDragStart, handleDragEnd, swRef, bwRef, rhRef, tpRef, lengthRef, snapRef]
  );

  // Pinch-to-zoom — matches iOS MagnificationGesture behavior
  const pinchStartZoom = useSharedValue(1);
  const handlePinchZoom = useCallback(
    (newZoom: number) => {
      onZoomChange?.(Math.max(1, Math.min(3, newZoom)));
    },
    [onZoomChange]
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          'worklet';
          pinchStartZoom.value = zoomLevel;
        })
        .onUpdate((e) => {
          'worklet';
          scheduleOnRN(handlePinchZoom, pinchStartZoom.value * e.scale);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pinchStartZoom is a stable SharedValue ref
    [handlePinchZoom, zoomLevel]
  );

  const composedGesture = useMemo(
    () => Gesture.Simultaneous(pinchGesture, Gesture.Exclusive(panGesture, tapGesture)),
    [pinchGesture, panGesture, tapGesture]
  );

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      <ScrollView style={styles.scrollV} nestedScrollEnabled>
        <View style={styles.row}>
          {/* Pitch labels — React Views (interactive, need text) */}
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
                          ? getSelectedLabelColor(pitchColor)
                          : hasName
                            ? pitchColor
                            : hexToRgba(pitchColor, 0.6),
                      ...(selectedPitchIndex === pitchIdx
                        ? { borderWidth: 2, borderColor: colors.mcWhite }
                        : null),
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

          {/* Grid — Skia Canvas (single GPU draw) */}
          <ScrollView
            ref={hScrollRef}
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.gridScroll}
            onScroll={handleGridScroll}
            scrollEventThrottle={100}
          >
            <View style={{ width: gridWidth, height: gridHeight }}>
              <Canvas style={StyleSheet.absoluteFill}>
                {/* Column backgrounds — alternating per beat, matching native */}
                {Array.from(
                  { length: Math.ceil(totalSteps / 4) },
                  (_, i) => (
                    <Rect
                      key={`bg${i}`}
                      x={i * beatWidth}
                      y={0}
                      width={beatWidth}
                      height={gridHeight}
                      color={i % 2 === 0 ? colBgColor1 : colBgColor2}
                    />
                  )
                )}

                {/* Grid lines — single path, one draw call, uniform weight */}
                <SkiaPath
                  path={gridPath}
                  color={GRID_LINE_COLOR}
                  style="stroke"
                  strokeWidth={0.5}
                />

                {/* Notes — styled to match AudioKit PianoRoll */}
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
                  const r = 3;
                  const isDragging = idx === activeNoteIdx;
                  const liveVelocity =
                    velocityPreview?.noteIndex === idx
                      ? velocityPreview.velocity
                      : note.velocity;
                  const noteColor = getVelocityColor(
                    noteColors?.[note.noteNumber] ?? trackColor,
                    liveVelocity
                  );

                  return (
                    <React.Fragment key={`n${idx}`}>
                      {/* Note body — uses shared values when dragging, static values otherwise */}
                      <RoundedRect
                        x={isDragging ? dragX : x}
                        y={isDragging ? dragY : y}
                        width={isDragging ? dragW : w}
                        height={h}
                        r={r}
                        color={noteColor}
                        opacity={1}
                      />
                      <RoundedRect
                        x={isDragging ? dragX : x}
                        y={isDragging ? dragY : y}
                        width={isDragging ? dragW : w}
                        height={h}
                        r={r}
                        color="#000000"
                        style="stroke"
                        strokeWidth={0.5}
                      />
                      {/* Resize handle — omitted for drum notes entirely,
                       * not just disabled: a one-shot sample doesn't sustain
                       * just because the note block is longer, so showing a
                       * grip here would promise an edit that has no audible
                       * effect. */}
                      {!isNoteResizeLocked && (
                        <Line
                          p1={isDragging ? dragHandleP1 : vec(x + w - 3, y + 4)}
                          p2={isDragging ? dragHandleP2 : vec(x + w - 3, y + h - 4)}
                          color="rgba(0,0,0,0.3)"
                          strokeWidth={2}
                        />
                      )}
                      {/* Note label — when enabled + note wide enough */}
                      {(() => {
                        if (!showNoteLabels || w <= 18) return null;
                        // For melodic: show note name (C4, D#5, etc.)
                        // For drums: show sample name (Kick, Snare, etc.)
                        const labelText = isDrum
                          ? ((samples ?? [])
                              .find((s) => s.noteNumber === note.noteNumber)
                              ?.name?.slice(0, 6) ?? '')
                          : getNoteName(note.noteNumber);
                        if (!labelText) return null;
                        // While dragging, skip the bounds clip (its rect
                        // would need to track the drag too) and follow the
                        // live shared-value position instead of disappearing.
                        if (isDragging) {
                          return (
                            <SkiaText
                              key={`label${idx}`}
                              x={dragLabelX}
                              y={dragLabelY}
                              text={labelText}
                              font={noteFont}
                              color="white"
                            />
                          );
                        }
                        // Clip text to note bounds
                        return (
                          <Group
                            key={`label${idx}`}
                            clip={{ x, y, width: w, height: h }}
                          >
                            <SkiaText
                              x={x + 4}
                              y={y + h - 4}
                              text={labelText}
                              font={noteFont}
                              color="white"
                            />
                          </Group>
                        );
                      })()}
                    </React.Fragment>
                  );
                })}

                {/* Live recording preview — grows from press beat to the
                    playhead as the key is held, before it's committed. */}
                {(recordingNotes ?? []).map((rn, i) => {
                  let pitchIdx: number;
                  if (isDrum) {
                    const si = (samples ?? []).findIndex(
                      (s) => s.noteNumber === rn.noteNumber
                    );
                    pitchIdx = si >= 0 ? si : 0;
                  } else {
                    pitchIdx = rn.noteNumber - basePitch;
                  }
                  const rowIdx = totalPitches - 1 - pitchIdx;
                  const wrappedStart =
                    lengthInBeats > 0
                      ? rn.startBeat % lengthInBeats
                      : rn.startBeat;
                  const x = wrappedStart * beatWidth;
                  const color = noteColors?.[rn.noteNumber] ?? trackColor;
                  return (
                    <RecordingNotePreview
                      key={`rec${rn.noteNumber}-${i}`}
                      x={x}
                      rowIdx={rowIdx}
                      effectiveRowHeight={effectiveRowHeight}
                      playheadPosX={effectivePlayheadPosX}
                      color={color}
                    />
                  );
                })}

                {/* Keep the playhead in the same Skia content layer as the
                    notes. It then scrolls and composites with the grid as one
                    native-rendered surface instead of being a JS sibling. */}
                {isPlaying && (
                  <Line
                    p1={playheadP1}
                    p2={playheadP2}
                    color={colors.mcOrange3}
                    strokeWidth={2}
                  />
                )}
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
      {showControls && (
        <View style={styles.zoomControls}>
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
}));

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
