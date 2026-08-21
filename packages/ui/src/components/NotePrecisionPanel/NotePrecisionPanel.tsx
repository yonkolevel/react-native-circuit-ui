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
import Animated, {
  scrollTo,
  useAnimatedStyle,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Text } from '../Text';
import { Icon, Icons } from '../SFSymbol';
import { useTheme } from '../../theme';
import type { ClipNote } from '../../features/playground/types';
import {
  getMovedGridTarget,
  getResizedNoteDuration,
  getVelocityColor,
} from '../PianoRoll/pianoRollMath';

const AnimatedScrollView = Animated.createAnimatedComponent(GHScrollView);

/** Mirrors SkiaPianoRollGrid's scroll-owner ids — see the comment there. */
const SCROLL_OWNER_PANEL = 1;

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
  /** Shared velocity preview consumed directly by both Skia canvases. */
  velocityPreviewNoteIndex?: SharedValue<number>;
  velocityPreviewValue?: SharedValue<number>;
  onPositionChange?: (noteIndex: number, newPosition: number) => void;
  onDurationChange?: (noteIndex: number, newDuration: number) => void;
  /** Fired on horizontal scroll with the raw scroll-x pixel offset — lets
   * callers keep the piano roll grid above (which shares the same
   * beat-to-pixel scale) in sync. */
  onScrollXChange?: (x: number) => void;
  /** Shared horizontal scroll offset (pixels) linking this panel to the piano
   * roll grid above — see SkiaPianoRollGridProps.scrollX. */
  scrollX?: SharedValue<number>;
  scrollOwner?: SharedValue<number>;
  /** Live zoom relative to the committed one while the zoom scrubber handle is
   * dragged — see SkiaPianoRollGridProps.zoomPreview. Scaled here too so this
   * panel's timeline stays locked to the grid above during the drag. */
  zoomPreview?: SharedValue<number>;
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
        velocityPreviewNoteIndex,
        velocityPreviewValue,
        onPositionChange,
        onDurationChange,
        onScrollXChange,
        scrollX,
        scrollOwner,
        zoomPreview,
        snapToGrid = false,
        lockNoteDuration = false,
      }: NotePrecisionPanelProps,
      ref
    ) {
      const { colors } = useTheme();
      const hScrollRef = useAnimatedRef<any>();
      // Shared, not a ref: reportScroll below is scheduled from worklets, so
      // its closure is serialized (see the same note in SkiaPianoRollGrid).
      const lastReportedScrollX = useSharedValue(0);
      useImperativeHandle(
        ref,
        () => ({
          scrollToX: (x: number, animated = true) => {
            hScrollRef.current?.scrollTo?.({ x, animated });
          },
        }),
        [hScrollRef]
      );
      const reportScroll = useCallback(
        (x: number, force = false) => {
          if (!force && x !== 0 && Math.abs(x - lastReportedScrollX.value) < 8)
            return;
          lastReportedScrollX.value = x;
          onScrollXChange?.(x);
        },
        [onScrollXChange, lastReportedScrollX]
      );
      // Scrolling this panel keeps the grid above locked to it entirely on the
      // UI runtime — the RN runtime only hears about the offset the gesture
      // finished on.
      const scrollHandler = useAnimatedScrollHandler({
        onBeginDrag: () => {
          if (scrollOwner) scrollOwner.value = SCROLL_OWNER_PANEL;
        },
        onScroll: (event) => {
          if (scrollX && scrollOwner?.value === SCROLL_OWNER_PANEL) {
            scrollX.value = Math.max(0, event.contentOffset.x);
          }
        },
        onEndDrag: (event) => {
          scheduleOnRN(reportScroll, Math.max(0, event.contentOffset.x), true);
        },
        onMomentumEnd: (event) => {
          scheduleOnRN(reportScroll, Math.max(0, event.contentOffset.x), true);
        },
      });
      useAnimatedReaction(
        () => scrollX?.value ?? 0,
        (x) => {
          if (!scrollX || scrollOwner?.value === SCROLL_OWNER_PANEL) return;
          scrollTo(hScrollRef, x, 0, false);
        }
      );

      const zoomPreviewStyle = useAnimatedStyle(() => {
        const scale = zoomPreview?.value ?? 1;
        const anchor = scrollX?.value ?? 0;
        return {
          transform: [
            // Scale about the viewport's left edge — the same anchor the grid
            // above uses — instead of the content's start.
            { translateX: -(scale - 1) * anchor },
            { scaleX: scale },
          ],
        };
      });

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

      // Continuous edit previews stay on the UI runtime. React/store state
      // changes only once when a gesture commits on release.
      const positionDragIndex = useSharedValue(-1);
      const positionDragDx = useSharedValue(0);
      const durationDragIndex = useSharedValue(-1);
      const durationDragDx = useSharedValue(0);
      const velocityDragIndex = useSharedValue(-1);
      const internalVelocityPreviewNoteIndex = useSharedValue(-1);
      const internalVelocityPreviewValue = useSharedValue(0);
      const liveVelocityNoteIndex =
        velocityPreviewNoteIndex ?? internalVelocityPreviewNoteIndex;
      const liveVelocity = velocityPreviewValue ?? internalVelocityPreviewValue;
      const velocityColors = useMemo(
        () =>
          Array.from({ length: 128 }, (_, velocity) =>
            getVelocityColor(trackColor, velocity)
          ),
        [trackColor]
      );
      const velocityTextWidths = useMemo(
        () =>
          Array.from(
            { length: 128 },
            (_, velocity) => velFont.measureText(String(velocity)).width
          ),
        [velFont]
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
            <AnimatedScrollView
              ref={hScrollRef}
              horizontal
              showsHorizontalScrollIndicator
              style={{ flex: 1 }}
              onScroll={scrollHandler}
              scrollEventThrottle={16}
            >
              <Animated.View
                style={[
                  { width: Math.max(totalWidth, totalWidth + HANDLE_W) },
                  styles.zoomPreviewLayer,
                  zoomPreviewStyle,
                ]}
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
                    {notesAtPitch.map(({ note }, i) => (
                      <PrecisionNoteBlock
                        key={i}
                        index={i}
                        note={note}
                        stepWidth={stepWidth}
                        beatWidth={beatWidth}
                        totalBeats={totalBeats}
                        totalWidth={totalWidth}
                        snapToGrid={snapToGrid}
                        lockNoteDuration={lockNoteDuration}
                        positionDragIndex={positionDragIndex}
                        positionDragDx={positionDragDx}
                        durationDragIndex={durationDragIndex}
                        durationDragDx={durationDragDx}
                        velocityDragIndex={velocityDragIndex}
                        velocityPreviewValue={liveVelocity}
                        velocityColors={velocityColors}
                      />
                    ))}
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
                          globalIndex={notesAtPitch[i]!.globalIdx}
                          note={note}
                          x={x}
                          width={w - edgeW}
                          type="position"
                          stepWidth={stepWidth}
                          beatWidth={beatWidth}
                          totalBeats={totalBeats}
                          totalWidth={totalWidth}
                          snapToGrid={snapToGrid}
                          dragIndex={positionDragIndex}
                          dragDx={positionDragDx}
                          onCommit={onPositionChange}
                        />
                        {!lockNoteDuration && (
                          <PrecisionBlockDrag
                            index={i}
                            globalIndex={notesAtPitch[i]!.globalIdx}
                            note={note}
                            x={x + w - edgeW}
                            width={edgeW}
                            type="duration"
                            stepWidth={stepWidth}
                            beatWidth={beatWidth}
                            totalBeats={totalBeats}
                            totalWidth={totalWidth}
                            snapToGrid={snapToGrid}
                            dragIndex={durationDragIndex}
                            dragDx={durationDragDx}
                            onCommit={onDurationChange}
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

                    {/* Handles and stems consume the velocity SharedValue directly. */}
                    {notesAtPitch.map(({ note }, i) => (
                      <VelocityHandleDrawing
                        key={i}
                        index={i}
                        note={note}
                        stepWidth={stepWidth}
                        velAreaH={velAreaH}
                        trackColor={trackColor}
                        font={velFont}
                        textWidths={velocityTextWidths}
                        velocityDragIndex={velocityDragIndex}
                        velocityPreviewValue={liveVelocity}
                      />
                    ))}
                  </Canvas>

                  {/* Drag touch targets — INSIDE the scroll container */}
                  {notesAtPitch.map(({ note }, i) => {
                    // Keep the gesture target anchored while its visual handle
                    // previews the dragged velocity; moving the target itself
                    // would rebuild the active gesture mid-drag.
                    const g = getVelocityGeometry(
                      note,
                      note.velocity,
                      stepWidth,
                      velAreaH
                    );
                    return (
                      <VelDragTarget
                        key={`dt${i}`}
                        index={i}
                        globalIndex={notesAtPitch[i]!.globalIdx}
                        initialVelocity={note.velocity}
                        x={g.handleX - 8}
                        y={g.handleY - 8}
                        usableHeight={velAreaH - BOTTOM_PAD - HANDLE_H}
                        velocityDragIndex={velocityDragIndex}
                        velocityPreviewNoteIndex={liveVelocityNoteIndex}
                        velocityPreviewValue={liveVelocity}
                        onCommit={onVelocityChange}
                      />
                    );
                  })}
                </View>
              </Animated.View>
            </AnimatedScrollView>
          </View>
        </View>
      );
    }
  )
);

