/**
 * MidiNoteView — a single note on the piano roll grid.
 * Matches iOS MidiNoteView.swift.
 *
 * Gestures:
 *   - Tap → delete note
 *   - Drag from body → move (position + pitch)
 *   - Drag from right edge → resize duration
 *
 * Snaps to 16th note grid horizontally, pitch rows vertically.
 */
import { memo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { Text } from '../../../../components/Text';

const MIN_STEPS = 1;
const RESIZE_EDGE = 20; // rightmost pixels = resize zone
const DRAG_THRESHOLD = 3; // px before drag activates

type DragMode = 'none' | 'move' | 'resize';

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
  onMove?: (
    noteIndex: number,
    newPosition: number,
    newNoteNumber: number
  ) => void;
  /** Total pitches in the grid (for clamping vertical movement) */
  totalPitches?: number;
  /** Minimum MIDI pitch in the grid (for melodic/bass) */
  minPitch?: number;
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
  minPitch = 0,
}: MidiNoteViewProps) {
  const baseWidth = Math.max(duration * beatWidth - 2, stepWidth);

  // Drag state: offset from original position during drag
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [resizeOffset, setResizeOffset] = useState(0);

  const dragMode = useRef<DragMode>('none');
  const isDragging = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > DRAG_THRESHOLD || Math.abs(gs.dy) > DRAG_THRESHOLD,
      // Capture phase: steal the gesture from parent ScrollView during drag
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        Math.abs(gs.dx) > DRAG_THRESHOLD || Math.abs(gs.dy) > DRAG_THRESHOLD,

      onPanResponderGrant: (e) => {
        isDragging.current = false;
        dragMode.current = 'none';

        // Determine drag mode from touch location within the note
        const touchX = e.nativeEvent.locationX;
        const noteWidth = baseWidth + resizeOffset;
        if (touchX > noteWidth - RESIZE_EDGE) {
          dragMode.current = 'resize';
        } else {
          dragMode.current = 'move';
        }
      },

      onPanResponderMove: (_, gs) => {
        if (
          Math.abs(gs.dx) > DRAG_THRESHOLD ||
          Math.abs(gs.dy) > DRAG_THRESHOLD
        ) {
          isDragging.current = true;
        }

        if (dragMode.current === 'resize') {
          const minOffset = -(baseWidth - stepWidth);
          setResizeOffset(Math.max(minOffset, gs.dx));
        } else if (dragMode.current === 'move') {
          setDragX(gs.dx);
          setDragY(gs.dy);
        }
      },

      onPanResponderRelease: (_, gs) => {
        if (!isDragging.current) {
          // Tap → delete
          onDelete?.(noteIndex);
        } else if (dragMode.current === 'resize') {
          // Resize → snap to grid, commit
          const newWidth = baseWidth + gs.dx;
          const steps = Math.max(MIN_STEPS, Math.round(newWidth / stepWidth));
          const newDuration = steps * 0.25;
          onResize?.(noteIndex, newDuration);
        } else if (dragMode.current === 'move') {
          // Move → snap to grid, commit
          const stepsDx = Math.round(gs.dx / stepWidth);
          const rowsDy = Math.round(gs.dy / rowHeight);
          const newPosition = Math.max(0, position + stepsDx * 0.25);
          // Vertical: moving down = higher row index = lower pitch
          const newRowIndex = Math.max(
            0,
            Math.min(totalPitches - 1, rowIndex + rowsDy)
          );
          const pitchIdx = totalPitches - 1 - newRowIndex;
          const newNoteNumber = minPitch + pitchIdx;
          if (newPosition !== position || newNoteNumber !== noteNumber) {
            onMove?.(noteIndex, newPosition, newNoteNumber);
          }
        }

        // Reset
        setDragX(0);
        setDragY(0);
        setResizeOffset(0);
        dragMode.current = 'none';
        isDragging.current = false;
      },
    })
  ).current;

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        s.note,
        {
          left: position * beatWidth + dragX,
          top: rowIndex * rowHeight + 2 + dragY,
          width: baseWidth + resizeOffset,
          height: rowHeight - 4,
          backgroundColor: color,
          zIndex: isDragging.current ? 100 : 1,
        },
      ]}
    >
      {label && baseWidth + resizeOffset > 24 ? (
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
      <View style={s.resizeHandle} />
    </View>
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
