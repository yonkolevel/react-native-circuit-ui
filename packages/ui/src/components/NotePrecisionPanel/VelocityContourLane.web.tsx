import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { Text } from '../Text';
import type { ClipNote } from '../../features/playground/types';
import {
  applyContour,
  sampleContour,
  type VelocityContour,
  type VelocityContourMode,
} from '../../features/playground/core/velocityContour';
import {
  HANDLE_HEIGHT,
  HANDLE_WIDTH,
  contourPreviewVelocities,
  curveFromDrag,
  hitTestVelocityHandle,
  latchPointerModifiers,
  makeVelocityNudge,
  makeVelocityPreset,
  nextPrecisionBand,
  polylineFromPixels,
  rawPolylineFromPixels,
  velocityFromY,
  xForVelocityHandle,
  yForVelocity,
  type LogicalPoint,
  type PrecisionBand,
  type VelocityContourPreview,
  type VelocityPreset,
} from './velocityContourAuthoring';

const BOTTOM_PAD = 32;
const PRESETS: readonly VelocityPreset[] = [
  'ramp',
  'fade',
  'arch',
  'wave',
  'accent',
];
const WEB_STYLE = { touchAction: 'pan-x' } as unknown as ViewStyle;

type WebPointerEvent = {
  nativeEvent: Pick<
    PointerEvent,
    | 'button'
    | 'clientX'
    | 'clientY'
    | 'pointerId'
    | 'pointerType'
    | 'shiftKey'
    | 'altKey'
    | 'metaKey'
    | 'ctrlKey'
  >;
  currentTarget: Element;
  preventDefault?: () => void;
};
type WebKeyboardEvent = {
  nativeEvent?: { key?: string };
  key?: string;
  preventDefault?: () => void;
};
type WebHandlers = {
  onPointerDown: (event: WebPointerEvent) => void;
  onPointerMove: (event: WebPointerEvent) => void;
  onPointerUp: (event: WebPointerEvent) => void;
  onPointerCancel: (event: WebPointerEvent) => void;
  onLostPointerCapture: (event: WebPointerEvent) => void;
  onKeyDown: (event: WebKeyboardEvent) => void;
};

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