const getLivePosition = (
  note: ClipNote,
  dx: number,
  stepWidth: number,
  totalBeats: number,
  snapToGrid: boolean
): number => {
  'worklet';
  return getMovedGridTarget(
    dx,
    0,
    note.position,
    0,
    stepWidth,
    1,
    1,
    Math.max(0, totalBeats - note.duration),
    snapToGrid
  ).position;
};

const getLiveDuration = (
  note: ClipNote,
  dx: number,
  beatWidth: number,
  stepWidth: number,
  totalBeats: number,
  totalWidth: number,
  snapToGrid: boolean
): number => {
  'worklet';
  return Math.min(
    Math.max(0, totalBeats - note.position),
    Math.max(
      MIN_NOTE_DURATION,
      getResizedNoteDuration(
        note.duration,
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
        note.position,
        snapToGrid
      )
    )
  );
};

const getVelocityGeometry = (
  note: ClipNote,
  velocity: number,
  stepWidth: number,
  velAreaH: number
) => {
  'worklet';
  const fraction = velocity / 127;
  const baseline = velAreaH - BOTTOM_PAD;
  const stemH = Math.max(0, fraction * (baseline - HANDLE_H));
  const handleX = (note.position / 0.25) * stepWidth;
  return {
    fraction,
    handleX,
    handleY: baseline - stemH - HANDLE_H,
    stemX: handleX + HANDLE_W,
    stemTop: baseline - stemH,
    stemH,
  };
};

