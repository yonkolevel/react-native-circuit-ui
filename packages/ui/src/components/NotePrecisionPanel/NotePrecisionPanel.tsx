/**
 * NotePrecisionPanel — matches iOS NotePrecisionPanel.swift + VelocityHandle.swift
 *
 * Handle shape (inverted L):
 *   [vel##]┃
 *          ┃ stem
 *          ┃
 *   ───────┃─── baseline
 *
 * Handle RIGHT edge = stem LEFT edge. Handle extends LEFT.
 */
import React, {
  memo,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useCallback,
  useRef,
  useState,
} from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import {
  ScrollView as GHScrollView,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import {
  Canvas,
  Rect,
  RoundedRect,
  Line,
  vec,
  Text as SkiaText,
  matchFont,
} from '@shopify/react-native-skia';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { Text } from '../Text';
import { Icon, Icons } from '../SFSymbol';
import { useTheme } from '../../theme';
import type { ClipNote } from '../../features/playground/types';
import {
  getMovedGridTarget,
  getResizedNoteDuration,
  getVelocityColor,
} from '../PianoRoll/pianoRollMath';

const LABEL_COL = 60;
const BEAT_LABEL_H = 16;
const NOTE_AREA_H = 36;
// Fixed velocity-handle width — independent of the timeline's step width
// (which now matches the piano roll grid above, and can be quite wide/narrow).
const HANDLE_W = 24;
const HANDLE_H = 16;
const STEM_W = 2;
const BOTTOM_PAD = 32; // space below velocity 0 — keeps handles reachable
const BEATS_PER_BAR = 4;
const STEPS_PER_BEAT = 4;
// A note can be dragged arbitrarily close to any position here, but never
// resized smaller than one 16th-note step — matches the piano roll's floor.
const MIN_NOTE_DURATION = 0.25;

const VEL_LEVELS = [
  { vel: 127, label: '127' },
  { vel: 95, label: '95' },
  { vel: 64, label: '64' },
  { vel: 32, label: '32' },
  { vel: 0, label: '0' },
];

export interface NotePrecisionPanelProps {
  notes: ClipNote[];
  pitchIndex: number;
  pitchLabel: string;
  pitchMidiNumber: number;
  activeLengthInBars: number;
  trackColor: string;
  /** Pixel width of one beat step — pass the same value used by the piano
   * roll grid above so this panel's timeline lines up with it exactly. */
  stepWidth: number;
  onClose?: () => void;
  onVelocityChange?: (noteIndex: number, velocity: number) => void;
  /** Fired continuously while a velocity handle is being dragged (and once
   * more with `null` on release) — lets the piano roll grid above mirror the
   * in-progress value live, without touching the undo-tracked store on
   * every drag tick the way a committed onVelocityChange call would. */
  onVelocityPreview?: (noteIndex: number, velocity: number | null) => void;
  onPositionChange?: (noteIndex: number, newPosition: number) => void;
  onDurationChange?: (noteIndex: number, newDuration: number) => void;
  /** Fired on horizontal scroll with the raw scroll-x pixel offset — lets
   * callers keep the piano roll grid above (which shares the same
   * beat-to-pixel scale) in sync. */
  onScrollXChange?: (x: number) => void;
  /** Match the piano roll's move/resize snapping semantics. */
  snapToGrid?: boolean;
  /** Drum one-shots omit duration editing when locked. */
  lockNoteDuration?: boolean;
}

/** Imperative handle for scrolling the panel programmatically (e.g. to mirror the piano roll grid's scroll position). */
export interface NotePrecisionPanelHandle {
  scrollToX: (x: number, animated?: boolean) => void;
}

export const NotePrecisionPanel = memo(
  forwardRef<NotePrecisionPanelHandle, NotePrecisionPanelProps>(
    function NotePrecisionPanel(
      {
        notes,
        pitchLabel,
        pitchMidiNumber,
        activeLengthInBars,
        trackColor,
        stepWidth,
        onClose,
        onVelocityChange,
        onVelocityPreview,
        onPositionChange,
        onDurationChange,
        onScrollXChange,
        snapToGrid = false,
        lockNoteDuration = false,
      }: NotePrecisionPanelProps,
      ref
    ) {
      const { colors } = useTheme();
      const hScrollRef = useRef<any>(null);
      const lastReportedScrollX = useRef(0);
      useImperativeHandle(
        ref,
        () => ({
          scrollToX: (x: number, animated = true) => {
            hScrollRef.current?.scrollTo?.({ x, animated });
          },
        }),
        []
      );
      const reportScroll = useCallback(
        (x: number, force = false) => {
          if (
            !force &&
            x !== 0 &&
            Math.abs(x - lastReportedScrollX.current) < 8
          )
            return;
          lastReportedScrollX.current = x;
          onScrollXChange?.(x);
        },
        [onScrollXChange]
      );
      const handleScroll = useCallback(
        (e: { nativeEvent: { contentOffset: { x: number } } }) => {
          reportScroll(e.nativeEvent.contentOffset.x);
        },
        [reportScroll]
      );
      const flushScroll = useCallback(
        (e: { nativeEvent: { contentOffset: { x: number } } }) => {
          reportScroll(e.nativeEvent.contentOffset.x, true);
        },
        [reportScroll]
      );

      // Computed here so CanvasKit is ready when matchFont runs (avoids web crash)
      const velFont = useMemo(
        () =>
          matchFont({
            fontFamily: 'monospace',
            fontSize: 8,
            fontWeight: '600',
          }),
        []
      );

      const notesAtPitch = useMemo(
        () =>
          notes
            .map((n, i) => ({ note: n, globalIdx: i }))
            .filter((x) => x.note.noteNumber === pitchMidiNumber),
        [notes, pitchMidiNumber]
      );

      const totalSteps = activeLengthInBars * BEATS_PER_BAR * STEPS_PER_BEAT;
      const totalWidth = totalSteps * stepWidth;
      const totalBeats = activeLengthInBars * BEATS_PER_BAR;
      const beatWidth = stepWidth * STEPS_PER_BEAT;

      const [velAreaH, setVelAreaH] = useState(120);

      // Velocity drag state
      const [dragIdx, setDragIdx] = useState(-1);
      const [dragVel, setDragVel] = useState(0);
      const dragStartY = useRef(0);
      const dragStartVel = useRef(0);
      const dragIdxRef = useRef(-1);
      const dragVelRef = useRef(0);
      const lastRenderedDragVel = useRef(0);
      const lastPreviewVelocity = useRef<{
        noteIndex: number;
        velocity: number;
      } | null>(null);

      // Position drag state (horizontal drag on note block body)
      const [posBlockDragIdx, setPosBlockDragIdx] = useState(-1);
      const [posBlockDragDx, setPosBlockDragDx] = useState(0);
      const posBlockStartX = useRef(0);

      // Duration drag state (horizontal drag on note block right edge)
      const [durBlockDragIdx, setDurBlockDragIdx] = useState(-1);
      const [durBlockDragDx, setDurBlockDragDx] = useState(0);
      const durBlockStartX = useRef(0);

      const handleVelDragStart = useCallback(
        (idx: number, y: number) => {
          const entry = notesAtPitch[idx];
          if (!entry) return;
          dragIdxRef.current = idx;
          dragStartY.current = y;
          dragStartVel.current = entry.note.velocity;
          dragVelRef.current = entry.note.velocity;
          lastRenderedDragVel.current = entry.note.velocity;
          setDragIdx(idx);
          setDragVel(entry.note.velocity);
        },
        [notesAtPitch]
      );

      const handleVelDragUpdate = useCallback(
        (y: number) => {
          const dy = y - dragStartY.current;
          const usableH = velAreaH - BOTTOM_PAD - HANDLE_H;
          const delta = (-dy / usableH) * 127;
          const newVel = Math.round(
            Math.max(1, Math.min(127, dragStartVel.current + delta))
          );
          dragVelRef.current = newVel;
          if (Math.abs(lastRenderedDragVel.current - newVel) >= 4) {
            lastRenderedDragVel.current = newVel;
            setDragVel(newVel);
          }
          const idx = dragIdxRef.current;
          if (idx >= 0 && idx < notesAtPitch.length) {
            const globalIdx = notesAtPitch[idx]!.globalIdx;
            const previous = lastPreviewVelocity.current;
            if (
              !previous ||
              previous.noteIndex !== globalIdx ||
              Math.abs(previous.velocity - newVel) >= 4
            ) {
              lastPreviewVelocity.current = {
                noteIndex: globalIdx,
                velocity: newVel,
              };
              onVelocityPreview?.(globalIdx, newVel);
            }
          }
        },
        [velAreaH, notesAtPitch, onVelocityPreview]
      );

      const handleVelDragEnd = useCallback(() => {
        const idx = dragIdxRef.current;
        const vel = dragVelRef.current;
        if (idx >= 0 && idx < notesAtPitch.length) {
          onVelocityChange?.(notesAtPitch[idx]!.globalIdx, vel);
          lastPreviewVelocity.current = null;
          onVelocityPreview?.(notesAtPitch[idx]!.globalIdx, null);
        }
        setDragVel(vel);
        dragIdxRef.current = -1;
        setDragIdx(-1);
      }, [notesAtPitch, onVelocityChange, onVelocityPreview]);

      // Reuse the piano-roll math so this precision surface follows the same
      // snap and clip-boundary rules as the main editor.
      const getLivePosition = useCallback(
        (originalPosition: number, originalDuration: number, dx: number) => {
          const maxPosition = Math.max(0, totalBeats - originalDuration);
          return getMovedGridTarget(
            dx,
            0,
            originalPosition,
            0,
            stepWidth,
            1,
            1,
            maxPosition,
            snapToGrid
          ).position;
        },
        [stepWidth, totalBeats, snapToGrid]
      );
      const getLiveDuration = useCallback(
        (originalDuration: number, originalPosition: number, dx: number) => {
          const maxDuration = Math.max(0, totalBeats - originalPosition);
          return Math.min(
            maxDuration,
            Math.max(
              MIN_NOTE_DURATION,
              getResizedNoteDuration(
                originalDuration,
                dx,
                {
                  beatWidth,
                  stepWidth,
                  gridWidth: totalWidth,
                  isDrum: false,
                  basePitch: 0,
                  totalPitches: 1,
                  rowHeight: NOTE_AREA_H,
                  pitchToMidi: [],
                },
                originalPosition,
                snapToGrid
              )
            )
          );
        },
        [beatWidth, stepWidth, totalBeats, totalWidth, snapToGrid]
      );

      // Position drag handlers
      const handlePosBlockDragStart = useCallback((idx: number, x: number) => {
        setPosBlockDragIdx(idx);
        setPosBlockDragDx(0);
        posBlockStartX.current = x;
      }, []);
      const handlePosBlockDragUpdate = useCallback((x: number) => {
        setPosBlockDragDx(x - posBlockStartX.current);
      }, []);
      const handlePosBlockDragEnd = useCallback(
        (x: number) => {
          if (posBlockDragIdx >= 0 && posBlockDragIdx < notesAtPitch.length) {
            const dx = x - posBlockStartX.current;
            const note = notesAtPitch[posBlockDragIdx]!.note;
            const newPos = getLivePosition(note.position, note.duration, dx);
            onPositionChange?.(
              notesAtPitch[posBlockDragIdx]!.globalIdx,
              newPos
            );
          }
          setPosBlockDragIdx(-1);
          setPosBlockDragDx(0);
        },
        [posBlockDragIdx, notesAtPitch, onPositionChange, getLivePosition]
      );

      // Duration drag handlers
      const handleDurBlockDragStart = useCallback((idx: number, x: number) => {
        setDurBlockDragIdx(idx);
        setDurBlockDragDx(0);
        durBlockStartX.current = x;
      }, []);
      const handleDurBlockDragUpdate = useCallback((x: number) => {
        setDurBlockDragDx(x - durBlockStartX.current);
      }, []);
      const handleDurBlockDragEnd = useCallback(
        (x: number) => {
          if (durBlockDragIdx >= 0 && durBlockDragIdx < notesAtPitch.length) {
            const dx = x - durBlockStartX.current;
            const note = notesAtPitch[durBlockDragIdx]!.note;
            const newDur = getLiveDuration(note.duration, note.position, dx);
            onDurationChange?.(
              notesAtPitch[durBlockDragIdx]!.globalIdx,
              newDur
            );
          }
          setDurBlockDragIdx(-1);
          setDurBlockDragDx(0);
        },
        [durBlockDragIdx, notesAtPitch, onDurationChange, getLiveDuration]
      );

      /** Compute handle + stem geometry for a note (matches native VelocityHandle positioning) */
      const noteGeom = useCallback(
        (note: ClipNote, vel: number) => {
          const fraction = vel / 127;
          const baseline = velAreaH - BOTTOM_PAD; // velocity 0 sits here
          const usableH = baseline - HANDLE_H; // range from vel 0 to vel 127
          const stemH = Math.max(0, fraction * usableH);

          const noteStartX = (note.position / 0.25) * stepWidth;
          const handleX = noteStartX;
          const stemX = noteStartX + HANDLE_W;
          const handleY = baseline - stemH - HANDLE_H;
          const stemTop = baseline - stemH;

          return {
            noteStartX,
            stemX,
            stemH,
            stemTop,
            handleX,
            handleY,
            fraction,
            baseline,
          };
        },
        [velAreaH, stepWidth]
      );

      return (
        <View style={[styles.container, { backgroundColor: colors.mcBlack2 }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.mcBlack3 }]}>
            <Text
              variant="label"
              color={colors.mcWhite}
              style={{ flex: 1, fontSize: 13 }}
            >
              {pitchLabel}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Icon icon={Icons.close} size={16} color={colors.mcWhite3} />
            </Pressable>
          </View>

          {/* Body: left ruler + scrollable timeline */}
          <View style={styles.body}>
            {/* Left ruler column */}
            <View
              style={[
                styles.leftCol,
                { width: LABEL_COL, backgroundColor: colors.mcBlack2 },
              ]}
            >
              {/* Spacer for beat labels */}
              <View style={{ height: BEAT_LABEL_H }} />
              {/* NOTES label */}
              <View style={{ height: NOTE_AREA_H, justifyContent: 'center' }}>
                <Text
                  variant="extraSmall"
                  color={colors.mcWhite3}
                  center
                  style={styles.tinyLabel}
                >
                  NOTES
                </Text>
              </View>
              {/* Velocity ruler */}
              <View
                style={{ flex: 1 }}
                onLayout={(e) =>
                  setVelAreaH(Math.max(60, e.nativeEvent.layout.height))
                }
              >
                {/* VEL label at top */}
                <Text
                  variant="extraSmall"
                  color={colors.mcWhite3}
                  center
                  style={[styles.tinyLabel, { marginTop: 4 }]}
                >
                  VEL
                </Text>
                {/* Level ticks — positioned to match handle Y for each velocity */}
                {VEL_LEVELS.map((l) => {
                  const fraction = l.vel / 127;
                  const baseline = velAreaH - BOTTOM_PAD;
                  const usableH = baseline - HANDLE_H;
                  const stemH = fraction * usableH;
                  const y = baseline - stemH - HANDLE_H / 2;
                  return (
                    <View key={l.label} style={[styles.rulerTick, { top: y }]}>
                      <Text
                        variant="extraSmall"
                        color={colors.mcWhite3}
                        style={styles.rulerNum}
                      >
                        {l.label}
                      </Text>
                      <View style={styles.rulerDash} />
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Scrollable timeline — SINGLE ScrollView for everything */}
            <GHScrollView
              ref={hScrollRef}
              horizontal
              showsHorizontalScrollIndicator
              style={{ flex: 1 }}
              onScroll={handleScroll}
              onScrollEndDrag={flushScroll}
              onMomentumScrollEnd={flushScroll}
              scrollEventThrottle={100}
            >
              <View
                style={{ width: Math.max(totalWidth, totalWidth + HANDLE_W) }}
              >
                {/* Beat labels */}
                <View style={{ height: BEAT_LABEL_H, flexDirection: 'row' }}>
                  {Array.from({ length: totalBeats }, (_, i) => (
                    <Text
                      key={i}
                      variant="extraSmall"
                      color={colors.mcWhite3}
                      style={{
                        width: STEPS_PER_BEAT * stepWidth,
                        fontSize: 8,
                        paddingLeft: 2,
                      }}
                    >
                      {Math.floor(i / BEATS_PER_BAR) + 1}.
                      {(i % BEATS_PER_BAR) + 1}
                    </Text>
                  ))}
                </View>

                {/* Note blocks — draggable for position + duration */}
                <View style={{ height: NOTE_AREA_H }}>
                  <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
                    {/* Half-step lines give a finer visual reference than the
                    step grid alone, now that dragging here is always free. */}
                    {Array.from({ length: totalSteps * 2 + 1 }, (_, h) => {
                      const isBeat = h % (STEPS_PER_BEAT * 2) === 0;
                      const isStep = h % 2 === 0;
                      return (
                        <Line
                          key={h}
                          p1={vec(h * (stepWidth / 2), 0)}
                          p2={vec(h * (stepWidth / 2), NOTE_AREA_H)}
                          color={
                            isBeat
                              ? 'rgba(255,255,255,0.2)'
                              : isStep
                                ? 'rgba(255,255,255,0.06)'
                                : 'rgba(255,255,255,0.03)'
                          }
                          strokeWidth={0.5}
                        />
                      );
                    })}
                    {notesAtPitch.map(({ note }, i) => {
                      const livePos =
                        i === posBlockDragIdx
                          ? getLivePosition(
                              note.position,
                              note.duration,
                              posBlockDragDx
                            )
                          : note.position;
                      const liveDur =
                        i === durBlockDragIdx
                          ? getLiveDuration(
                              note.duration,
                              note.position,
                              durBlockDragDx
                            )
                          : note.duration;
                      const x = (livePos / 0.25) * stepWidth;
                      const w = Math.max(
                        (liveDur / 0.25) * stepWidth - 1,
                        stepWidth * 0.5
                      );
                      // Matches the piano roll grid's note styling exactly,
                      // including velocity-scaled lightness — reads dragVel live
                      // while this note's own velocity handle is being dragged,
                      // same as the stem/handle below already do.
                      const y = 2;
                      const h = NOTE_AREA_H - 4;
                      const liveVelocity =
                        i === dragIdx ? dragVel : note.velocity;
                      return (
                        <React.Fragment key={i}>
                          <RoundedRect
                            x={x}
                            y={y}
                            width={w}
                            height={h}
                            r={3}
                            color={getVelocityColor(trackColor, liveVelocity)}
                            opacity={1}
                          />
                          <RoundedRect
                            x={x}
                            y={y}
                            width={w}
                            height={h}
                            r={3}
                            color="#000000"
                            style="stroke"
                            strokeWidth={0.5}
                          />
                          {!lockNoteDuration && (
                            <Line
                              p1={vec(x + w - 3, y + 4)}
                              p2={vec(x + w - 3, y + h - 4)}
                              color="rgba(0,0,0,0.3)"
                              strokeWidth={2}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </Canvas>
                  {/* Gesture targets: body = position drag, right edge = duration drag */}
                  {notesAtPitch.map(({ note }, i) => {
                    const x = (note.position / 0.25) * stepWidth;
                    const w = Math.max(
                      (note.duration / 0.25) * stepWidth,
                      stepWidth
                    );
                    const edgeW = 12;
                    return (
                      <React.Fragment key={`bg${i}`}>
                        <PrecisionBlockDrag
                          index={i}
                          x={x}
                          width={w - edgeW}
                          type="position"
                          onStart={handlePosBlockDragStart}
                          onUpdate={handlePosBlockDragUpdate}
                          onEnd={handlePosBlockDragEnd}
                        />
                        {!lockNoteDuration && (
                          <PrecisionBlockDrag
                            index={i}
                            x={x + w - edgeW}
                            width={edgeW}
                            type="duration"
                            onStart={handleDurBlockDragStart}
                            onUpdate={handleDurBlockDragUpdate}
                            onEnd={handleDurBlockDragEnd}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                  {notesAtPitch.length === 0 && (
                    <View style={styles.emptyState}>
                      <Text variant="small" color={colors.mcWhite3}>
                        No notes at {pitchLabel}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Velocity area — canvas + handles + labels ALL inside the scroll */}
                <View style={{ height: velAreaH }}>
                  <Canvas style={StyleSheet.absoluteFill}>
                    {/* Grid lines — aligned with handle center positions */}
                    {VEL_LEVELS.map((l) => {
                      const fraction = l.vel / 127;
                      const baseline = velAreaH - BOTTOM_PAD;
                      const usableH = baseline - HANDLE_H;
                      const stemH = fraction * usableH;
                      const y = baseline - stemH - HANDLE_H / 2;
                      return (
                        <Line
                          key={l.label}
                          p1={vec(0, y)}
                          p2={vec(totalWidth, y)}
                          color="rgba(255,255,255,0.08)"
                          strokeWidth={0.5}
                        />
                      );
                    })}
                    {/* Baseline at velocity 0 */}
                    <Line
                      p1={vec(0, velAreaH - BOTTOM_PAD)}
                      p2={vec(totalWidth, velAreaH - BOTTOM_PAD)}
                      color="rgba(255,255,255,0.15)"
                      strokeWidth={0.5}
                    />

                    {/* Stems — thin line from handle down to baseline */}
                    {notesAtPitch.map(({ note }, i) => {
                      const vel = i === dragIdx ? dragVel : note.velocity;
                      const g = noteGeom(note, vel);
                      return (
                        <Rect
                          key={`s${i}`}
                          x={g.stemX - STEM_W / 2}
                          y={g.stemTop}
                          width={STEM_W}
                          height={g.stemH}
                          color={trackColor}
                          opacity={0.4}
                        />
                      );
                    })}

                    {/* Handles — square rect with velocity number inside (all Skia, same GPU frame) */}
                    {notesAtPitch.map(({ note }, i) => {
                      const vel = i === dragIdx ? dragVel : note.velocity;
                      const g = noteGeom(note, vel);
                      const velStr = String(vel);
                      // Center text in handle: measure width, offset to center
                      const textW = velFont.measureText(velStr).width;
                      const textX = g.handleX + (HANDLE_W - textW) / 2;
                      const textY = g.handleY + HANDLE_H - 4; // baseline offset
                      return (
                        <React.Fragment key={`h${i}`}>
                          <Rect
                            x={g.handleX}
                            y={g.handleY}
                            width={HANDLE_W}
                            height={HANDLE_H}
                            color={trackColor}
                            opacity={0.3 + 0.7 * g.fraction}
                          />
                          <Rect
                            x={g.handleX}
                            y={g.handleY}
                            width={HANDLE_W}
                            height={HANDLE_H}
                            color="rgba(255,255,255,0.3)"
                            style="stroke"
                            strokeWidth={0.5}
                          />
                          <SkiaText
                            x={textX}
                            y={textY}
                            text={velStr}
                            font={velFont}
                            color="white"
                          />
                        </React.Fragment>
                      );
                    })}
                  </Canvas>

                  {/* Drag touch targets — INSIDE the scroll container */}
                  {notesAtPitch.map(({ note }, i) => {
                    // Keep the gesture target anchored while its visual handle
                    // previews the dragged velocity; moving the target itself
                    // would rebuild the active gesture mid-drag.
                    const g = noteGeom(note, note.velocity);
                    return (
                      <VelDragTarget
                        key={`dt${i}`}
                        index={i}
                        x={g.handleX - 8}
                        y={g.handleY - 8}
                        updateThresholdPx={Math.max(
                          2,
                          (4 * (velAreaH - BOTTOM_PAD - HANDLE_H)) / 127
                        )}
                        onDragStart={handleVelDragStart}
                        onDragUpdate={handleVelDragUpdate}
                        onDragEnd={handleVelDragEnd}
                      />
                    );
                  })}
                </View>
              </View>
            </GHScrollView>
          </View>
        </View>
      );
    }
  )
);

/** Drag target for note block position or duration adjustment */
const PrecisionBlockDrag = memo(function PrecisionBlockDrag({
  index,
  x,
  width,
  type,
  onStart,
  onUpdate,
  onEnd,
}: {
  index: number;
  x: number;
  width: number;
  type: 'position' | 'duration';
  onStart: (idx: number, x: number) => void;
  onUpdate: (x: number) => void;
  onEnd: (x: number) => void;
}) {
  const gesture = Gesture.Pan()
    .minDistance(type === 'duration' ? 2 : 4)
    .onStart((e) => {
      'worklet';
      runOnJS(onStart)(index, e.absoluteX);
    })
    .onUpdate((e) => {
      'worklet';
      runOnJS(onUpdate)(e.absoluteX);
    })
    .onEnd((e) => {
      'worklet';
      runOnJS(onEnd)(e.absoluteX);
    });

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={{
          position: 'absolute',
          left: x,
          top: 0,
          width: Math.max(width, 12),
          height: NOTE_AREA_H,
        }}
      />
    </GestureDetector>
  );
});

const VelDragTarget = memo(function VelDragTarget({
  index,
  x,
  y,
  onDragStart,
  onDragUpdate,
  onDragEnd,
  updateThresholdPx,
}: {
  index: number;
  x: number;
  y: number;
  onDragStart: (idx: number, y: number) => void;
  onDragUpdate: (y: number) => void;
  onDragEnd: () => void;
  updateThresholdPx: number;
}) {
  const lastUpdateY = useSharedValue(0);
  const gesture = Gesture.Pan()
    .onStart((e) => {
      'worklet';
      lastUpdateY.value = e.absoluteY;
      runOnJS(onDragStart)(index, e.absoluteY);
    })
    .onUpdate((e) => {
      'worklet';
      if (Math.abs(e.absoluteY - lastUpdateY.value) < updateThresholdPx) return;
      lastUpdateY.value = e.absoluteY;
      runOnJS(onDragUpdate)(e.absoluteY);
    })
    .onEnd(() => {
      'worklet';
      runOnJS(onDragEnd)();
    });

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: HANDLE_W + 16,
          height: HANDLE_H + 16,
        }}
      />
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 28,
  },
  body: { flex: 1, flexDirection: 'row' },
  leftCol: { borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.1)' },
  tinyLabel: { fontSize: 8, fontWeight: '600' },
  rulerTick: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    left: 2,
    right: 0,
  },
  rulerNum: { fontSize: 7, width: 20, textAlign: 'right', marginRight: 4 },
  rulerDash: { flex: 1, height: 0.5, backgroundColor: 'rgba(255,255,255,0.1)' },
  emptyState: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
