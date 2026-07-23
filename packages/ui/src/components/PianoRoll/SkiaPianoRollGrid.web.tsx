/**
 * SkiaPianoRollGrid — Web implementation using standard React Native Views.
 *
 * Matches the native SkiaPianoRollGrid.tsx layout and behaviour:
 * - Labels + grid pan vertically together, grid pans horizontally, both via
 *   a manually-driven CSS transform rather than native scroll (see the
 *   comment above GRID_TOUCH_ACTION_STYLE for why)
 * - Tap notes to delete, tap grid rows to add, tap pitch labels to select
 * - Zoom controls, expand toggle
 * - Same row heights, colours, and sizing math as native
 */
import {
  Fragment,
  memo,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import type { LayoutChangeEvent, ViewProps, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
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
  getResizeMagneticTarget,
  getSelectedLabelColor,
  getVelocityColor,
  hitTestPianoRollNote,
  type RecordingNotePreviewData,
} from './pianoRollMath';

const LABEL_COL_WIDTH = 60;
const DEFAULT_MELODIC_MIN_PITCH = 48;
const MELODIC_PITCH_COUNT = 24;

// Snap-zone ease duration for resize live-preview — short enough to feel
// immediate, long enough to read as a glide rather than a jump.
const SNAP_EASE_MS = 90;

// Bright red — reads as "actively recording" against any track color,
// matching the convention most DAWs use for an in-progress take.
const RECORDING_OUTLINE_COLOR = '#FF3B30';

/**
 * Live preview of a note currently held during recording. Grows from its
 * press beat to the live playhead position via a SharedValue read on the UI
 * thread — mirrors the native SkiaPianoRollGrid's RecordingNotePreview.
 */
const RecordingNotePreview = memo(function RecordingNotePreview({
  x,
  rowIdx,
  effectiveRowHeight,
  playheadPosX,
  color,
  loopStartBeat = 0,
  loopBeats = 0,
  beatWidth,
}: {
  x: number;
  rowIdx: number;
  effectiveRowHeight: number;
  playheadPosX: SharedValue<number>;
  color: string;
  loopStartBeat?: number;
  loopBeats?: number;
  beatWidth: number;
}) {
  const y = rowIdx * effectiveRowHeight + 1;
  const h = effectiveRowHeight - 2;
  const animStyle = useAnimatedStyle(() => {
    let delta = playheadPosX.value - x;
    let maxWidth = Number.POSITIVE_INFINITY;
    if (loopBeats > 0) {
      const loopStartX = loopStartBeat * beatWidth;
      const loopEndX = loopStartX + loopBeats * beatWidth;
      maxWidth = Math.max(0, loopEndX - x);
      if (playheadPosX.value < x) {
        delta = loopEndX - x + (playheadPosX.value - loopStartX);
      }
    }
    // The playhead can switch to a new active range while a note is held.
    // Keep the preview bounded by the range captured at note-on.
    return { width: Math.min(maxWidth, Math.max(4, delta)) };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          height: h,
          borderRadius: 3,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: RECORDING_OUTLINE_COLOR,
        },
        animStyle,
      ]}
    />
  );
});

// Matches native's PianoRoll package: every grid line (step, beat, and bar
// boundary alike) is drawn with the same uniform black stroke — no separate
// emphasis tier for beats/bars.
const GRID_LINE_COLOR = '#000000';

const DRAG_THRESHOLD = 4;
// touchAction isn't part of RN's style types — it's a plain web CSS property
// react-native-web passes through as-is. 'none' (not 'pan-y') is required:
// WebKit is free to hijack ANY axis the touch-action allows as a native
// scroll gesture the moment it sees movement on that axis, which raced
// against — and often won over — our own JS drag logic for the vertical
// component of a note move (pitch change). 'none' alone wasn't enough either:
// even with 'none' on this overlay, a fast/high-velocity swipe could still
// get grabbed for a few frames by a native scrollable ANCESTOR's own
// compositor-thread gesture recognizer before touch-action was reconciled on
// the main thread — felt like "moves a little and stops." So there's no
// native scrollable container left anywhere in this tree to race against;
// both axes pan via a manually-driven transform (applyGridTransform /
// applyOuterTransform below), which nothing but our own code ever touches.
const GRID_TOUCH_ACTION_STYLE = { touchAction: 'none' } as unknown as ViewStyle;