const PrecisionNoteBlock = memo(function PrecisionNoteBlock({
  index,
  note,
  stepWidth,
  beatWidth,
  totalBeats,
  totalWidth,
  snapToGrid,
  lockNoteDuration,
  positionDragIndex,
  positionDragDx,
  durationDragIndex,
  durationDragDx,
  velocityDragIndex,
  velocityPreviewValue,
  velocityColors,
}: {
  index: number;
  note: ClipNote;
  stepWidth: number;
  beatWidth: number;
  totalBeats: number;
  totalWidth: number;
  snapToGrid: boolean;
  lockNoteDuration: boolean;
  positionDragIndex: SharedValue<number>;
  positionDragDx: SharedValue<number>;
  durationDragIndex: SharedValue<number>;
  durationDragDx: SharedValue<number>;
  velocityDragIndex: SharedValue<number>;
  velocityPreviewValue: SharedValue<number>;
  velocityColors: string[];
}) {
  const x = useDerivedValue(() => {
    const position =
      positionDragIndex.value === index
        ? getLivePosition(
            note,
            positionDragDx.value,
            stepWidth,
            totalBeats,
            snapToGrid
          )
        : note.position;
    return (position / 0.25) * stepWidth;
  });
  const width = useDerivedValue(() => {
    const duration =
      durationDragIndex.value === index
        ? getLiveDuration(
            note,
            durationDragDx.value,
            beatWidth,
            stepWidth,
            totalBeats,
            totalWidth,
            snapToGrid
          )
        : note.duration;
    return Math.max((duration / 0.25) * stepWidth - 1, stepWidth * 0.5);
  });
  const color = useDerivedValue(() => {
    const velocity =
      velocityDragIndex.value === index
        ? velocityPreviewValue.value
        : note.velocity;
    return velocityColors[Math.max(0, Math.min(127, Math.round(velocity)))]!;
  });
  const handleP1 = useDerivedValue(() => vec(x.value + width.value - 3, 6));
  const handleP2 = useDerivedValue(() =>
    vec(x.value + width.value - 3, NOTE_AREA_H - 6)
  );

  return (
    <>
      <RoundedRect
        x={x}
        y={2}
        width={width}
        height={NOTE_AREA_H - 4}
        r={3}
        color={color}
      />
      <RoundedRect
        x={x}
        y={2}
        width={width}
        height={NOTE_AREA_H - 4}
        r={3}
        color="#000000"
        style="stroke"
        strokeWidth={0.5}
      />
      {!lockNoteDuration && (
        <Line
          p1={handleP1}
          p2={handleP2}
          color="rgba(0,0,0,0.3)"
          strokeWidth={2}
        />
      )}
    </>
  );
});

