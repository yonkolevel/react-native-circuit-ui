import { hexToHsl, hslToHex } from '../../theme';
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

/** A note currently held down during live recording — not yet committed to
 * the clip. Rendered as a growing "in progress" preview from `startBeat` to
 * the live playhead position. */
export interface RecordingNotePreviewData {
  noteNumber: number;
  startBeat: number;
  /** Captured active loop, used to keep the preview growing across wrap. */
  loopStartBeat?: number;
  loopBeats?: number;
}

const TOUCH_PADDING = 12;
const MIN_RESIZE_ZONE = 20;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const MIDI_VELOCITY_MAX = 127;
// The visual floor a velocity-0 note dims to, and the lightness floor that
// maps to — chosen so even the softest possible note stays a clearly
// readable, fully-opaque colored shape against the dark grid, never
// approaching black/invisible the way a plain opacity fade would.
const VELOCITY_VISUAL_FLOOR = 0.4;
const NOTE_LIGHTNESS_FLOOR = 0.22;

/**
 * Applies a velocity-scaled lightness to a note's base color (track color or
 * per-pitch color) — full velocity (127) renders exactly as the base color
 * always has, softer velocities dim progressively toward NOTE_LIGHTNESS_FLOOR.
 * Applies uniformly to melodic and drum notes; both platforms take a plain
 * hex string for a note's fill, so this needs no Skia-specific handling.
 */
export const getVelocityColor = (hex: string, velocity: number): string => {
  const fraction = clamp(velocity, 0, MIDI_VELOCITY_MAX) / MIDI_VELOCITY_MAX;
  const visualT =
    VELOCITY_VISUAL_FLOOR + (1 - VELOCITY_VISUAL_FLOOR) * fraction;
  const { h, s, l } = hexToHsl(hex);
  const targetLightness =
    NOTE_LIGHTNESS_FLOOR + (l - NOTE_LIGHTNESS_FLOOR) * visualT;
  return hslToHex(h, s, targetLightness);
};

// Matches the mcOrange2 → mcOrange step in the design palette (same hue,
// same saturation, ~4-5 points darker) — applied generically to any track's
// own color so a selected pitch label darkens toward that track's color
// instead of always turning a fixed orange.
const SELECTED_LABEL_LIGHTNESS_DELTA = 0.05;

export const getSelectedLabelColor = (hex: string): string => {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, l - SELECTED_LABEL_LIGHTNESS_DELTA));
};

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

/**
 * Initial live drag-preview rect for a note at drag start, in pixels.
 * Seeds the shared values the Skia preview reads before the first pan
 * update arrives — without this, the preview shows stale values from the
 * previous drag while the note is merely held. Deliberately takes no touch
 * point: the hit test allows TOUCH_PADDING outside the note, so the row
 * must come from the note itself, never the finger position.
 */
