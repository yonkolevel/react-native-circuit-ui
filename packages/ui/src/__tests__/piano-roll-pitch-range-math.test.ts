import { getMelodicPitchRange } from '../components/PianoRoll/pianoRollPitchRange';

const notes = (...pitches: number[]) =>
  pitches.map((noteNumber) => ({ noteNumber }));

describe('melodic view range', () => {
  it('preserves an empty or already-fitting preferred window', () => {
    expect(getMelodicPitchRange(24, [])).toEqual({
      minPitch: 24,
      pitchCount: 24,
    });
    expect(getMelodicPitchRange(24, notes(24, 36, 47))).toEqual({
      minPitch: 24,
      pitchCount: 24,
    });
  });

  it('fits the original scale above the sound-bank register', () => {
    expect(
      getMelodicPitchRange(24, notes(60, 62, 64, 65, 67, 69, 71, 72))
    ).toEqual({ minPitch: 60, pitchCount: 24 });
  });

  it('includes authored focus and target pitches without adding notes', () => {
    expect(
      getMelodicPitchRange(24, [], {
        focusedNoteNumbers: [60],
        targets: [{ noteNumber: 72, position: 3 }],
      })
    ).toEqual({ minPitch: 60, pitchCount: 24 });
  });

  it('covers low, high and wider-than-two-octave material within MIDI bounds', () => {
    expect(getMelodicPitchRange(48, notes(0, 12))).toEqual({
      minPitch: 0,
      pitchCount: 24,
    });
    expect(getMelodicPitchRange(48, notes(127))).toEqual({
      minPitch: 104,
      pitchCount: 24,
    });
    expect(getMelodicPitchRange(48, notes(0, 127))).toEqual({
      minPitch: 0,
      pitchCount: 128,
    });
  });

  it('keeps geometry finite for invalid preferences or invalid pitch metadata', () => {
    expect(
      getMelodicPitchRange(NaN, notes(NaN, Infinity, -1, 128, 60.5))
    ).toEqual({ minPitch: 48, pitchCount: 24 });
    expect(getMelodicPitchRange(127, [])).toEqual({
      minPitch: 104,
      pitchCount: 24,
    });
    expect(getMelodicPitchRange(-12, [])).toEqual({
      minPitch: 0,
      pitchCount: 24,
    });
  });

  it('is bounded, contains every required pitch and is idempotent across parent/grid', () => {
    for (const preferred of [0, 24, 48, 60, 104]) {
      for (const low of [0, 12, 24, 59, 60, 104, 127]) {
        for (const high of [low, Math.min(127, low + 12), 127]) {
          const required = notes(low, high);
          const range = getMelodicPitchRange(preferred, required);
          expect(range.minPitch).toBeGreaterThanOrEqual(0);
          expect(range.minPitch + range.pitchCount).toBeLessThanOrEqual(128);
          expect(range.minPitch).toBeLessThanOrEqual(low);
          expect(range.minPitch + range.pitchCount).toBeGreaterThan(high);
          expect(getMelodicPitchRange(range.minPitch, required)).toEqual(range);
          expect(required).toEqual(notes(low, high));
        }
      }
    }
  });
});
