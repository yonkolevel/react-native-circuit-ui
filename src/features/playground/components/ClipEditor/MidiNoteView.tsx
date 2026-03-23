/**
 * MidiNoteView — a single note on the piano roll grid.
 * Matches iOS MidiNoteView.swift.
 *
 * Gestures (react-native-gesture-handler + reanimated):
 *   - Tap → delete note
 *   - Pan → move (position + pitch), snaps to grid on release
 *   - Pan from right edge → resize duration
 *
 * All gesture callbacks run on the UI thread (worklets).
 * Store is only updated on gesture end (runOnJS).
 */
import { memo, useCallback, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../../../components/Text';

const MIN_STEPS = 1;
const RESIZE_EDGE = 20;

interface MidiNoteViewProps {
  position: number;
  duration: number;
  noteNumber: number;
  rowIndex: number;
  beatWidth: number;
  rowHeight: number;
  stepWidth: number;
  color: string;
  label?: string;
  noteIndex: number;
  onDelete?: (noteIndex: number) => void;
  onResize?: (noteIndex: number, newDuration: number) => void;
  onMove?: (noteIndex: number, newPosition: number, newNoteNumber: number) => void;
  totalPitches?: number;
  /** Maps pitchIdx (0 = bottom row) → MIDI note number */
  pitchToMidi?: number[];
}

export const MidiNoteView = memo(function MidiNoteView({
  position,
  duration,
  noteNumber,
  rowIndex,
  beatWidth,
  rowHeight,
  stepWidth,
  color,
  label,
  noteIndex,
  onDelete,
  onResize,
  onMove,
  totalPitches = 24,
  pitchToMidi,
}: MidiNoteViewProps) {
  const baseWidth = Math.max(duration * beatWidth - 2, stepWidth);

  // Shared values for smooth animation during drag (UI thread, no JS re-renders)
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const widthOffset = useSharedValue(0);
  const isResizeMode = useSharedValue(false);
  const zIndex = useSharedValue(1);

  // Callbacks bridged to JS thread on gesture end
  const handleDelete = useCallback(() => {
    onDelete?.(noteIndex);
  }, [onDelete, noteIndex]);

  const handleResize = useCallback((dx: number) => {
    const newWidth = baseWidth + dx;
    const steps = Math.max(MIN_STEPS, Math.round(newWidth / stepWidth));
    onResize?.(noteIndex, steps * 0.25);
  }, [baseWidth, stepWidth, noteIndex, onResize]);

  const handleMove = useCallback((dx: number, dy: number) => {
    const stepsDx = Math.round(dx / stepWidth);
    const rowsDy = Math.round(dy / rowHeight);
    const newPosition = Math.max(0, position + stepsDx * 0.25);
    const newRowIndex = Math.max(0, Math.min(totalPitches - 1, rowIndex + rowsDy));
    const pitchIdx = totalPitches - 1 - newRowIndex;
    // Use the mapping array if provided (handles drums + melodic correctly)
    const newNoteNumber = pitchToMidi?.[pitchIdx] ?? pitchIdx;
    if (newPosition !== position || newNoteNumber !== noteNumber) {
      onMove?.(noteIndex, newPosition, newNoteNumber);
    }
  }, [stepWidth, rowHeight, position, rowIndex, totalPitches, pitchToMidi, noteNumber, noteIndex, onMove]);

  // Tap → delete
  const tap = Gesture.Tap()
    .maxDuration(200)
    .onEnd(() => {
      'worklet';
      runOnJS(handleDelete)();
    });

  // Pan → move or resize
  const pan = Gesture.Pan()
    .activateAfterLongPress(150)
    .onStart((e) => {
      'worklet';
      zIndex.value = 100;
      // Right edge = resize, otherwise move
      isResizeMode.value = e.x > baseWidth - RESIZE_EDGE;
    })
    .onUpdate((e) => {
      'worklet';
      if (isResizeMode.value) {
        const minOff = -(baseWidth - stepWidth);
        widthOffset.value = Math.max(minOff, e.translationX);
      } else {
        translateX.value = e.translationX;
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      'worklet';
      if (isResizeMode.value) {
        const newWidth = baseWidth + e.translationX;
        const steps = Math.max(MIN_STEPS, Math.round(newWidth / stepWidth));
        widthOffset.value = steps * stepWidth - baseWidth;
        runOnJS(handleResize)(e.translationX);
      } else {
        // Snap to grid immediately — no animation, no jump
        const snappedX = Math.round(e.translationX / stepWidth) * stepWidth;
        const snappedY = Math.round(e.translationY / rowHeight) * rowHeight;
        translateX.value = snappedX;
        translateY.value = snappedY;
        runOnJS(handleMove)(e.translationX, e.translationY);
      }
      zIndex.value = 1;
    });

  // Tap fires on short press, pan fires on long press + drag
  const composed = Gesture.Exclusive(pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    width: baseWidth + widthOffset.value,
    zIndex: zIndex.value,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          s.note,
          {
            left: position * beatWidth,
            top: rowIndex * rowHeight + 2,
            height: rowHeight - 4,
            backgroundColor: color,
          },
          animatedStyle,
        ]}
      >
        {label && baseWidth > 24 ? (
          <Text
            variant="extraSmall"
            color="rgba(0,0,0,0.6)"
            numberOfLines={1}
            style={s.label}
          >
            {label}
          </Text>
        ) : null}
        <Animated.View style={s.dotGroup}>
          <Animated.View style={s.dot} />
          <Animated.View style={s.line} />
          <Animated.View style={s.dot} />
        </Animated.View>
        <Animated.View style={s.resizeHandle} />
      </Animated.View>
    </GestureDetector>
  );
});

const s = StyleSheet.create({
  note: {
    position: 'absolute',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  label: { fontSize: 9, fontWeight: '600' },
  dotGroup: { flexDirection: 'row', alignItems: 'center' },
  dot: {
    width: 2, height: 2, borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  line: {
    width: 1, height: '60%',
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginHorizontal: 1,
  },
  resizeHandle: {
    position: 'absolute',
    right: 0, top: 0, bottom: 0, width: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
});
