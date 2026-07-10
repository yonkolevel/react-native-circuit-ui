import type { ClipNote, Sample } from '../../features/playground/types';

export type PianoRollMathContext = {
  samples?: Pick<Sample, 'noteNumber'>[];
  isDrum: boolean;
  basePitch: number;
  totalPitches: number;
  beatWidth: number;
  stepWidth: number;
  gridWidth: number;
  rowHeight: number;
  pitchToMidi: number[];
};

const TOUCH_PADDING = 12;
const MIN_RESIZE_ZONE = 20;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const getPianoRollNotePitchIndex = (
  note: Pick<ClipNote, 'noteNumber'>,
  { samples, isDrum, basePitch }: PianoRollMathContext
): number => {
  if (!isDrum) return note.noteNumber - basePitch;

  const sampleIndex = (samples ?? []).findIndex(
    (sample) => sample.noteNumber === note.noteNumber
  );
  return sampleIndex >= 0 ? sampleIndex : 0;
};

export const getPianoRollNoteRect = (
  note: ClipNote,
  context: PianoRollMathContext
) => {
  const pitchIdx = getPianoRollNotePitchIndex(note, context);
  const rowIdx = context.totalPitches - 1 - pitchIdx;
  const x = note.position * context.beatWidth;
  const y = rowIdx * context.rowHeight + 1;
  const width = Math.max(
    note.duration * context.beatWidth - 1,
    context.stepWidth
  );
  const height = context.rowHeight - 2;

  return { x, y, width, height, pitchIdx, rowIdx };
};

export const getGridPointNoteTarget = (
  x: number,
  y: number,
  {
    stepWidth,
    gridWidth,
    rowHeight,
    totalPitches,
    pitchToMidi,
  }: PianoRollMathContext
): { noteNumber: number; position: number } | null => {
  if (x < 0 || x >= gridWidth) return null;

  const rowIdx = Math.floor(y / rowHeight);
  const pitchIdx = totalPitches - 1 - rowIdx;
  if (pitchIdx < 0 || pitchIdx >= totalPitches) return null;

  return {
    noteNumber: pitchToMidi[pitchIdx] ?? pitchIdx,
    position: Math.floor(x / stepWidth) * 0.25,
  };
};

export const hitTestPianoRollNote = (
  notes: ClipNote[],
  x: number,
  y: number,
  context: PianoRollMathContext
): { idx: number; isResizeEdge: boolean } | null => {
  let bestIdx = -1;
  let bestDist = Infinity;
  let bestIsResize = false;

  for (let idx = notes.length - 1; idx >= 0; idx--) {
    const note = notes[idx]!;
    const rect = getPianoRollNoteRect(note, context);

    if (
      x >= rect.x - TOUCH_PADDING &&
      x <= rect.x + rect.width + TOUCH_PADDING &&
      y >= rect.y - TOUCH_PADDING &&
      y <= rect.y + rect.height + TOUCH_PADDING
    ) {
      const cx = rect.x + rect.width / 2;
      const cy = rect.y + rect.height / 2;
      const dist = Math.abs(x - cx) + Math.abs(y - cy);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
        bestIsResize =
          x >= rect.x + rect.width - Math.min(MIN_RESIZE_ZONE, rect.width / 2);
      }
    }
  }

  return bestIdx >= 0 ? { idx: bestIdx, isResizeEdge: bestIsResize } : null;
};

export const getResizedNoteDuration = (
  originalDuration: number,
  dx: number,
  { beatWidth, stepWidth, gridWidth }: PianoRollMathContext,
  originalPosition = 0
): number => {
  const newWidth = originalDuration * beatWidth + dx;
  const snappedDuration = Math.max(1, Math.round(newWidth / stepWidth)) * 0.25;
  const maxDuration = Math.max(0.25, gridWidth / beatWidth - originalPosition);
  return Math.min(maxDuration, snappedDuration);
};

export const getMovedGridTarget = (
  dx: number,
  dy: number,
  originalPosition: number,
  originalRow: number,
  stepWidth: number,
  rowHeight: number,
  totalPitches: number,
  maxPosition: number
): { position: number; rowIdx: number } => {
  'worklet';
  const stepsDx = Math.round(dx / stepWidth);
  const rowsDy = Math.round(dy / rowHeight);
  const rowIdx = Math.max(0, Math.min(totalPitches - 1, originalRow + rowsDy));

  return {
    position: Math.min(
      maxPosition,
      Math.max(0, originalPosition + stepsDx * 0.25)
    ),
    rowIdx,
  };
};

export const getMovedNoteTarget = (
  {
    startX,
    startY,
    endX,
    endY,
    originalPosition,
    originalDuration,
    originalNoteNumber,
  }: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    originalPosition: number;
    originalDuration: number;
    originalNoteNumber: number;
  },
  {
    stepWidth,
    beatWidth,
    gridWidth,
    rowHeight,
    totalPitches,
    pitchToMidi,
  }: PianoRollMathContext
): { noteNumber: number; position: number } => {
  const pitchIdx = pitchToMidi.indexOf(originalNoteNumber);
  const originalRow = totalPitches - 1 - clamp(pitchIdx, 0, totalPitches - 1);
  const target = getMovedGridTarget(
    endX - startX,
    endY - startY,
    originalPosition,
    originalRow,
    stepWidth,
    rowHeight,
    totalPitches,
    Math.max(0, gridWidth / beatWidth - originalDuration)
  );
  const targetPitchIdx = totalPitches - 1 - target.rowIdx;

  return {
    noteNumber: pitchToMidi[targetPitchIdx] ?? targetPitchIdx,
    position: target.position,
  };
};