// A touch on a note is a resize only when the drag is predominantly
// horizontal AND rightward — any other direction (left, up, down, or a
// diagonal where vertical movement dominates) is a move. Determined once,
// from the first movement that clears DRAG_THRESHOLD, and locked in for the
// rest of the gesture.
const resolveNoteDragType = (dx: number, dy: number): 'move' | 'resize' =>
  dx > 0 && Math.abs(dx) > Math.abs(dy) ? 'resize' : 'move';

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

export const getWebGridTapX = (
  event: WebGridTapEvent,
  precomputedRect?: { left: number }
): number => {
  const nativeEvent = event.nativeEvent ?? {};
  const rect =
    precomputedRect ?? event.currentTarget?.getBoundingClientRect?.();

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
  /** Whether transport playback is active; draws the playhead in the grid. */
  isPlaying?: boolean;
  /** Notes currently held during live recording — rendered as a growing
   * "in progress" preview from the press beat to the live playhead. */
  recordingNotes?: RecordingNotePreviewData[];
  /** Live playhead X position (pixels), updated at display frame rate via a
   * SharedValue — required for recordingNotes previews to grow smoothly
   * without React re-renders. Falls back to a static internal value (no
   * growth) if not provided. */
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

export const SkiaPianoRollGrid = memo(
  forwardRef<SkiaPianoRollGridHandle, SkiaPianoRollGridProps>(
    function SkiaPianoRollGrid(
      {
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
        snapToGrid = false,
        lockNoteDuration,
        isPlaying = false,
        recordingNotes,
        playheadPosX,
        onVisibleBeatRangeChange,
        onScrollXChange,
        velocityPreview,
      }: SkiaPianoRollGridProps,
      ref
    ) {
      const { colors } = useTheme();
      const { width: screenWidth } = useWindowDimensions();
      // Fallback SharedValue when no live playhead is supplied (e.g. not
      // recording) — recordingNotes is empty in that case, so this stays unused.
      const internalPlayheadPosX = useSharedValue(0);
      const effectivePlayheadPosX = playheadPosX ?? internalPlayheadPosX;
      const playheadStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: effectivePlayheadPosX.value }],
      }));
      const containerRef = useRef<any>(null);
      // Content nodes we pan with a raw CSS transform instead of native scroll —
      // see the comment above GRID_TOUCH_ACTION_STYLE for why: a native
      // scrollable ancestor keeps its own compositor-thread gesture recognizer
      // even under touch-action: none on a descendant, and on WebKit that
      // recognizer can still grab a *fast* swipe for a few frames before
      // conceding, which reads as "moves a little and stops." A transform-based
      // pan has no native scrollable ancestor to race against — we are the only
      // thing that ever moves this content, so there's nothing to arbitrate.
      const gridContentRef = useRef<any>(null);
      const rowRef = useRef<any>(null);
      const pointerInteractionRef = useRef<{
        pointerId: number;
        startX: number;
        startY: number;
        scrollStartX: number;
        scrollStartY: number;
        // The overlay's own on-screen position never changes mid-gesture (only
        // its panned *content* does), so this is captured once at pointerdown
        // and reused for the rest of the gesture — calling getBoundingClientRect
        // again on every pointermove would force a synchronous layout flush
        // right after the transform write from the previous frame, and that
        // read-after-write thrashing is what made panning janky on longer clips.
        rectLeft: number;
        rectTop: number;
        // Rolling, low-pass-filtered velocity of the pan offset itself (px/ms,
        // not raw finger movement — see handlePointerMove) for a 'grid' pan,
        // used to seed the momentum coast on pointerup. Filtered rather than a
        // raw last-delta so a fast drag that's held still for a moment before
        // release correctly reads as "stopped," not "still flying."
        lastMoveX: number;
        lastMoveY: number;
        lastMoveT: number;
        velocityX: number;
        velocityY: number;
        noteIndex: number | null;
        // A touch on a note starts as 'note-pending' — move vs. resize isn't
        // decided by where on the note you touched down, it's decided by which
        // way you first drag (see resolveNoteDragType below), matching the
        // melodic-sequencer reference: touch anywhere on the note, then drag
        // right to extend or any other direction to move it. This sidesteps the
        // small-touch-target problem a spatial hit-zone has on short notes.
        type: 'grid' | 'move' | 'resize' | 'note-pending';
        dragging: boolean;
      } | null>(null);
      // Current pan offset on each axis — the transform-based equivalent of a
      // ScrollView's contentOffset — kept in refs (not state) so panning during
      // a drag never triggers a React re-render.
      const panXRef = useRef(0);
      const panYRef = useRef(0);
      const [dragPreview, setDragPreview] = useState<{
        noteIndex: number;
        position: number;
        noteNumber: number;
        duration: number;
        isSnapping: boolean;
      } | null>(null);
      const [keyboardCursor, setKeyboardCursor] = useState({
        pitchIndex: 0,
        step: 0,
      });
      const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);

      const isDrum = instrumentType === 'drum';
      // Locked (notes can't resize) by default for drum clips — only relevant
      // for drum, and only unlocked if the clip's own flag explicitly says so.
      const isNoteResizeLocked = isDrum && (lockNoteDuration ?? true);
      const basePitch = isDrum
        ? 0
        : (melodicMinPitch ?? DEFAULT_MELODIC_MIN_PITCH);
      const totalPitches = isDrum
        ? (samples ?? []).length || 12
        : MELODIC_PITCH_COUNT;

      // Measure container height for expanded mode
      const [containerH, setContainerH] = useState(0);
      const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
        setContainerH(e.nativeEvent.layout.height);
      }, []);

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
      const lastReportedScrollX = useRef(0);
      const reportScroll = useCallback(
        (x: number, force = false) => {
          if (
            !force &&
            x !== 0 &&
            x < Math.max(0, gridWidth - availableGridWidth) &&
            Math.abs(x - lastReportedScrollX.current) < 8
          )
            return;
          lastReportedScrollX.current = x;
          onVisibleBeatRangeChange?.(
            x / beatWidth,
            (x + availableGridWidth) / beatWidth
          );
          onScrollXChange?.(x);
        },
        [
          gridWidth,
          availableGridWidth,
          beatWidth,
          onVisibleBeatRangeChange,
          onScrollXChange,
        ]
      );

      const applyGridTransform = useCallback(
        (x: number, animated = false) => {
          const node = gridContentRef.current;
          const maxX = Math.max(0, gridWidth - availableGridWidth);
          const clamped = Math.max(0, Math.min(maxX, x));
          panXRef.current = clamped;
          if (node?.style) {
            node.style.transition = animated
              ? 'transform 200ms ease-out'
              : 'none';
            node.style.transform = `translateX(${-clamped}px)`;
          }
          reportScroll(clamped);
          return clamped;
        },
        [gridWidth, availableGridWidth, reportScroll]
      );

      const applyOuterTransform = useCallback(
        (y: number, animated = false) => {
          const node = rowRef.current;
          const maxY = Math.max(0, gridHeight - containerH);
          const clamped = Math.max(0, Math.min(maxY, y));
          panYRef.current = clamped;
          if (node?.style) {
            node.style.transition = animated
              ? 'transform 200ms ease-out'
              : 'none';
            node.style.transform = `translateY(${-clamped}px)`;
          }
          return clamped;
        },
        [gridHeight, containerH]
      );

      // Momentum after a fling release — see startMomentum below. Manual
      // panning has no native scroll behind it, so without this a "swipe" reads
      // as a "drag": exact 1:1 tracking that stops dead the instant the finger
      // lifts, instead of coasting proportional to how fast the release was.
      const momentumRafRef = useRef<number | null>(null);

      const cancelMomentum = useCallback(() => {
        if (momentumRafRef.current != null) {
          cancelAnimationFrame(momentumRafRef.current);
          momentumRafRef.current = null;
        }
      }, []);

      const startMomentum = useCallback(
        (vx: number, vy: number) => {
          // px/ms. Below this, a released drag was a deliberate stop, not a
          // flick — don't launch a stray coast off a slow release.
          const MIN_FLING_VELOCITY = 0.15;
          // Exponential decay rate (per ms), tuned so a strong flick coasts for
          // somewhere around half a second, matching native inertia scrolling.
          const FRICTION = 0.006;
          const MIN_MOMENTUM_VELOCITY = 0.02;

          if (Math.hypot(vx, vy) < MIN_FLING_VELOCITY) return;
          cancelMomentum();
          let velocityX = vx;
          let velocityY = vy;
          let lastT = performance.now();
          const step = (now: number) => {
            // Clamp dt so a dropped-frame stall (e.g. tab backgrounded briefly)
            // can't cause one giant jump when the loop resumes.
            const dt = Math.min(48, now - lastT);
            lastT = now;
            const decay = Math.exp(-FRICTION * dt);
            velocityX *= decay;
            velocityY *= decay;
            const prevX = panXRef.current;
            const prevY = panYRef.current;
            const nextX = applyGridTransform(prevX + velocityX * dt);
            const nextY = applyOuterTransform(prevY + velocityY * dt);
            // Pinned against a clamp — that axis can't move further, so stop
            // spending frames on it instead of coasting uselessly into the wall.
            if (nextX === prevX) velocityX = 0;
            if (nextY === prevY) velocityY = 0;
            if (Math.hypot(velocityX, velocityY) < MIN_MOMENTUM_VELOCITY) {
              reportScroll(panXRef.current, true);
              momentumRafRef.current = null;
              return;
            }
            momentumRafRef.current = requestAnimationFrame(step);
          };
          momentumRafRef.current = requestAnimationFrame(step);
        },
        [applyGridTransform, applyOuterTransform, cancelMomentum, reportScroll]
      );

      useImperativeHandle(
        ref,
        () => ({
          scrollToX: (x: number, animated = true) => {
            applyGridTransform(x, animated);
          },
        }),
        [applyGridTransform]
      );

      // Ctrl+scroll → zoom (trackpad pinch or mouse wheel with modifier).
      // Plain wheel/trackpad scroll has to pan manually too, now that there's no
      // native scrollable container to do it for free.
      useEffect(() => {
        const el = containerRef.current;
        if (!el?.addEventListener) return;
        const handleWheel = (ev: WheelEvent) => {
          const wheel = ev as WheelEvent & {
            ctrlKey?: boolean;
            metaKey?: boolean;
            deltaX?: number;
            deltaY?: number;
          };
          ev.preventDefault();
          if (wheel.ctrlKey || wheel.metaKey) {
            const delta = (wheel.deltaY ?? 0) > 0 ? -0.25 : 0.25;
            onZoomChange?.(Math.max(1, Math.min(3, zoomLevel + delta)));
            return;
          }
          applyGridTransform(panXRef.current + (wheel.deltaX ?? 0));
          applyOuterTransform(panYRef.current + (wheel.deltaY ?? 0));
        };
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
      }, [onZoomChange, zoomLevel, applyGridTransform, applyOuterTransform]);

      // Unlike native scrollLeft, a manual transform doesn't auto-correct itself
      // when the content shrinks (e.g. deleting a bar) — without this, a clip
      // scrolled near its old end could be left showing blank space past the
      // new, shorter end until the next drag. Re-clamping here (applyGridTransform
      // already clamps internally) keeps the current pan valid whenever the
      // content size changes, not just when the user actively pans it — this
      // also covers reporting the initial visible range on mount, since it
      // always runs at least once (panXRef.current starts at 0).
      useEffect(() => {
        applyGridTransform(panXRef.current);
      }, [applyGridTransform]);

      useEffect(() => {
        applyOuterTransform(panYRef.current);
      }, [applyOuterTransform]);

      const totalSteps = lengthInBeats * 4;

      const getPitchLabel = useCallback(
        (pitchIdx: number): string => {
          if (isDrum)
            return (samples ?? [])[pitchIdx]?.name ?? `Note ${pitchIdx}`;
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
        pointerInteractionRef.current = null;
        setDragPreview(null);
      }, []);

      useEffect(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          return clearPointerInteraction;
        }
        // A blur/hide interruption stops everything, including any active
        // coast — unlike a normal gesture end (handlePointerUp), which must NOT
        // cancel momentum right after starting it.
        const handleInterruption = () => {
          clearPointerInteraction();
          cancelMomentum();
        };
        const handleVisibilityChange = () => {
          if (document.hidden) handleInterruption();
        };
        window.addEventListener('blur', handleInterruption);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
          window.removeEventListener('blur', handleInterruption);
          document.removeEventListener(
            'visibilitychange',
            handleVisibilityChange
          );
          handleInterruption();
        };
      }, [clearPointerInteraction, cancelMomentum]);

      const getPointerPoint = useCallback(
        (e: WebPointerEvent, cachedRect?: { left: number; top: number }) => {
          const rect = cachedRect ?? e.currentTarget.getBoundingClientRect();
          const nativeEvent = e.nativeEvent;
          return {
            x: getWebGridTapX(e as WebGridTapEvent, rect),
            y: nativeEvent.clientY - rect.top,
          };
        },
        []
      );

      const previewForPointer = useCallback(
        (
          interaction: NonNullable<typeof pointerInteractionRef.current>,
          x: number,
          y: number,
          isFinal: boolean
        ) => {
          if (interaction.noteIndex == null) return null;
          const note = notes[interaction.noteIndex];
          if (!note) return null;

          if (interaction.type === 'resize') {
            const dx = x - interaction.startX;
            // Live preview eases into the magnetic zone around a snap point
            // (grid edge or cell center) instead of jumping there immediately;
            // the final commit always resolves to the nearest snap point.
            if (!isFinal && snapToGrid) {
              const maxWidthPx =
                (lengthInBeats - note.position) *
                pianoRollMathContext.beatWidth;
              const target = getResizeMagneticTarget(
                note.position,
                note.duration,
                dx,
                pianoRollMathContext.beatWidth,
                pianoRollMathContext.stepWidth,
                maxWidthPx
              );
              return {
                noteIndex: interaction.noteIndex,
                position: note.position,
                noteNumber: note.noteNumber,
                duration: target.widthPx / pianoRollMathContext.beatWidth,
                isSnapping: target.isSnapping,
              };
            }
            return {
              noteIndex: interaction.noteIndex,
              position: note.position,
              noteNumber: note.noteNumber,
              duration: getResizedNoteDuration(
                note.duration,
                dx,
                pianoRollMathContext,
                note.position,
                snapToGrid
              ),
              isSnapping: false,
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
            pianoRollMathContext,
            snapToGrid
          );
          return {
            noteIndex: interaction.noteIndex,
            position: moved.position,
            noteNumber: moved.noteNumber,
            duration: note.duration,
            isSnapping: false,
          };
        },
        [notes, pianoRollMathContext, snapToGrid, lengthInBeats]
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
          const rect = e.currentTarget.getBoundingClientRect();
          const { x, y } = getPointerPoint(e, rect);
          const hit = hitTestPianoRollNote(notes, x, y, pianoRollMathContext);
          // Any new touch takes over immediately — including one that lands
          // mid-coast, same as native scroll would.
          cancelMomentum();
          const now = performance.now();
          pointerInteractionRef.current = {
            pointerId: nativeEvent.pointerId,
            startX: x,
            startY: y,
            scrollStartX: panXRef.current,
            scrollStartY: panYRef.current,
            rectLeft: rect.left,
            rectTop: rect.top,
            // Must start in the same coordinate space as the pan value itself
            // (panXRef/panYRef), not the finger's touch position — the first
            // pointermove's velocity sample is (newPan - lastMoveX), and mixing
            // a finger-space seed with a pan-space reading there produces one
            // huge, wrongly-signed spike that poisons the whole EMA.
            lastMoveX: panXRef.current,
            lastMoveY: panYRef.current,
            lastMoveT: now,
            velocityX: 0,
            velocityY: 0,
            noteIndex: hit?.idx ?? null,
            type: hit ? ('note-pending' as const) : ('grid' as const),
            dragging: false,
          };
          // setPointerCapture can throw (e.g. NotFoundError) if the pointer isn't
          // active anymore by the time this runs — don't let that abort the rest
          // of the handler below.
          try {
            e.currentTarget.setPointerCapture?.(nativeEvent.pointerId);
          } catch {
            // ignore — capture is a nice-to-have, not required for the logic below
          }
        },
        [getPointerPoint, notes, pianoRollMathContext, cancelMomentum]
      );

      const handlePointerMove = useCallback(
        (e: WebPointerEvent) => {
          const nativeEvent = e.nativeEvent;
          const interaction = pointerInteractionRef.current;
          if (!interaction || interaction.pointerId !== nativeEvent.pointerId)
            return;
          const { x, y } = getPointerPoint(e, {
            left: interaction.rectLeft,
            top: interaction.rectTop,
          });
          const dx = x - interaction.startX;
          const dy = y - interaction.startY;
          const distance = Math.hypot(dx, dy);
          if (!interaction.dragging && distance < DRAG_THRESHOLD) return;

          if (interaction.type === 'note-pending') {
            // Drum notes never resize — a one-shot sample doesn't sustain just
            // because the note block got longer, so any drag on a drum note is
            // always a move, regardless of drag direction.
            interaction.type = isNoteResizeLocked
              ? 'move'
              : resolveNoteDragType(dx, dy);
          }

          interaction.dragging = true;
          e.preventDefault?.();

          if (interaction.type === 'grid') {
            // The overlay has touch-action: none (see JSX below) and there's no
            // native scrollable container backing either axis anymore (see
            // applyGridTransform/applyOuterTransform) — a grid-area drag has to
            // pan the content transforms itself, or touch users would lose the
            // ability to scroll the piano roll at all.
            const newPanX = applyGridTransform(interaction.scrollStartX - dx);
            const newPanY = applyOuterTransform(interaction.scrollStartY - dy);

            // Velocity is tracked from the actual (clamped) pan value, not raw
            // finger movement — panX moves opposite to finger dx by
            // construction above, and deriving velocity straight from panX
            // keeps the sign correct automatically and zeroes it for free while
            // pinned against an edge.
            const now = performance.now();
            const moveDt = now - interaction.lastMoveT;
            // A near-zero dt (two events landing in the same tick) would divide
            // into a huge, meaningless velocity spike — skip the update rather
            // than let one noisy sample seed an unwanted fling.
            if (moveDt > 1) {
              const instVX = (newPanX - interaction.lastMoveX) / moveDt;
              const instVY = (newPanY - interaction.lastMoveY) / moveDt;
              interaction.velocityX =
                interaction.velocityX * 0.75 + instVX * 0.25;
              interaction.velocityY =
                interaction.velocityY * 0.75 + instVY * 0.25;
              interaction.lastMoveX = newPanX;
              interaction.lastMoveY = newPanY;
              interaction.lastMoveT = now;
            }
            return;
          }

          if (interaction.noteIndex == null) return;
          setDragPreview(previewForPointer(interaction, x, y, false));
        },
        [
          getPointerPoint,
          previewForPointer,
          applyGridTransform,
          applyOuterTransform,
          isNoteResizeLocked,
        ]
      );

      const handlePointerUp = useCallback(
        (e: WebPointerEvent) => {
          const nativeEvent = e.nativeEvent;
          const interaction = pointerInteractionRef.current;
          if (!interaction || interaction.pointerId !== nativeEvent.pointerId)
            return;
          const { x, y } = getPointerPoint(e, {
            left: interaction.rectLeft,
            top: interaction.rectTop,
          });
          const dx = x - interaction.startX;
          const dy = y - interaction.startY;
          const distance = Math.hypot(dx, dy);
          // A fast flick can complete before enough pointermove events land to
          // flip `dragging` — fall back to distance so releasing past the
          // threshold always commits to the final pointer position.
          const wasDragging =
            interaction.dragging || distance >= DRAG_THRESHOLD;

          if (interaction.type === 'grid') {
            reportScroll(panXRef.current, true);
            if (!wasDragging) {
              const target = getGridPointNoteTarget(x, y, pianoRollMathContext);
              if (target) onGridTap?.(target.noteNumber, target.position);
            } else {
              startMomentum(interaction.velocityX, interaction.velocityY);
            }
            clearPointerInteraction();
            return;
          }

          // Same fast-flick case as above, for a note touch: lock in move vs.
          // resize now if no pointermove got the chance to.
          if (wasDragging && interaction.type === 'note-pending') {
            interaction.type = isNoteResizeLocked
              ? 'move'
              : resolveNoteDragType(dx, dy);
          }

          if (wasDragging && interaction.noteIndex != null) {
            const preview = previewForPointer(interaction, x, y, true);
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
            interaction.noteIndex != null &&
            distance < DRAG_THRESHOLD
          ) {
            onNotePress?.(interaction.noteIndex);
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
          reportScroll,
          startMomentum,
          isNoteResizeLocked,
        ]
      );

      const handlePointerTermination = useCallback(
        (e: WebPointerEvent) => {
          if (
            pointerInteractionRef.current?.pointerId === e.nativeEvent.pointerId
          ) {
            reportScroll(panXRef.current, true);
            clearPointerInteraction();
          }
        },
        [clearPointerInteraction, reportScroll]
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
            step: Math.max(
              0,
              Math.min(totalSteps - 1, cursor.step + stepDelta)
            ),
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
          <View style={[styles.scrollV, styles.hidden]}>
            <View ref={rowRef} style={styles.row}>
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

              {/* Grid — horizontal pan */}
              <View style={[styles.gridScroll, styles.hidden]}>
                <View
                  ref={gridContentRef}
                  style={{ width: gridWidth, height: gridHeight }}
                >
                  {/* Column backgrounds — alternating per beat, matching native */}
                  {Array.from(
                    { length: Math.ceil(totalSteps / 4) },
                    (_, colIdx) => (
                      <View
                        key={`col-${colIdx}`}
                        style={{
                          position: 'absolute',
                          left: colIdx * beatWidth,
                          top: 0,
                          width: beatWidth,
                          height: gridHeight,
                          backgroundColor:
                            colIdx % 2 === 0
                              ? colors.mcBlack3
                              : colors.mcBlack2,
                        }}
                      />
                    )
                  )}

                  {/* Step lines — uniform weight, no beat/bar emphasis */}
                  {Array.from({ length: totalSteps + 1 }, (_, i) => (
                    <View
                      key={`v${i}`}
                      style={{
                        position: 'absolute',
                        left: i * stepWidth,
                        top: 0,
                        width: 0.5,
                        height: gridHeight,
                        backgroundColor: GRID_LINE_COLOR,
                      }}
                    />
                  ))}

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

                  {isPlaying && (
                    <Animated.View
                      pointerEvents="none"
                      accessibilityLabel="Playback playhead"
                      style={[
                        styles.playhead,
                        { height: gridHeight },
                        playheadStyle,
                      ]}
                    />
                  )}

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
                    const liveVelocity =
                      velocityPreview?.noteIndex === idx
                        ? velocityPreview.velocity
                        : note.velocity;
                    const noteColor = getVelocityColor(
                      noteColors?.[note.noteNumber] ?? trackColor,
                      liveVelocity
                    );
                    const pitchIndex = Math.max(
                      0,
                      pitchToMidi.indexOf(note.noteNumber)
                    );
                    const moveNote = (
                      stepDelta: number,
                      pitchDelta: number
                    ) => {
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
                      if (
                        shiftKey &&
                        key === 'ArrowLeft' &&
                        !isNoteResizeLocked
                      )
                        resizeNote(-1);
                      else if (
                        shiftKey &&
                        key === 'ArrowRight' &&
                        !isNoteResizeLocked
                      )
                        resizeNote(1);
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
                        <Pressable
                          onPress={() => onNotePress?.(idx)}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete note ${getNoteName(note.noteNumber)} at beat ${note.position}, duration ${note.duration}. Arrow keys move${isNoteResizeLocked ? '' : '; Shift plus Left or Right resizes'}`}
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
                            borderWidth: 0.5,
                            borderColor: '#000000',
                            opacity: 1,
                            // Ease toward a snap point instead of jumping —
                            // only while actively easing, so free-following
                            // stays 1:1 with the pointer.
                            ...(preview?.isSnapping
                              ? ({
                                  transitionProperty: 'left, width',
                                  transitionDuration: `${SNAP_EASE_MS}ms`,
                                  transitionTimingFunction: 'ease-out',
                                } as const)
                              : null),
                            justifyContent: 'center',
                            paddingHorizontal: 4,
                            overflow: 'hidden',
                          }}
                        >
                          {/* Resize handle — omitted for drum notes entirely,
                           * not just disabled: a one-shot sample doesn't sustain
                           * just because the note block is longer, so showing a
                           * grip here would promise an edit that has no audible
                           * effect. */}
                          {!isNoteResizeLocked && (
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
                          {showNoteLabels && rect.width > 18 && (
                            <Text
                              variant="extraSmall"
                              color="rgba(0,0,0,0.6)"
                              numberOfLines={1}
                              style={{ fontSize: 9, fontWeight: '600' }}
                            >
                              {isDrum
                                ? ((samples ?? [])
                                    .find(
                                      (s) =>
                                        s.noteNumber ===
                                        displayedNote.noteNumber
                                    )
                                    ?.name?.slice(0, 6) ?? '')
                                : getNoteName(displayedNote.noteNumber)}
                            </Text>
                          )}
                        </Pressable>
                      </Fragment>
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
                        loopStartBeat={rn.loopStartBeat}
                        loopBeats={rn.loopBeats}
                        beatWidth={beatWidth}
                      />
                    );
                  })}

                  {/* One interaction layer keeps pointer and keyboard editing in grid coordinates.
                   * touch-action: none disables the browser's native pan/scroll on this
                   * element entirely, in both axes — WebKit (all iOS browsers) doesn't
                   * reliably honor touch-action changed dynamically mid-gesture, and
                   * letting it own even one axis (e.g. pan-y) meant native vertical
                   * scroll could hijack the vertical component of a note-move drag
                   * before our own JS ever saw it. All movement (dragging a note,
                   * resizing, or panning the grid over empty space, in either axis) is
                   * therefore always handled manually in JS below. */}
                  <View
                    style={[StyleSheet.absoluteFill, GRID_TOUCH_ACTION_STYLE]}
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
              </View>
            </View>
          </View>

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
    }
  )
);

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  scrollV: { flex: 1 },
  hidden: { overflow: 'hidden' },
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
  playhead: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 1.5,
    backgroundColor: '#FF5C24',
    zIndex: 3,
  },
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
