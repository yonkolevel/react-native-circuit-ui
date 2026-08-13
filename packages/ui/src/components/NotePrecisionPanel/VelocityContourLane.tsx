import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  Canvas,
  Path,
  Rect,
  Skia,
  Text as SkiaText,
  matchFont,
} from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Text } from '../Text';
import type { ClipNote } from '../../features/playground/types';
import {
  sampleContour,
  type VelocityContour,
  type VelocityContourMode,
} from '../../features/playground/core/velocityContour';
import {
  HANDLE_HEIGHT,
  HANDLE_WIDTH,
  TOUCH_DRAW_HOLD_MS,
  TOUCH_DRAW_SLOP,
  bendFromMidpoint,
  contourPreviewVelocities,
  curveFromDrag,
  hitTestVelocityHandle,
  makeVelocityNudge,
  makeVelocityPreset,
  nextPrecisionBand,
  polylineFromPixels,
  rawPolylineFromPixels,
  touchLiftOutcome,
  velocityFromY,
  xForVelocityHandle,
  yForVelocity,
  type LogicalPoint,
  type PrecisionBand,
  type VelocityContourPreview,
  type VelocityHandleCenter,
  type VelocityPreset,
} from './velocityContourAuthoring';

const BOTTOM_PAD = 32;
const STEM_W = 2;
const DRAG_THRESHOLD = 4;
const PRESETS: readonly VelocityPreset[] = [
  'ramp',
  'fade',
  'arch',
  'wave',
  'accent',
];

type Props = {
  notes: readonly ClipNote[];
  noteIndexes: readonly number[];
  beatWidth: number;
  totalBeats: number;
  areaHeight: number;
  trackColor: string;
  preview: SharedValue<VelocityContourPreview | null>;
  scrollOffsetX: SharedValue<number>;
  viewportWidth: number;
  onApply?: (
    contour: VelocityContour,
    mode: VelocityContourMode,
    noteIndexes: readonly number[],
    expectedNotes: readonly ClipNote[]
  ) => boolean;
  onSingleVelocityChange?: (noteIndex: number, velocity: number) => void;
};

const ProposedHandle = memo(function ProposedHandle({
  note,
  globalIndex,
  beatWidth,
  totalBeats,
  areaHeight,
  color,
  preview,
  font,
}: {
  note: ClipNote;
  globalIndex: number;
  beatWidth: number;
  totalBeats: number;
  areaHeight: number;
  color: string;
  preview: SharedValue<VelocityContourPreview | null>;
  font: ReturnType<typeof matchFont>;
}) {
  const velocity = useDerivedValue(
    () => preview.value?.velocities[globalIndex] ?? -1
  );
  const opacity = useDerivedValue(() => (velocity.value >= 0 ? 1 : 0));
  const handleY = useDerivedValue(
    () =>
      yForVelocity(Math.max(0, velocity.value), areaHeight) - HANDLE_HEIGHT / 2
  );
  const stemTop = useDerivedValue(() => handleY.value + HANDLE_HEIGHT);
  const stemHeight = useDerivedValue(() =>
    Math.max(0, areaHeight - BOTTOM_PAD - stemTop.value)
  );
  const label = useDerivedValue(() => String(Math.max(0, velocity.value)));
  const labelY = useDerivedValue(() => handleY.value + 12);
  const x = xForVelocityHandle(note.position, beatWidth, totalBeats);
  return (
    <>
      <Rect
        x={x + HANDLE_WIDTH - STEM_W / 2}
        y={stemTop}
        width={STEM_W}
        height={stemHeight}
        color={color}
        opacity={opacity}
      />
      <Rect
        x={x}
        y={handleY}
        width={HANDLE_WIDTH}
        height={HANDLE_HEIGHT}
        color={color}
        opacity={opacity}
      />
      <Rect
        x={x}
        y={handleY}
        width={HANDLE_WIDTH}
        height={HANDLE_HEIGHT}
        color="white"
        opacity={opacity}
        style="stroke"
        strokeWidth={1}
      />
      <SkiaText
        x={x + 3}
        y={labelY}
        text={label}
        font={font}
        color="white"
        opacity={opacity}
      />
    </>
  );
});

