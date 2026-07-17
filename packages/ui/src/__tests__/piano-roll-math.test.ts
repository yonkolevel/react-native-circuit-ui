import {
  getGridPointNoteTarget,
  getMovedNoteTarget,
  getResizedNoteDuration,
  hitTestPianoRollNote,
} from '../components/PianoRoll/pianoRollMath';
import type { ClipNote, Sample } from '../features/playground/types';

const samples: Sample[] = [
  { id: 'kick', name: 'Kick', fileName: 'kick.wav', noteNumber: 36 },
  { id: 'snare', name: 'Snare', fileName: 'snare.wav', noteNumber: 38 },
  { id: 'hat', name: 'Hat', fileName: 'hat.wav', noteNumber: 42 },
];

const ctx = {
  samples,
  isDrum: true,
  basePitch: 0,
  totalPitches: 3,
  beatWidth: 80,
  stepWidth: 20,
  gridWidth: 320,
  rowHeight: 30,
  pitchToMidi: samples.map((sample) => sample.noteNumber),
};

const notes: ClipNote[] = [
  { noteNumber: 38, position: 1, duration: 0.5, velocity: 100 },
];

describe('pianoRollMath', () => {
  it('maps grid coordinates to snapped position and visible row pitch', () => {
    expect(getGridPointNoteTarget(45, 10, ctx)).toEqual({
      noteNumber: 42,
      position: 0.5,
    });
  });

  it('hit-tests padded notes and marks the resize edge', () => {
    expect(hitTestPianoRollNote(notes, 118, 46, ctx)).toEqual({
      idx: 0,
      isResizeEdge: true,
    });
  });

  it('snaps move and resize math to sixteenth steps', () => {
    expect(
      getMovedNoteTarget(
        {
          startX: 80,
          startY: 45,
          endX: 122,
          endY: 78,
          originalPosition: 1,
          originalDuration: 0.5,
          originalNoteNumber: 38,
        },
        ctx
      )
    ).toEqual({ noteNumber: 36, position: 1.5 });

    // Resize snaps to the nearest half-step (edge or cell center), not just
    // whole steps — 71px lands closer to the 70px half-step than the 80px
    // edge.
    expect(getResizedNoteDuration(0.5, 31, ctx)).toBe(0.875);
  });

  it('rejects grid taps outside the horizontal bounds', () => {
    expect(getGridPointNoteTarget(-1, 10, ctx)).toBeNull();
    expect(getGridPointNoteTarget(ctx.gridWidth, 10, ctx)).toBeNull();
  });

  it('keeps pitch stable for horizontal drags from padded hit space', () => {
    expect(
      getMovedNoteTarget(
        {
          startX: 80,
          startY: 20,
          endX: 100,
          endY: 20,
          originalPosition: 1,
          originalDuration: 0.5,
          originalNoteNumber: 38,
        },
        ctx
      )
    ).toEqual({ noteNumber: 38, position: 1.25 });
  });

  it('clamps move and resize boundaries', () => {
    expect(
      getMovedNoteTarget(
        {
          startX: 80,
          startY: 45,
          endX: -200,
          endY: -200,
          originalPosition: 1,
          originalDuration: 0.5,
          originalNoteNumber: 38,
        },
        ctx
      )
    ).toEqual({ noteNumber: 42, position: 0 });
    // Minimum duration floor is now half a step (10px = 0.125 beats), not a
    // full step, matching the half-step snap grid.
    expect(getResizedNoteDuration(0.5, -100, ctx)).toBe(0.125);
    expect(getResizedNoteDuration(0.5, 200, ctx, 3.5)).toBe(0.5);

    expect(
      getMovedNoteTarget(
        {
          startX: 80,
          startY: 45,
          endX: 500,
          endY: 45,
          originalPosition: 1,
          originalDuration: 0.5,
          originalNoteNumber: 38,
        },
        ctx
      ).position
    ).toBe(3.5);
  });
});