const VelocityHandleDrawing = memo(function VelocityHandleDrawing({
  index,
  note,
  stepWidth,
  velAreaH,
  trackColor,
  font,
  textWidths,
  velocityDragIndex,
  velocityPreviewValue,
}: {
  index: number;
  note: ClipNote;
  stepWidth: number;
  velAreaH: number;
  trackColor: string;
  font: ReturnType<typeof matchFont>;
  textWidths: number[];
  velocityDragIndex: SharedValue<number>;
  velocityPreviewValue: SharedValue<number>;
}) {
  const velocity = useDerivedValue(() =>
    velocityDragIndex.value === index
      ? velocityPreviewValue.value
      : note.velocity
  );
  const handleY = useDerivedValue(
    () => getVelocityGeometry(note, velocity.value, stepWidth, velAreaH).handleY
  );
  const stemTop = useDerivedValue(
    () => getVelocityGeometry(note, velocity.value, stepWidth, velAreaH).stemTop
  );
  const stemH = useDerivedValue(
    () => getVelocityGeometry(note, velocity.value, stepWidth, velAreaH).stemH
  );
  const handleOpacity = useDerivedValue(
    () => 0.3 + 0.7 * (velocity.value / 127)
  );
  const velocityText = useDerivedValue(() =>
    String(Math.round(velocity.value))
  );
  const textX = useDerivedValue(() => {
    const value = Math.max(0, Math.min(127, Math.round(velocity.value)));
    const handleX = (note.position / 0.25) * stepWidth;
    return handleX + (HANDLE_W - textWidths[value]!) / 2;
  });
  const textY = useDerivedValue(() => handleY.value + HANDLE_H - 4);
  const handleX = (note.position / 0.25) * stepWidth;
  const stemX = handleX + HANDLE_W;

  return (
    <>
      <Rect
        x={stemX - STEM_W / 2}
        y={stemTop}
        width={STEM_W}
        height={stemH}
        color={trackColor}
        opacity={0.4}
      />
      <Rect
        x={handleX}
        y={handleY}
        width={HANDLE_W}
        height={HANDLE_H}
        color={trackColor}
        opacity={handleOpacity}
      />
      <Rect
        x={handleX}
        y={handleY}
        width={HANDLE_W}
        height={HANDLE_H}
        color="rgba(255,255,255,0.3)"
        style="stroke"
        strokeWidth={0.5}
      />
      <SkiaText
        x={textX}
        y={textY}
        text={velocityText}
        font={font}
        color="white"
      />
    </>
  );
});