export const VelocityContourLane = memo(function VelocityContourLane({
  notes,
  noteIndexes,
  beatWidth,
  totalBeats,
  areaHeight,
  trackColor,
  preview,
  scrollOffsetX,
  viewportWidth,
  onApply,
  onSingleVelocityChange,
}: Props) {
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const selectedNotes = useMemo(
    () => noteIndexes.map((index) => notes[index]!).filter(Boolean),
    [noteIndexes, notes]
  );
  const selectionRange = useMemo(() => {
    if (selectedNotes.length === 0) return '—';
    const velocities = selectedNotes.map((note) => note.velocity);
    return `${Math.min(...velocities)}–${Math.max(...velocities)}`;
  }, [selectedNotes]);
  const font = useMemo(
    () =>
      matchFont({ fontFamily: 'monospace', fontSize: 8, fontWeight: '600' }),
    []
  );
  const handles = useMemo<VelocityHandleCenter[]>(
    () =>
      noteIndexes.map((globalIndex) => {
        const note = notes[globalIndex]!;
        return {
          globalIndex,
          centerX:
            xForVelocityHandle(note.position, beatWidth, totalBeats) +
            HANDLE_WIDTH / 2,
          centerY: yForVelocity(note.velocity, areaHeight),
        };
      }),
    [noteIndexes, notes, beatWidth, totalBeats, areaHeight]
  );

  const commit = useCallback(
    (
      contour: VelocityContour,
      mode: VelocityContourMode,
      indexes: readonly number[],
      expectedNotes: readonly ClipNote[]
    ) => {
      preview.value = null;
      if (onApply) return onApply(contour, mode, indexes, expectedNotes);
      if (indexes.length === 1 && onSingleVelocityChange) {
        const note = expectedNotes[indexes[0]!];
        if (note && contour.variant.type === 'curve') {
          onSingleVelocityChange(
            indexes[0]!,
            sampleContour(contour, note.position)
          );
          return true;
        }
      }
      return false;
    },
    [onApply, onSingleVelocityChange, preview]
  );

  const openNudge = useCallback(() => setNudgeOpen(true), []);
  const haptic = useCallback(() => {
    try {
      const Haptics = require('expo-haptics');
      Haptics.selectionAsync?.();
    } catch {
      // Optional dependency in the component library.
    }
  }, []);

  const applyPreset = useCallback(
    (preset: VelocityPreset) => {
      const contour = makeVelocityPreset(preset, selectedNotes);
      if (contour) commit(contour, 'absolute', noteIndexes, notes);
    },
    [commit, noteIndexes, notes, selectedNotes]
  );
  const applyNudge = useCallback(
    (delta: number) => {
      const contour = makeVelocityNudge(selectedNotes, delta);
      if (contour) commit(contour, 'additive', noteIndexes, notes);
      setNudgeOpen(false);
    },
    [commit, noteIndexes, notes, selectedNotes]
  );

  // 0 idle, 1 handle pending, 2 touch pending, 3 freehand, 4 handle drag, 5 touch curve
  const mode = useSharedValue(0);
  const primaryId = useSharedValue(-1);
  const secondaryId = useSharedValue(-1);
  const secondaryY = useSharedValue(0);
  const latchedNotes = useSharedValue<readonly ClipNote[]>([]);
  const latchedIndexes = useSharedValue<readonly number[]>([]);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const currentX = useSharedValue(0);
  const currentY = useSharedValue(0);
  const drawPoints = useSharedValue<readonly LogicalPoint[]>([]);
  const bend = useSharedValue(0);
  const timerToken = useSharedValue(0);
  const handleIndex = useSharedValue(-1);
  const handleVelocity = useSharedValue(0);
  const handleVelocityRaw = useSharedValue(0);
  const handleBand = useSharedValue<PrecisionBand>(1);
  const lastTranslationY = useSharedValue(0);

  const reset = useCallback(() => {
    'worklet';
    timerToken.value += 1;
    mode.value = 0;
    primaryId.value = -1;
    secondaryId.value = -1;
    latchedNotes.value = [];
    latchedIndexes.value = [];
    drawPoints.value = [];
    preview.value = null;
  }, [
    drawPoints,
    latchedIndexes,
    latchedNotes,
    mode,
    preview,
    primaryId,
    secondaryId,
    timerToken,
  ]);

  const updatePreview = useCallback(
    (
      contour: VelocityContour,
      contourMode: VelocityContourMode,
      indexes: readonly number[],
      hudX: number,
      hudY: number,
      hudValue: number,
      hudLabel: string
    ) => {
      'worklet';
      preview.value = {
        contour,
        mode: contourMode,
        velocities: contourPreviewVelocities(
          contour,
          contourMode,
          latchedNotes.value,
          indexes
        ),
        noteIndexes: indexes,
        hudX,
        hudY,
        hudValue,
        hudLabel,
      };
    },
    [latchedNotes, preview]
  );

  const updatePolylinePreview = useCallback(() => {
    'worklet';
    const contour = rawPolylineFromPixels(
      drawPoints.value,
      beatWidth,
      areaHeight,
      totalBeats
    );
    updatePreview(
      contour,
      'absolute',
      latchedIndexes.value,
      currentX.value,
      currentY.value,
      velocityFromY(currentY.value, areaHeight),
      'draw'
    );
  }, [
    areaHeight,
    beatWidth,
    currentX,
    currentY,
    drawPoints,
    latchedIndexes,
    totalBeats,
    updatePreview,
  ]);

  const updateCurvePreview = useCallback(() => {
    'worklet';
    const provisional = curveFromDrag(
      { x: startX.value, y: startY.value },
      { x: currentX.value, y: currentY.value },
      beatWidth,
      areaHeight,
      totalBeats,
      bend.value
    );
    if (secondaryId.value >= 0 && provisional.variant.type === 'curve') {
      bend.value = bendFromMidpoint(
        provisional.variant.from,
        provisional.variant.to,
        velocityFromY(secondaryY.value, areaHeight)
      );
    }
    const contour = curveFromDrag(
      { x: startX.value, y: startY.value },
      { x: currentX.value, y: currentY.value },
      beatWidth,
      areaHeight,
      totalBeats,
      bend.value
    );
    updatePreview(
      contour,
      'absolute',
      latchedIndexes.value,
      currentX.value,
      currentY.value,
      sampleContour(
        contour,
        Math.max(
          contour.startBeat,
          Math.min(contour.endBeat, currentX.value / beatWidth)
        )
      ),
      'curve'
    );
  }, [
    areaHeight,
    beatWidth,
    bend,
    currentX,
    currentY,
    latchedIndexes,
    secondaryId,
    secondaryY,
    startX,
    startY,
    totalBeats,
    updatePreview,
  ]);

  useEffect(() => {
    reset();
    setNudgeOpen(false);
  }, [areaHeight, beatWidth, noteIndexes, notes, preview, reset, totalBeats]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .manualActivation(true)
        .maxPointers(2)
        .onTouchesDown((event, stateManager) => {
          'worklet';
          for (const changed of event.changedTouches) {
            if (
              (mode.value === 2 || mode.value === 3 || mode.value === 5) &&
              secondaryId.value < 0 &&
              changed.id !== primaryId.value
            ) {
              secondaryId.value = changed.id;
              secondaryY.value = changed.y;
              if (mode.value === 3) mode.value = 5;
              if (mode.value === 5) updateCurvePreview();
              continue;
            }
            if (mode.value !== 0) continue;
            latchedNotes.value = notes.map((note) => ({ ...note }));
            latchedIndexes.value = [...noteIndexes];
            primaryId.value = changed.id;
            startX.value = changed.x;
            startY.value = changed.y;
            currentX.value = changed.x;
            currentY.value = changed.y;
            drawPoints.value = [{ x: changed.x, y: changed.y }];
            bend.value = 0;
            const hit = hitTestVelocityHandle(handles, changed.x, changed.y);
            if (hit >= 0) {
              const note = latchedNotes.value[hit];
              if (!note) continue;
              mode.value = 1;
              handleIndex.value = hit;
              handleVelocity.value = note.velocity;
              handleVelocityRaw.value = note.velocity;
              handleBand.value = 1;
              lastTranslationY.value = 0;
              stateManager.activate();
              continue;
            }
            mode.value = 2;
            const token = timerToken.value + 1;
            timerToken.value = token;
            setTimeout(() => {
              'worklet';
              if (mode.value !== 2 || timerToken.value !== token) return;
              mode.value = secondaryId.value >= 0 ? 5 : 3;
              stateManager.activate();
              if (mode.value === 5) updateCurvePreview();
              else updatePolylinePreview();
            }, TOUCH_DRAW_HOLD_MS);
          }
        })
        .onTouchesMove((event, stateManager) => {
          'worklet';
          const primary = event.allTouches.find(
            (touch) => touch.id === primaryId.value
          );
          if (!primary) return;
          currentX.value = primary.x;
          currentY.value = primary.y;
          const distance = Math.hypot(
            primary.x - startX.value,
            primary.y - startY.value
          );
          if (mode.value === 2) {
            if (distance > TOUCH_DRAW_SLOP) {
              reset();
              stateManager.fail();
            }
            return;
          }
          const secondary = event.allTouches.find(
            (touch) => touch.id === secondaryId.value
          );
          if (secondary) secondaryY.value = secondary.y;
          if (mode.value === 5) {
            updateCurvePreview();
          } else if (mode.value === 3) {
            const last = drawPoints.value[drawPoints.value.length - 1];
            if (!last || last.x !== primary.x || last.y !== primary.y) {
              drawPoints.value = [
                ...drawPoints.value,
                { x: primary.x, y: primary.y },
              ];
            }
            updatePolylinePreview();
          }
        })
        .onUpdate((event) => {
          'worklet';
          if (mode.value !== 1 && mode.value !== 4) return;
          const bandResult = nextPrecisionBand(
            handleBand.value,
            Math.abs(event.translationX)
          );
          if (bandResult.transitions > 0) {
            handleBand.value = bandResult.band;
            for (let index = 0; index < bandResult.transitions; index += 1)
              scheduleOnRN(haptic);
          }
          if (
            mode.value === 1 &&
            Math.hypot(event.translationX, event.translationY) >= DRAG_THRESHOLD
          )
            mode.value = 4;
          const dy = event.translationY - lastTranslationY.value;
          lastTranslationY.value = event.translationY;
          handleVelocityRaw.value = Math.max(
            0,
            Math.min(
              127,
              handleVelocityRaw.value -
                (dy * 127) /
                  Math.max(1, areaHeight - BOTTOM_PAD - HANDLE_HEIGHT) /
                  handleBand.value
            )
          );
          handleVelocity.value = Math.round(handleVelocityRaw.value);
          const note = latchedNotes.value[handleIndex.value];
          if (!note) return;
          const contour: VelocityContour = {
            startBeat: note.position,
            endBeat: note.position,
            variant: {
              type: 'curve',
              from: handleVelocity.value,
              to: handleVelocity.value,
              bend: 0,
            },
          };
          updatePreview(
            contour,
            'absolute',
            [handleIndex.value],
            note.position * beatWidth,
            yForVelocity(handleVelocity.value, areaHeight),
            handleVelocity.value,
            `1:${handleBand.value}`
          );
        })
        .onTouchesUp((event, stateManager) => {
          'worklet';
          const liftedPrimary = event.changedTouches.find(
            (touch) => touch.id === primaryId.value
          );
          if (mode.value === 2) {
            if (liftedPrimary) {
              reset();
              stateManager.fail();
            } else if (
              event.changedTouches.some(
                (touch) => touch.id === secondaryId.value
              )
            ) {
              secondaryId.value = -1;
            }
            return;
          }
          if (mode.value !== 3 && mode.value !== 5) return;
          if (liftedPrimary) {
            currentX.value = liftedPrimary.x;
            currentY.value = liftedPrimary.y;
            if (mode.value === 3) {
              const last = drawPoints.value[drawPoints.value.length - 1];
              if (
                !last ||
                last.x !== liftedPrimary.x ||
                last.y !== liftedPrimary.y
              ) {
                drawPoints.value = [
                  ...drawPoints.value,
                  { x: liftedPrimary.x, y: liftedPrimary.y },
                ];
              }
              updatePolylinePreview();
            } else {
              updateCurvePreview();
            }
          }
          const liftedIds = event.changedTouches.map((touch) => touch.id);
          const outcome = touchLiftOutcome(
            primaryId.value,
            secondaryId.value,
            event.allTouches
              .filter((touch) => !liftedIds.includes(touch.id))
              .map((touch) => touch.id)
          );
          if (outcome === 'freeze-bend') {
            secondaryId.value = -1;
          } else if (outcome === 'commit') {
            const value = preview.value;
            const contour =
              mode.value === 3
                ? polylineFromPixels(
                    drawPoints.value,
                    beatWidth,
                    areaHeight,
                    totalBeats
                  )
                : value?.contour;
            if (contour)
              scheduleOnRN(
                commit,
                contour,
                'absolute',
                latchedIndexes.value,
                latchedNotes.value
              );
            reset();
            stateManager.end();
          }
        })
        .onEnd(() => {
          'worklet';
          if (mode.value === 1) {
            scheduleOnRN(openNudge);
            reset();
          } else if (mode.value === 4) {
            const value = preview.value;
            if (value)
              scheduleOnRN(
                commit,
                value.contour,
                value.mode,
                [handleIndex.value],
                latchedNotes.value
              );
            reset();
          }
        })
        .onFinalize(() => {
          'worklet';
          if (mode.value !== 0) reset();
        }),
    [
      areaHeight,
      beatWidth,
      bend,
      commit,
      currentX,
      currentY,
      drawPoints,
      handleBand,
      handleIndex,
      handleVelocity,
      handleVelocityRaw,
      handles,
      haptic,
      lastTranslationY,
      latchedIndexes,
      latchedNotes,
      mode,
      noteIndexes,
      notes,
      openNudge,
      preview,
      primaryId,
      reset,
      secondaryId,
      secondaryY,
      startX,
      startY,
      timerToken,
      totalBeats,
      updateCurvePreview,
      updatePolylinePreview,
      updatePreview,
    ]
  );

  const contourPath = useDerivedValue(() => {
    const builder = (Skia as any).PathBuilder?.Make?.();
    const path = builder ?? Skia.Path.Make();
    const active = preview.value;
    if (!active) return builder ? builder.detach() : path;
    const { contour } = active;
    if (contour.variant.type === 'polyline') {
      contour.variant.points.forEach((point, index) => {
        const x = point.beat * beatWidth;
        const y = yForVelocity(point.velocity, areaHeight);
        if (index === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      });
    } else {
      const span = contour.endBeat - contour.startBeat;
      for (let index = 0; index <= 32; index += 1) {
        const beat = contour.startBeat + (span * index) / 32;
        const x = beat * beatWidth;
        const y = yForVelocity(sampleContour(contour, beat), areaHeight);
        if (index === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      }
    }
    return builder ? builder.detach() : path;
  });
  const hudOpacity = useDerivedValue(() => (preview.value ? 1 : 0));
  const hudX = useDerivedValue(() => {
    const viewportStart = scrollOffsetX.value;
    const viewportEnd = Math.min(
      totalBeats * beatWidth,
      viewportStart + viewportWidth
    );
    return Math.max(
      viewportStart,
      Math.min(viewportEnd - 72, (preview.value?.hudX ?? 0) - 40)
    );
  });
  const hudY = useDerivedValue(() =>
    Math.max(0, Math.min(areaHeight - 20, (preview.value?.hudY ?? 0) - 40))
  );
  const hudText = useDerivedValue(() =>
    preview.value ? `${preview.value.hudValue} ${preview.value.hudLabel}` : ''
  );
  const hudTextX = useDerivedValue(() => hudX.value + 4);
  const hudTextY = useDerivedValue(() => hudY.value + 14);
  const controlsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollOffsetX.value }],
  }));

  return (
    <View
      testID="velocity-contour-lane"
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
    >
      <GestureDetector gesture={gesture}>
        <View
          style={StyleSheet.absoluteFill}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Selected note velocities"
          accessibilityValue={{ text: selectionRange }}
          accessibilityHint="Hold empty space and drag to draw freehand; add a second finger for a curve"
          accessibilityActions={[
            { name: 'increment', label: 'Increase velocity by one' },
            { name: 'decrement', label: 'Decrease velocity by one' },
          ]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'increment') applyNudge(1);
            else if (event.nativeEvent.actionName === 'decrement')
              applyNudge(-1);
          }}
          testID="velocity-contour-adjustable"
        />
      </GestureDetector>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Path path={contourPath} color="black" style="stroke" strokeWidth={5} />
        <Path path={contourPath} color="white" style="stroke" strokeWidth={2} />
        {noteIndexes.map((globalIndex) => {
          const note = notes[globalIndex];
          return note ? (
            <ProposedHandle
              key={globalIndex}
              note={note}
              globalIndex={globalIndex}
              beatWidth={beatWidth}
              totalBeats={totalBeats}
              areaHeight={areaHeight}
              color={trackColor}
              preview={preview}
              font={font}
            />
          ) : null;
        })}
        <Rect
          x={hudX}
          y={hudY}
          width={72}
          height={20}
          color="black"
          opacity={hudOpacity}
        />
        <SkiaText
          x={hudTextX}
          y={hudTextY}
          text={hudText}
          font={font}
          color="white"
          opacity={hudOpacity}
        />
      </Canvas>
      <Animated.View
        style={[styles.controls, { width: viewportWidth }, controlsStyle]}
        pointerEvents="box-none"
      >
        {nudgeOpen ? (
          <>
            {[-5, -1].map((delta) => (
              <Pressable
                key={delta}
                style={styles.button}
                accessibilityRole="button"
                accessibilityLabel={`Decrease selected note velocities by ${Math.abs(delta)}`}
                testID={`velocity-contour-nudge-${delta}`}
                onPress={() => applyNudge(delta)}
              >
                <Text
                  variant="extraSmall"
                  color="white"
                  style={styles.buttonText}
                >
                  {delta}
                </Text>
              </Pressable>
            ))}
            <View style={styles.range}>
              <Text
                variant="extraSmall"
                color="white"
                style={styles.buttonText}
              >
                {selectionRange}
              </Text>
            </View>
            {[1, 5].map((delta) => (
              <Pressable
                key={delta}
                style={styles.button}
                accessibilityRole="button"
                accessibilityLabel={`Increase selected note velocities by ${delta}`}
                testID={`velocity-contour-nudge-plus-${delta}`}
                onPress={() => applyNudge(delta)}
              >
                <Text
                  variant="extraSmall"
                  color="white"
                  style={styles.buttonText}
                >
                  +{delta}
                </Text>
              </Pressable>
            ))}
          </>
        ) : (
          PRESETS.map((preset) => (
            <Pressable
              key={preset}
              style={styles.button}
              accessibilityRole="button"
              accessibilityLabel={`Apply ${preset} velocity preset`}
              testID={`velocity-contour-preset-${preset}`}
              onPress={() => applyPreset(preset)}
            >
              <Text
                variant="extraSmall"
                color="white"
                style={styles.buttonText}
              >
                {preset}
              </Text>
            </Pressable>
          ))
        )}
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  controls: {
    position: 'absolute',
    left: 0,
    bottom: 2,
    height: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
  },
  button: {
    minWidth: 35,
    height: 22,
    paddingHorizontal: 4,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  range: {
    minWidth: 48,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 7, textTransform: 'uppercase' },
});
