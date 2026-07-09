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
        },
        ctx
      )
    ).toEqual({ noteNumber: 36, position: 1.5 });

    expect(getResizedNoteDuration(0.5, 31, ctx)).toBe(1);
  });
});
