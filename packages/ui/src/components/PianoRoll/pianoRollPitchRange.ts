import type { PianoRollGuidance } from '../../features/playground/stores/editorPolicy';

export interface MelodicPitchRange {
  minPitch: number;
  pitchCount: number;
}

/** JS-side view geometry only: never transpose or modify authored notes.
 * Keep the preferred two-octave window when it fits. Otherwise start on the
 * lowest required octave and extend far enough to include notes and guidance.
 * Empty Practice steps can therefore expose a focused pitch before editing.
 */
export function getMelodicPitchRange(
  preferredMinPitch: number,
  notes: readonly { noteNumber: number }[],
  guidance?: PianoRollGuidance,
  selectedMidiPitch?: number
): MelodicPitchRange {
  const preferred = Math.max(
    0,
    Math.min(
      104,
      Number.isFinite(preferredMinPitch) ? Math.trunc(preferredMinPitch) : 48
    )
  );
  let lowest = Infinity;
  let highest = -Infinity;
  const include = (pitch: number) => {
    if (!Number.isInteger(pitch) || pitch < 0 || pitch > 127) return;
    lowest = Math.min(lowest, pitch);
    highest = Math.max(highest, pitch);
  };
  notes.forEach((note) => include(note.noteNumber));
  if (selectedMidiPitch != null) include(selectedMidiPitch);
  guidance?.focusedNoteNumbers?.forEach(include);
  guidance?.targets?.forEach((target) => include(target.noteNumber));
  if (
    lowest === Infinity ||
    (lowest >= preferred && highest < preferred + 24)
  ) {
    return { minPitch: preferred, pitchCount: 24 };
  }
  const minPitch = Math.min(104, Math.floor(lowest / 12) * 12);
  return { minPitch, pitchCount: Math.max(24, highest - minPitch + 1) };
}
