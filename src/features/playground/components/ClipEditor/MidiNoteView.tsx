/**
 * NoteBlock — a single note on the piano roll grid.
 *
 * Gestures (native thread via react-native-gesture-handler + reanimated):
 *   - Tap → delete note
 *   - Pan from right edge (last 16px) → resize duration
 *   - Pan from body → move note position (TODO)
 *
 * During resize, the width animates smoothly via shared values (no JS re-renders).
 * On gesture end, the final duration is committed to the store.
 */
import { memo, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../../../components/Text';

const RESIZE_HANDLE_WIDTH = 16;
const MIN_NOTE_WIDTH = 6;

interface NoteBlockProps {
  /** Note position in beats */
  position: number;
  /** Note duration in beats */
  duration: number;
  /** MIDI note number */
  noteNumber: number;
  /** Row index (top of grid = 0) */
  rowIndex: number;
  /** Pixels per beat */
  beatWidth: number;
  /** Height of each row */
  rowHeight: number;
  /** Pixels per 16th note step */
  stepWidth: number;
  /** Track color */
  color: string;
  /** Note display name (e.g., "C4") */
  label?: string;
  /** Note index in the clip's notes array */
  noteIndex: number;
  /** Called on tap (delete note) */
  onDelete?: (noteIndex: number) => void;
  /** Called on resize end (new duration in beats) */
  onResize?: (noteIndex: number, newDuration: number) => void;
}

export const NoteBlock = memo(function NoteBlock({
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
}: NoteBlockProps) {
  const baseWidth = Math.max(duration * beatWidth - 2, MIN_NOTE_WIDTH);

  // Shared value for smooth resize animation (no JS re-renders during drag)
  const widthOffset = useSharedValue(0);
  const isResizing = useSharedValue(false);

  const commitResize = useCallback(
    (translationX: number) => {
      // Snap to nearest 16th note step
      const newWidth = baseWidth + translationX;
      const steps = Math.max(1, Math.round(newWidth / stepWidth));
      const newDuration = steps * 0.25; // 16th note = 0.25 beats
      onResize?.(noteIndex, newDuration);
    },
    [baseWidth, stepWidth, noteIndex, onResize]
  );

  // Tap gesture: delete note
  const tap = Gesture.Tap().onEnd(() => {
    'worklet';
    if (!isResizing.value) {
      runOnJS(onDelete!)(noteIndex);
    }
  });

  // Pan gesture: resize from right edge
  const pan = Gesture.Pan()
    .activeOffsetX([-5, 5]) // requires 5px horizontal movement before activating
    .onStart(() => {
      'worklet';
      isResizing.value = true;
    })
    .onUpdate((e) => {
      'worklet';
      // Clamp: minimum 1 step width
      const minOffset = -(baseWidth - stepWidth);
      widthOffset.value = Math.max(minOffset, e.translationX);
    })
    .onEnd((e) => {
      'worklet';
      isResizing.value = false;
      // Snap to grid
      const steps = Math.max(1, Math.round((baseWidth + e.translationX) / stepWidth));
      const snappedWidth = steps * stepWidth;
      widthOffset.value = withTiming(snappedWidth - baseWidth, { duration: 80 });
      runOnJS(commitResize)(e.translationX);
    })
    .onFinalize(() => {
      'worklet';
      // Reset after store updates re-render the component with new duration
      widthOffset.value = 0;
      isResizing.value = false;
    });

  // Composed: pan takes priority over tap (tap only fires if no drag detected)
  const composed = Gesture.Race(pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    width: baseWidth + widthOffset.value,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          noteStyles.note,
          {
            left: position * beatWidth,
            top: rowIndex * rowHeight + 2,
            height: rowHeight - 4,
            backgroundColor: color,
          },
          animatedStyle,
        ]}
      >
        {/* Note label for melodic/bass */}
        {label && baseWidth > 24 ? (
          <Text
            variant="extraSmall"
            color="rgba(0,0,0,0.6)"
            numberOfLines={1}
            style={noteStyles.label}
          >
            {label}
          </Text>
        ) : null}

        {/* Visual dot-line-dot pattern */}
        <Animated.View style={noteStyles.dotGroup}>
          <Animated.View style={noteStyles.dot} />
          <Animated.View style={noteStyles.line} />
          <Animated.View style={noteStyles.dot} />
        </Animated.View>

        {/* Resize handle (right edge, visual indicator) */}
        <Animated.View style={noteStyles.resizeHandle} />
      </Animated.View>
    </GestureDetector>
  );
});

const noteStyles = StyleSheet.create({
  note: {
    position: 'absolute',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  label: { fontSize: 9, fontWeight: '600' },
  dotGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  line: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginHorizontal: 1,
  },
  resizeHandle: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
});