export const getDragPreviewSeed = (
  note: ClipNote,
  isResizeEdge: boolean,
  context: PianoRollMathContext
): { x: number; y: number; width: number } => {
  const { rowIdx } = getPianoRollNoteRect(note, context);
  return {
    x: note.position * context.beatWidth,
    y: rowIdx * context.rowHeight + 1,
    // Match the rendered note rect, including its minimum visible width, so
    // the preview cannot jump on the first pointer update.
    width: Math.max(
      isResizeEdge
        ? note.duration * context.beatWidth
        : note.duration * context.beatWidth - 1,
      context.stepWidth
    ),
  };
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

// Matches the melodic-sequencer reference: with snap on, duration rounds to
// whole steps (min 1 step); with snap off, duration is exact/fractional with
// a much finer minimum (1/8 step) for precise editing.
export const UNSNAPPED_MIN_DURATION_STEPS = 0.125;

export const getResizedNoteDuration = (
  originalDuration: number,
  dx: number,
  { beatWidth, stepWidth, gridWidth }: PianoRollMathContext,
  originalPosition = 0,
  snap = true
): number => {
  const newWidth = originalDuration * beatWidth + dx;
  let rawDuration: number;
  if (snap) {
    // Snap the note's absolute *end* to the nearest half-step — half-steps
    // land on either a grid edge (whole step) or a cell center, matching
    // the release-time "snap to the middle of a cell" behavior. The start
    // never moves during a resize, so only the end needs to land on a line.
    const startPx = originalPosition * beatWidth;
    const endPx = startPx + newWidth;
    const snapUnit = stepWidth / 2;
    const nextSnapPointAfterStart =
      Math.ceil(startPx / snapUnit + 1e-9) * snapUnit;
    const snappedEndPx = Math.max(
      Math.round(endPx / snapUnit) * snapUnit,
      nextSnapPointAfterStart
    );
    rawDuration = (snappedEndPx - startPx) / beatWidth;
  } else {
    rawDuration =
      Math.max(UNSNAPPED_MIN_DURATION_STEPS, newWidth / stepWidth) * 0.25;
  }
  const maxDuration = Math.max(0, gridWidth / beatWidth - originalPosition);
  return Math.min(maxDuration, rawDuration);
};

// How close (as a fraction of a half-step) the raw drag needs to be to a
// snap point (edge or cell center) before live preview eases toward it.
const RESIZE_SNAP_ZONE_RATIO = 0.3;

/**
 * Live drag-preview width for a resize, in pixels. Outside the magnetic
 * zone around each snap point the note follows the pointer exactly
 * (gradual extension); inside the zone it reports the snap target so the
 * caller can ease toward it instead of jumping.
 */
export const getResizeMagneticTarget = (
  originalPosition: number,
  originalDuration: number,
  dx: number,
  beatWidth: number,
  stepWidth: number,
  maxWidthPx: number
): { widthPx: number; isSnapping: boolean } => {
  'worklet';
  const startPx = originalPosition * beatWidth;
  const freeWidthPx = Math.max(
    stepWidth * UNSNAPPED_MIN_DURATION_STEPS,
    originalDuration * beatWidth + dx
  );
  const freeEndPx = startPx + freeWidthPx;
  const snapUnit = stepWidth / 2;
  const nextSnapPointAfterStart =
    Math.ceil(startPx / snapUnit + 1e-9) * snapUnit;
  const nearestSnapEndPx = Math.max(
    Math.round(freeEndPx / snapUnit) * snapUnit,
    nextSnapPointAfterStart
  );
  const distance = Math.abs(freeEndPx - nearestSnapEndPx);
  const zonePx = snapUnit * RESIZE_SNAP_ZONE_RATIO;

  if (distance < zonePx) {
    return {
      widthPx: Math.min(maxWidthPx, nearestSnapEndPx - startPx),
      isSnapping: true,
    };
  }
  return { widthPx: Math.min(maxWidthPx, freeWidthPx), isSnapping: false };
};

export const getMovedGridTarget = (
  dx: number,
  dy: number,
  originalPosition: number,
  originalRow: number,
  stepWidth: number,
  rowHeight: number,
  totalPitches: number,
  maxPosition: number,
  snap = true
): { position: number; rowIdx: number } => {
  'worklet';
  // Pitch (row) is always discrete — only the horizontal (time) axis snaps.
  const rowsDy = Math.round(dy / rowHeight);
  const rowIdx = Math.max(0, Math.min(totalPitches - 1, originalRow + rowsDy));

  let newPosition: number;
  if (snap) {
    // Snap the note's absolute left edge to the grid rather than adding a
    // snapped delta to a possibly off-grid original position — a note that
    // was placed while snap was off lands fully on-grid once it's moved.
    const newPositionSteps = originalPosition / 0.25 + dx / stepWidth;
    newPosition = Math.round(newPositionSteps) * 0.25;
  } else {
    newPosition = originalPosition + (dx / stepWidth) * 0.25;
  }

  return {
    position: Math.min(maxPosition, Math.max(0, newPosition)),
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
  }: PianoRollMathContext,
  snap = true
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
    Math.max(0, gridWidth / beatWidth - originalDuration),
    snap
  );
  const targetPitchIdx = totalPitches - 1 - target.rowIdx;

  return {
    noteNumber: pitchToMidi[targetPitchIdx] ?? targetPitchIdx,
    position: target.position,
  };
};