type Interaction = {
  pointerId: number;
  type: 'handle' | 'curve' | 'polyline';
  start: LogicalPoint;
  current: LogicalPoint;
  points: LogicalPoint[];
  mode: VelocityContourMode;
  fine: boolean;
  handleIndex: number;
  handleVelocity: number;
  band: PrecisionBand;
  lastY: number;
  dragged: boolean;
  rect: { left: number; top: number };
  noteIndexes: readonly number[];
  expectedNotes: readonly ClipNote[];
};

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
  const [renderPreview, setRenderPreview] =
    useState<VelocityContourPreview | null>(null);
  const [hover, setHover] = useState<LogicalPoint | null>(null);
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const interaction = useRef<Interaction | null>(null);
  const selectedNotes = useMemo(
    () => noteIndexes.map((index) => notes[index]!).filter(Boolean),
    [noteIndexes, notes]
  );
  const selectionRange = useMemo(() => {
    if (selectedNotes.length === 0) return '—';
    const velocities = selectedNotes.map((note) => note.velocity);
    return `${Math.min(...velocities)}–${Math.max(...velocities)}`;
  }, [selectedNotes]);
  const handles = useMemo(
    () =>
      noteIndexes.map((globalIndex) => ({
        globalIndex,
        centerX:
          xForVelocityHandle(
            notes[globalIndex]!.position,
            beatWidth,
            totalBeats
          ) +
          HANDLE_WIDTH / 2,
        centerY: yForVelocity(notes[globalIndex]!.velocity, areaHeight),
      })),
    [areaHeight, beatWidth, noteIndexes, notes, totalBeats]
  );

  const clear = useCallback(() => {
    interaction.current = null;
    preview.value = null;
    setRenderPreview(null);
  }, [preview]);
  const commit = useCallback(
    (
      contour: VelocityContour,
      mode: VelocityContourMode,
      indexes: readonly number[],
      expectedNotes: readonly ClipNote[]
    ) => {
      clear();
      if (onApply) return onApply(contour, mode, indexes, expectedNotes);
      if (indexes.length === 1 && onSingleVelocityChange) {
        const note = expectedNotes[indexes[0]!];
        if (note) {
          onSingleVelocityChange(
            indexes[0]!,
            applyContour(contour, [note], mode)[0]!.velocity
          );
          return true;
        }
      }
      return false;
    },
    [clear, onApply, onSingleVelocityChange]
  );
  const showPreview = useCallback(
    (
      contour: VelocityContour,
      mode: VelocityContourMode,
      indexes: readonly number[],
      expectedNotes: readonly ClipNote[],
      point: LogicalPoint,
      label: string
    ) => {
      const value: VelocityContourPreview = {
        contour,
        mode,
        noteIndexes: indexes,
        velocities: contourPreviewVelocities(
          contour,
          mode,
          expectedNotes,
          indexes
        ),
        hudX: point.x,
        hudY: point.y,
        hudValue: sampleContour(
          contour,
          Math.max(
            contour.startBeat,
            Math.min(contour.endBeat, point.x / beatWidth)
          )
        ),
        hudLabel: label,
      };
      preview.value = value;
      setRenderPreview(value);
    },
    [beatWidth, preview]
  );

  useEffect(() => {
    clear();
    setNudgeOpen(false);
  }, [areaHeight, beatWidth, clear, noteIndexes, notes, preview, totalBeats]);

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

  const pointFor = useCallback(
    (
      event: WebPointerEvent,
      rect: { left: number; top: number }
    ): LogicalPoint => ({
      x: event.nativeEvent.clientX - rect.left,
      y: event.nativeEvent.clientY - rect.top,
    }),
    []
  );
  const handlePointerDown = useCallback(
    (event: WebPointerEvent) => {
      if (
        event.nativeEvent.pointerType === 'touch' ||
        (event.nativeEvent.button != null && event.nativeEvent.button !== 0)
      )
        return;
      const rectValue = event.currentTarget.getBoundingClientRect();
      const rect = { left: rectValue.left, top: rectValue.top };
      const point = pointFor(event, rect);
      const modifiers = latchPointerModifiers(event.nativeEvent);
      const hit = hitTestVelocityHandle(handles, point.x, point.y);
      interaction.current = {
        pointerId: event.nativeEvent.pointerId,
        type: hit >= 0 ? 'handle' : modifiers.curve ? 'curve' : 'polyline',
        start: point,
        current: point,
        points: [point],
        mode: modifiers.mode,
        fine: modifiers.fine,
        handleIndex: hit,
        handleVelocity: hit >= 0 ? notes[hit]!.velocity : 0,
        band: 1,
        lastY: point.y,
        dragged: false,
        rect,
        noteIndexes: [...noteIndexes],
        expectedNotes: notes.map((note) => ({ ...note })),
      };
      try {
        event.currentTarget.setPointerCapture?.(event.nativeEvent.pointerId);
      } catch {
        /* capture is best effort */
      }
      (event.currentTarget as HTMLElement).focus?.();
      event.preventDefault?.();
    },
    [handles, noteIndexes, notes, pointFor]
  );
  const handlePointerMove = useCallback(
    (event: WebPointerEvent) => {
      const active = interaction.current;
      if (!active || active.pointerId !== event.nativeEvent.pointerId) {
        if (event.nativeEvent.pointerType !== 'touch') {
          const rect = event.currentTarget.getBoundingClientRect();
          setHover(pointFor(event, { left: rect.left, top: rect.top }));
        }
        return;
      }
      const raw = pointFor(event, active.rect);
      const rawDy = raw.y - active.lastY;
      const point = active.fine
        ? { x: raw.x, y: active.current.y + rawDy * 0.25 }
        : raw;
      active.lastY = raw.y;
      active.current = point;
      active.dragged ||=
        Math.hypot(point.x - active.start.x, point.y - active.start.y) >= 4;
      event.preventDefault?.();
      if (active.type === 'handle') {
        const band = nextPrecisionBand(
          active.band,
          Math.abs(point.x - active.start.x)
        );
        if (band.transitions > 0) {
          active.band = band.band;
          for (let index = 0; index < band.transitions; index += 1) {
            try {
              require('expo-haptics').selectionAsync?.();
            } catch {
              /* optional */
            }
          }
        }
        const dy = active.fine ? rawDy * 0.25 : rawDy;
        active.handleVelocity = Math.max(
          0,
          Math.min(
            127,
            active.handleVelocity -
              (dy * 127) /
                Math.max(1, areaHeight - BOTTOM_PAD - HANDLE_HEIGHT) /
                active.band
          )
        );
        const note = active.expectedNotes[active.handleIndex];
        if (!note) return;
        const contour: VelocityContour = {
          startBeat: note.position,
          endBeat: note.position,
          variant: {
            type: 'curve',
            from: Math.round(active.handleVelocity),
            to: Math.round(active.handleVelocity),
            bend: 0,
          },
        };
        showPreview(
          contour,
          'absolute',
          [active.handleIndex],
          active.expectedNotes,
          point,
          `1:${active.band}`
        );
        return;
      }
      if (active.type === 'curve') {
        const contour = curveFromDrag(
          active.start,
          point,
          beatWidth,
          areaHeight,
          totalBeats,
          0
        );
        showPreview(
          contour,
          active.mode,
          active.noteIndexes,
          active.expectedNotes,
          point,
          'curve'
        );
      } else {
        active.points.push(point);
        const contour = rawPolylineFromPixels(
          active.points,
          beatWidth,
          areaHeight,
          totalBeats
        );
        showPreview(
          contour,
          active.mode,
          active.noteIndexes,
          active.expectedNotes,
          point,
          'draw'
        );
      }
    },
    [areaHeight, beatWidth, pointFor, showPreview, totalBeats]
  );
  const handlePointerUp = useCallback(
    (event: WebPointerEvent) => {
      const active = interaction.current;
      if (!active || active.pointerId !== event.nativeEvent.pointerId) return;
      const raw = pointFor(event, active.rect);
      const rawDy = raw.y - active.lastY;
      const point = active.fine
        ? { x: raw.x, y: active.current.y + rawDy * 0.25 }
        : raw;
      const distance = Math.hypot(
        point.x - active.start.x,
        point.y - active.start.y
      );
      if (active.type === 'handle') {
        if (!active.dragged && distance < 4) {
          clear();
          setNudgeOpen(true);
          return;
        }
        const band = nextPrecisionBand(
          active.band,
          Math.abs(point.x - active.start.x)
        ).band;
        const dy = active.fine ? rawDy * 0.25 : rawDy;
        const velocity = Math.round(
          Math.max(
            0,
            Math.min(
              127,
              active.handleVelocity -
                (dy * 127) /
                  Math.max(1, areaHeight - BOTTOM_PAD - HANDLE_HEIGHT) /
                  band
            )
          )
        );
        const note = active.expectedNotes[active.handleIndex];
        if (note) {
          commit(
            {
              startBeat: note.position,
              endBeat: note.position,
              variant: { type: 'curve', from: velocity, to: velocity, bend: 0 },
            },
            'absolute',
            [active.handleIndex],
            active.expectedNotes
          );
          return;
        }
      } else if (active.type === 'curve') {
        commit(
          curveFromDrag(
            active.start,
            point,
            beatWidth,
            areaHeight,
            totalBeats,
            0
          ),
          active.mode,
          active.noteIndexes,
          active.expectedNotes
        );
        return;
      } else {
        active.points.push(point);
        commit(
          polylineFromPixels(
            active.points,
            beatWidth,
            areaHeight,
            totalBeats,
            2
          ),
          active.mode,
          active.noteIndexes,
          active.expectedNotes
        );
        return;
      }
      clear();
    },
    [areaHeight, beatWidth, clear, commit, pointFor, totalBeats]
  );
  const terminate = useCallback(
    (event: WebPointerEvent) => {
      if (interaction.current?.pointerId === event.nativeEvent.pointerId)
        clear();
    },
    [clear]
  );
  const handleKeyDown = useCallback(
    (event: WebKeyboardEvent) => {
      const key = event.nativeEvent?.key ?? event.key;
      if (key === 'Escape') {
        event.preventDefault?.();
        clear();
      } else if (key === 'ArrowUp' || key === 'ArrowDown') {
        event.preventDefault?.();
        applyNudge(key === 'ArrowUp' ? 1 : -1);
      }
    },
    [applyNudge, clear]
  );

  const handlers: WebHandlers = {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: terminate,
    onLostPointerCapture: terminate,
    onKeyDown: handleKeyDown,
  };
  const controlPointerHandlers = {
    onPointerDown: (event: { stopPropagation?: () => void }) =>
      event.stopPropagation?.(),
  };
  const controlsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollOffsetX.value }],
  }));

  const contourDots = useMemo(() => {
    if (!renderPreview) return [];
    return Array.from({ length: 33 }, (_, index) => {
      const beat =
        renderPreview.contour.startBeat +
        ((renderPreview.contour.endBeat - renderPreview.contour.startBeat) *
          index) /
          32;
      return {
        x: beat * beatWidth,
        y: yForVelocity(sampleContour(renderPreview.contour, beat), areaHeight),
      };
    });
  }, [areaHeight, beatWidth, renderPreview]);

  return (
    <View
      testID="velocity-contour-lane"
      style={[StyleSheet.absoluteFill, WEB_STYLE]}
      pointerEvents="auto"
      {...(handlers as any)}
    >
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Selected note velocities"
        accessibilityValue={{ text: selectionRange }}
        accessibilityHint="Drag to draw freehand; hold Shift for a curve; arrow keys nudge"
        accessibilityActions={[
          { name: 'increment', label: 'Increase velocity by one' },
          { name: 'decrement', label: 'Decrease velocity by one' },
        ]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'increment') applyNudge(1);
          else if (event.nativeEvent.actionName === 'decrement') applyNudge(-1);
        }}
        {...({ tabIndex: 0 } as any)}
      />
      {contourDots.map((point, index) => (
        <View
          key={index}
          pointerEvents="none"
          style={[styles.dot, { left: point.x - 2, top: point.y - 2 }]}
        />
      ))}
      {noteIndexes.map((globalIndex) => {
        const note = notes[globalIndex];
        const velocity = renderPreview?.velocities[globalIndex] ?? -1;
        if (!note || velocity < 0) return null;
        const x = xForVelocityHandle(note.position, beatWidth, totalBeats);
        const y = yForVelocity(velocity, areaHeight);
        return (
          <View
            key={globalIndex}
            pointerEvents="none"
            style={[
              styles.previewHandle,
              {
                left: x,
                top: y - HANDLE_HEIGHT / 2,
                backgroundColor: trackColor,
              },
            ]}
          >
            <Text variant="extraSmall" color="white" style={styles.handleText}>
              {velocity}
            </Text>
          </View>
        );
      })}
      {hover && !interaction.current && (
        <View
          pointerEvents="none"
          style={[
            styles.hover,
            {
              left: hover.x,
              top:
                yForVelocity(velocityFromY(hover.y, areaHeight), areaHeight) -
                4,
              borderColor: trackColor,
            },
          ]}
        />
      )}
      {renderPreview && (
        <View
          pointerEvents="none"
          style={[
            styles.hud,
            {
              left: Math.max(
                0,
                Math.min(totalBeats * beatWidth - 72, renderPreview.hudX - 40)
              ),
              top: Math.max(
                0,
                Math.min(areaHeight - 20, renderPreview.hudY - 40)
              ),
            },
          ]}
        >
          <Text variant="extraSmall" color="white">
            {renderPreview.hudValue} {renderPreview.hudLabel}
          </Text>
        </View>
      )}
      <Animated.View
        style={[styles.controls, { width: viewportWidth }, controlsStyle]}
        pointerEvents="box-none"
        {...(controlPointerHandlers as any)}
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
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'black',
  },
  previewHandle: {
    position: 'absolute',
    width: HANDLE_WIDTH,
    height: HANDLE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  handleText: { fontSize: 8 },
  hover: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    opacity: 0.7,
  },
  hud: {
    position: 'absolute',
    height: 20,
    minWidth: 60,
    paddingHorizontal: 4,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
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
