import {
  applyContour,
  type VelocityContour,
  type VelocityContourMode,
  type VelocityEditableNote,
} from '../../features/playground/core/velocityContour';

export const TOUCH_DRAW_HOLD_MS = 120;
export const TOUCH_DRAW_SLOP = 6;
export const HANDLE_WIDTH = 24;
export const HANDLE_HEIGHT = 16;
const HANDLE_HIT_RADIUS = 20;

export type VelocityPreset = 'ramp' | 'fade' | 'arch' | 'wave' | 'accent';
export type PrecisionBand = 1 | 4 | 8;

export interface VelocityContourPreview {
  contour: VelocityContour;
  mode: VelocityContourMode;
  /** Full-note-indexed velocities. -1 means no preview for that note. */
  velocities: readonly number[];
  noteIndexes: readonly number[];
  hudX: number;
  hudY: number;
  hudValue: number;
  hudLabel: string;
}

export interface LogicalPoint {
  x: number;
  y: number;
}

export interface VelocityHandleCenter {
  globalIndex: number;
  centerX: number;
  centerY: number;
}

const clamp = (value: number, min: number, max: number): number => {
  'worklet';
  return Math.max(min, Math.min(max, value));
};

export function shouldActivateTouchDraw(
  elapsedMs: number,
  distance: number
): boolean {
  'worklet';
  return elapsedMs >= 120 && distance <= 6;
}

export function touchLiftOutcome(
  primaryId: number,
  secondaryId: number,
  remainingIds: readonly number[]
): 'continue' | 'freeze-bend' | 'commit' {
  'worklet';
  if (!remainingIds.includes(primaryId)) return 'commit';
  if (secondaryId >= 0 && !remainingIds.includes(secondaryId)) {
    return 'freeze-bend';
  }
  return 'continue';
}

export function hitTestVelocityHandle(
  handles: readonly VelocityHandleCenter[],
  x: number,
  y: number
): number {
  'worklet';
  let result = -1;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < handles.length; index += 1) {
    const handle = handles[index]!;
    const dx = x - handle.centerX;
    const dy = y - handle.centerY;
    const distance = dx * dx + dy * dy;
    if (distance > HANDLE_HIT_RADIUS * HANDLE_HIT_RADIUS) continue;
    // <= intentionally lets the later/topmost rendered handle win exact ties.
    if (distance <= nearestDistance) {
      nearestDistance = distance;
      result = handle.globalIndex;
    }
  }
  return result;
}

export function nextPrecisionBand(
  current: PrecisionBand,
  distance: number
): { band: PrecisionBand; transitions: number } {
  'worklet';
  let band = current;
  let transitions = 0;
  let settled = false;
  while (!settled) {
    settled = true;
    if (band === 1 && distance >= 44) {
      band = 4;
      transitions += 1;
      settled = false;
    } else if (band === 4 && distance <= 36) {
      band = 1;
      transitions += 1;
      settled = false;
    } else if (band === 4 && distance >= 104) {
      band = 8;
      transitions += 1;
      settled = false;
    } else if (band === 8 && distance <= 96) {
      band = 4;
      transitions += 1;
      settled = false;
    }
  }
  return { band, transitions };
}

export function velocityFromY(
  y: number,
  areaHeight: number,
  bottomPad = 32,
  handleHeight = 16
): number {
  'worklet';
  const baseline = areaHeight - bottomPad;
  const usableHeight = Math.max(1, baseline - handleHeight);
  const fraction = (baseline - handleHeight / 2 - y) / usableHeight;
  return Math.floor(clamp(fraction * 127, 0, 127) + 0.5);
}

export function xForVelocityHandle(
  beat: number,
  beatWidth: number,
  totalBeats: number
): number {
  'worklet';
  return clamp(
    beat * beatWidth,
    0,
    Math.max(0, totalBeats * beatWidth - HANDLE_WIDTH)
  );
}

export function yForVelocity(
  velocity: number,
  areaHeight: number,
  bottomPad = 32,
  handleHeight = 16
): number {
  'worklet';
  const baseline = areaHeight - bottomPad;
  const usableHeight = Math.max(1, baseline - handleHeight);
  return (
    baseline - handleHeight / 2 - (clamp(velocity, 0, 127) / 127) * usableHeight
  );
}

export function beatFromX(
  x: number,
  beatWidth: number,
  totalBeats: number
): number {
  'worklet';
  return clamp(x / Math.max(beatWidth, 1), 0, totalBeats);
}

export function bendFromMidpoint(
  from: number,
  to: number,
  midpoint: number
): number {
  'worklet';
  const linearMid = (from + to) / 2;
  const mid = clamp(midpoint, 0, 127);
  const denominator = mid >= linearMid ? 127 - linearMid : linearMid;
  if (denominator === 0) return 0;
  return clamp((mid - linearMid) / denominator, -1, 1);
}

export function curveFromDrag(
  start: LogicalPoint,
  end: LogicalPoint,
  beatWidth: number,
  areaHeight: number,
  totalBeats: number,
  bend: number
): VelocityContour {
  'worklet';
  const startBeat = beatFromX(start.x, beatWidth, totalBeats);
  const endBeat = beatFromX(end.x, beatWidth, totalBeats);
  const startVelocity = velocityFromY(start.y, areaHeight);
  const endVelocity = velocityFromY(end.y, areaHeight);
  if (startBeat <= endBeat) {
    return {
      startBeat,
      endBeat,
      variant: {
        type: 'curve',
        from: startVelocity,
        to: endVelocity,
        bend: clamp(bend, -1, 1),
      },
    };
  }
  return {
    startBeat: endBeat,
    endBeat: startBeat,
    variant: {
      type: 'curve',
      from: endVelocity,
      to: startVelocity,
      bend: clamp(bend, -1, 1),
    },
  };
}