/** Drag target for note block position or duration adjustment. */
const PrecisionBlockDrag = memo(function PrecisionBlockDrag({
  index,
  globalIndex,
  note,
  x,
  width,
  type,
  stepWidth,
  beatWidth,
  totalBeats,
  totalWidth,
  snapToGrid,
  dragIndex,
  dragDx,
  onCommit,
}: {
  index: number;
  globalIndex: number;
  note: ClipNote;
  x: number;
  width: number;
  type: 'position' | 'duration';
  stepWidth: number;
  beatWidth: number;
  totalBeats: number;
  totalWidth: number;
  snapToGrid: boolean;
  dragIndex: SharedValue<number>;
  dragDx: SharedValue<number>;
  onCommit?: (noteIndex: number, value: number) => void;
}) {
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(type === 'duration' ? 2 : 4)
        .onStart(() => {
          'worklet';
          dragIndex.value = index;
          dragDx.value = 0;
        })
        .onUpdate((e) => {
          'worklet';
          dragDx.value = e.translationX;
        })
        .onEnd((e, success) => {
          'worklet';
          if (!success) return;
          const value =
            type === 'position'
              ? getLivePosition(
                  note,
                  e.translationX,
                  stepWidth,
                  totalBeats,
                  snapToGrid
                )
              : getLiveDuration(
                  note,
                  e.translationX,
                  beatWidth,
                  stepWidth,
                  totalBeats,
                  totalWidth,
                  snapToGrid
                );
          dragIndex.value = -1;
          dragDx.value = 0;
          if (onCommit) scheduleOnRN(onCommit, globalIndex, value);
        })
        .onFinalize((_e, success) => {
          'worklet';
          if (success) return;
          dragIndex.value = -1;
          dragDx.value = 0;
        }),
    [
      beatWidth,
      dragDx,
      dragIndex,
      globalIndex,
      index,
      note,
      onCommit,
      snapToGrid,
      stepWidth,
      totalBeats,
      totalWidth,
      type,
    ]
  );

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
  globalIndex,
  initialVelocity,
  x,
  y,
  usableHeight,
  velocityDragIndex,
  velocityPreviewNoteIndex,
  velocityPreviewValue,
  onCommit,
}: {
  index: number;
  globalIndex: number;
  initialVelocity: number;
  x: number;
  y: number;
  usableHeight: number;
  velocityDragIndex: SharedValue<number>;
  velocityPreviewNoteIndex: SharedValue<number>;
  velocityPreviewValue: SharedValue<number>;
  onCommit?: (noteIndex: number, velocity: number) => void;
}) {
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          'worklet';
          velocityDragIndex.value = index;
          velocityPreviewNoteIndex.value = globalIndex;
          velocityPreviewValue.value = initialVelocity;
        })
        .onUpdate((e) => {
          'worklet';
          const delta = (-e.translationY / usableHeight) * 127;
          velocityPreviewValue.value = Math.round(
            Math.max(1, Math.min(127, initialVelocity + delta))
          );
        })
        .onEnd((_e, success) => {
          'worklet';
          if (!success) return;
          const velocity = velocityPreviewValue.value;
          velocityDragIndex.value = -1;
          velocityPreviewNoteIndex.value = -1;
          if (onCommit) scheduleOnRN(onCommit, globalIndex, velocity);
        })
        .onFinalize((_e, success) => {
          'worklet';
          if (success) return;
          velocityDragIndex.value = -1;
          velocityPreviewNoteIndex.value = -1;
        }),
    [
      globalIndex,
      index,
      initialVelocity,
      onCommit,
      usableHeight,
      velocityDragIndex,
      velocityPreviewNoteIndex,
      velocityPreviewValue,
    ]
  );

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
  // Anchor the live-zoom scale to the left edge; the translate in
  // zoomPreviewStyle moves that anchor to the viewport.
  zoomPreviewLayer: { transformOrigin: 'left center' },
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
