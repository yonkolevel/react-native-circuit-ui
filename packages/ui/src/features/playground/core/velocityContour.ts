export interface VelocityContourPoint {
  beat: number;
  velocity: number;
}

export type VelocityContour = {
  startBeat: number;
  endBeat: number;
  variant:
    | { type: 'curve'; from: number; to: number; bend: number }
    | { type: 'polyline'; points: readonly VelocityContourPoint[] };
};

export type VelocityContourMode = 'absolute' | 'additive' | 'scale';

export interface VelocityEditableNote {
  position: number;
  velocity: number;
}

const clamp = (value: number, min: number, max: number) => {
  'worklet';
  return Math.min(max, Math.max(min, value));
};

const midiValue = (value: number) => {
  'worklet';
  return Math.floor(clamp(value, 0, 127) + 0.5);
};

function normalizeContour(contour: VelocityContour): VelocityContour {
  'worklet';
  const { startBeat, endBeat } = contour;
  if (!Number.isFinite(startBeat) || !Number.isFinite(endBeat)) {
    throw new RangeError('Velocity contour range must be finite');
  }

  if (contour.variant.type === 'curve') {
    const { from, to, bend } = contour.variant;
    if (![from, to, bend].every(Number.isFinite)) {
      throw new RangeError('Velocity curve values must be finite');
    }
    const reversed = startBeat > endBeat;
    return {
      startBeat: Math.min(startBeat, endBeat),
      endBeat: Math.max(startBeat, endBeat),
      variant: {
        type: 'curve',
        from: clamp(reversed ? to : from, 0, 127),
        to: clamp(reversed ? from : to, 0, 127),
        bend: clamp(bend, -1, 1),
      },
    };
  }

  if (contour.variant.points.length === 0) {
    throw new RangeError('Velocity polyline requires at least one point');
  }
  const points = contour.variant.points
    .map((point, index) => {
      if (!Number.isFinite(point.beat) || !Number.isFinite(point.velocity)) {
        throw new RangeError('Velocity polyline points must be finite');
      }
      return {
        index,
        beat: point.beat,
        velocity: clamp(point.velocity, 0, 127),
      };
    })
    .sort((a, b) => a.beat - b.beat || a.index - b.index)
    .reduce<VelocityContourPoint[]>((result, point) => {
      const value = { beat: point.beat, velocity: point.velocity };
      if (result.at(-1)?.beat === point.beat) result[result.length - 1] = value;
      else result.push(value);
      return result;
    }, []);

  return {
    startBeat: Math.min(startBeat, endBeat),
    endBeat: Math.max(startBeat, endBeat),
    variant: { type: 'polyline', points },
  };
}

function sampleNormalized(contour: VelocityContour, beat: number): number {
  'worklet';
  if (!Number.isFinite(beat))
    throw new RangeError('Sample beat must be finite');
  const sampledBeat = clamp(beat, contour.startBeat, contour.endBeat);
  const variant = contour.variant;

  if (variant.type === 'curve') {
    const t =
      contour.startBeat === contour.endBeat
        ? 0
        : (sampledBeat - contour.startBeat) /
          (contour.endBeat - contour.startBeat);
    const linear = variant.from + (variant.to - variant.from) * t;
    const target = variant.bend >= 0 ? 127 : 0;
    return midiValue(
      linear +
        Math.abs(variant.bend) * Math.sin(Math.PI * t) * (target - linear)
    );
  }

  const points = variant.points;
  if (points.length === 1 || sampledBeat <= points[0]!.beat) {
    return midiValue(points[0]!.velocity);
  }
  const last = points[points.length - 1]!;
  if (sampledBeat >= last.beat) return midiValue(last.velocity);

  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]!;
    const to = points[index]!;
    if (sampledBeat > to.beat) continue;
    const t = (sampledBeat - from.beat) / (to.beat - from.beat);
    return midiValue(from.velocity + (to.velocity - from.velocity) * t);
  }

  return midiValue(last.velocity);
}

export function sampleContour(contour: VelocityContour, beat: number): number {
  'worklet';
  return sampleNormalized(normalizeContour(contour), beat);
}

export function applyContour<T extends VelocityEditableNote>(
  contour: VelocityContour,
  notes: readonly T[],
  mode: VelocityContourMode
): T[] {
  'worklet';
  const normalized = normalizeContour(contour);
  return notes.map((note) => {
    if (
      note.position < normalized.startBeat ||
      note.position > normalized.endBeat
    ) {
      return note;
    }

    const sample = sampleNormalized(normalized, note.position);
    const value =
      mode === 'absolute'
        ? sample
        : mode === 'additive'
          ? note.velocity + sample - 64
          : (note.velocity * sample) / 64;
    const velocity = midiValue(value);
    return velocity === note.velocity ? note : ({ ...note, velocity } as T);
  });
}
