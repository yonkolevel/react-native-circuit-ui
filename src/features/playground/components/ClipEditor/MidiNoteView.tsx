/**
 * MidiNoteView — a single note on the piano roll grid.
 * Port of AudioKit PianoRoll's PianoRollNoteView.swift.
 *
 * Two gesture zones (matching AudioKit):
 *   1. Note body — drag to move (position + pitch)
 *   2. Right-edge handle (half a step wide) — drag to resize duration
 *
 * Tap on note body → delete note.
 * Both zones have independent gesture detectors so they don't conflict.
 */
import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { Text } from '../../../../components/Text';

const MIN_STEPS = 1;

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
  const handleWidth = stepWidth * 0.5; // AudioKit: half a grid column for resize handle

  // --- Shared values (UI thread, no JS re-renders during drag) ---
  const moveX = useSharedValue(0);
  const moveY = useSharedValue(0);
  const resizeW = useSharedValue(0);
  const isActive = useSharedValue(false);

  // --- JS callbacks (called on gesture end) ---
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
    const newNoteNumber = pitchToMidi?.[pitchIdx] ?? pitchIdx;
    if (newPosition !== position || newNoteNumber !== noteNumber) {
      onMove?.(noteIndex, newPosition, newNoteNumber);
    }
  }, [stepWidth, rowHeight, position, rowIndex, totalPitches, pitchToMidi, noteNumber, noteIndex, onMove]);

  // --- Gesture 1: Note body — tap to delete, drag to move ---
  const bodyTap = Gesture.Tap()
    .maxDuration(200)
    .onEnd(() => {
      'worklet';
      runOnJS(handleDelete)();
    });

  const bodyDrag = Gesture.Pan()
    .activateAfterLongPress(120)
    .onStart(() => {
      'worklet';
      isActive.value = true;
    })
    .onUpdate((e) => {
      'worklet';
      moveX.value = e.translationX;
      moveY.value = e.translationY;
    })
    .onEnd((e) => {
      'worklet';
      // Snap to grid
      moveX.value = Math.round(e.translationX / stepWidth) * stepWidth;
      moveY.value = Math.round(e.translationY / rowHeight) * rowHeight;
      runOnJS(handleMove)(e.translationX, e.translationY);
      isActive.value = false;
    });

  const bodyGesture = Gesture.Exclusive(bodyDrag, bodyTap);

  // --- Gesture 2: Right-edge handle — drag to resize ---
  const resizeDrag = Gesture.Pan()
    .minDistance(2)
    .onStart(() => {
      'worklet';
      isActive.value = true;
    })
    .onUpdate((e) => {
      'worklet';
      const minOff = -(baseWidth - stepWidth);
      resizeW.value = Math.max(minOff, e.translationX);
    })
    .onEnd((e) => {
      'worklet';
      const newWidth = baseWidth + e.translationX;
      const steps = Math.max(MIN_STEPS, Math.round(newWidth / stepWidth));
      resizeW.value = steps * stepWidth - baseWidth;
      runOnJS(handleResize)(e.translationX);
      isActive.value = false;
    });

  // --- Animated styles ---
  const noteStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: moveX.value },
      { translateY: moveY.value },
    ],
    width: baseWidth + resizeW.value,
    opacity: isActive.value ? 1 : 0.85,
  }));

  // Resize handle overlaps the right edge of the note
  const handleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: moveX.value },
      { translateY: moveY.value },
    ],
    left: position * beatWidth + baseWidth + resizeW.value - handleWidth,
  }));

  return (
    <>
      {/* Note body — move + tap-to-delete */}
      <GestureDetector gesture={bodyGesture}>
        <Animated.View
          style={[
            s.note,
            {
              left: position * beatWidth,
              top: rowIndex * rowHeight + 2,
              height: rowHeight - 4,
              backgroundColor: color,
            },
            noteStyle,
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
          <View style={s.dotGroup}>
            <View style={s.dot} />
            <View style={s.line} />
            <View style={s.dot} />
          </View>
          {/* Visual resize indicator — black line at right edge (AudioKit DefaultNoteView) */}
          <View style={s.resizeIndicator} />
        </Animated.View>
      </GestureDetector>

      {/* Resize handle — invisible, overlaps right edge (AudioKit: half a grid column) */}
      <GestureDetector gesture={resizeDrag}>
        <Animated.View
          style={[
            s.resizeHandle,
            {
              top: rowIndex * rowHeight,
              width: handleWidth,
              height: rowHeight,
            },
            handleStyle,
          ]}
        />
      </GestureDetector>
    </>
  );
});

const s = StyleSheet.create({
  note: {
    position: 'absolute',
    borderRadius: 3,
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
  resizeIndicator: {
    position: 'absolute',
    right: 2,
    top: 4,
    bottom: 4,
    width: 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 1,
  },
  resizeHandle: {
    position: 'absolute',
    backgroundColor: 'transparent', // invisible — just a touch target
    zIndex: 10,
  },
});