const pointLineDistance = (
  point: LogicalPoint,
  start: LogicalPoint,
  end: LogicalPoint
): number => {
  'worklet';
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0)
    return Math.hypot(point.x - start.x, point.y - start.y);
  const t = clamp(
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy),
    0,
    1
  );
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
};

export function simplifyPolyline(
  points: readonly LogicalPoint[],
  tolerance = 2
): LogicalPoint[] {
  'worklet';
  if (points.length <= 2) return [...points];
  let furthestIndex = -1;
  let furthestDistance = tolerance;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = pointLineDistance(points[index]!, first, last);
    if (distance > furthestDistance) {
      furthestDistance = distance;
      furthestIndex = index;
    }
  }
  if (furthestIndex < 0) return [first, last];
  const left = simplifyPolyline(points.slice(0, furthestIndex + 1), tolerance);
  const right = simplifyPolyline(points.slice(furthestIndex), tolerance);
  return [...left.slice(0, -1), ...right];
}

export function rawPolylineFromPixels(
  points: readonly LogicalPoint[],
  beatWidth: number,
  areaHeight: number,
  totalBeats: number
): VelocityContour {
  'worklet';
  const converted = points.map((point) => ({
    beat: beatFromX(point.x, beatWidth, totalBeats),
    velocity: velocityFromY(point.y, areaHeight),
  }));
  const beats = converted.map((point) => point.beat);
  return {
    startBeat: Math.min(...beats),
    endBeat: Math.max(...beats),
    variant: { type: 'polyline', points: converted },
  };
}

export function polylineFromPixels(
  points: readonly LogicalPoint[],
  beatWidth: number,
  areaHeight: number,
  totalBeats: number,
  tolerance = 2
): VelocityContour {
  'worklet';
  return rawPolylineFromPixels(
    simplifyPolyline(points, tolerance),
    beatWidth,
    areaHeight,
    totalBeats
  );
}

export function latchPointerModifiers(modifiers: {
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
}): { curve: boolean; fine: boolean; mode: VelocityContourMode } {
  return {
    curve: modifiers.shiftKey === true,
    fine: modifiers.altKey === true,
    mode:
      modifiers.metaKey === true || modifiers.ctrlKey === true
        ? 'additive'
        : 'absolute',
  };
}

export function contourPreviewVelocities<T extends VelocityEditableNote>(
  contour: VelocityContour,
  mode: VelocityContourMode,
  notes: readonly T[],
  noteIndexes: readonly number[]
): number[] {
  'worklet';
  const preview = Array(notes.length).fill(-1) as number[];
  const selected = noteIndexes.map((index) => notes[index]!);
  const transformed = applyContour(contour, selected, mode);
  const rangeStart = Math.min(contour.startBeat, contour.endBeat);
  const rangeEnd = Math.max(contour.startBeat, contour.endBeat);
  noteIndexes.forEach((index, offset) => {
    const note = notes[index];
    if (note && note.position >= rangeStart && note.position <= rangeEnd) {
      preview[index] = transformed[offset]!.velocity;
    }
  });
  return preview;
}

export function makeVelocityPreset<T extends VelocityEditableNote>(
  preset: VelocityPreset,
  notes: readonly T[]
): VelocityContour | null {
  if (notes.length === 0) return null;
  const ordered = notes
    .map((note, index) => ({ note, index }))
    .sort(
      (left, right) =>
        left.note.position - right.note.position || left.index - right.index
    )
    .map(({ note }) => note);
  const startBeat = ordered[0]!.position;
  const endBeat = ordered[ordered.length - 1]!.position;
  if (preset === 'ramp' || preset === 'fade' || preset === 'arch') {
    return {
      startBeat,
      endBeat,
      variant: {
        type: 'curve',
        from: preset === 'fade' ? 112 : 64,
        to: preset === 'ramp' ? 112 : 64,
        bend: preset === 'arch' ? 0.75 : 0,
      },
    };
  }
  if (preset === 'wave') {
    const span = endBeat - startBeat;
    return {
      startBeat,
      endBeat,
      variant: {
        type: 'polyline',
        points: [64, 112, 64, 112, 64].map((velocity, index) => ({
          beat: startBeat + (span * index) / 4,
          velocity,
        })),
      },
    };
  }
  const onsets = ordered.filter(
    (note, index) =>
      index === 0 || note.position !== ordered[index - 1]!.position
  );
  return {
    startBeat,
    endBeat,
    variant: {
      type: 'polyline',
      points: onsets.map((note, index) => ({
        beat: note.position,
        velocity: index % 4 === 0 ? 120 : 80,
      })),
    },
  };
}

export function makeVelocityNudge<T extends VelocityEditableNote>(
  notes: readonly T[],
  delta: number
): VelocityContour | null {
  if (notes.length === 0) return null;
  const positions = notes.map((note) => note.position);
  const sample = clamp(64 + delta, 0, 127);
  return {
    startBeat: Math.min(...positions),
    endBeat: Math.max(...positions),
    variant: { type: 'curve', from: sample, to: sample, bend: 0 },
  };
}

export function contourSummary(
  contour: VelocityContour,
  affectedCount: number
): string {
  if (contour.variant.type === 'curve') {
    return `${affectedCount} notes · ${contour.variant.from}→${contour.variant.to}`;
  }
  return `${affectedCount} notes · freehand`;
}
