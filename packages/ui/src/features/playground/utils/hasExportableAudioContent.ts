/**
 * hasExportableAudioContent — shared exportability rule.
 *
 * Mirrors the native iOS/macOS definition in MidicircuitKit
 * (`Song.State.hasExportableAudioContent` + `Clip.hasExportableAudioContent`):
 * a playground is exportable when at least one clip on any track has MIDI
 * notes or a non-empty audio-file reference.
 *
 * Keeping this in one place means RN and native stay in agreement about what
 * "nothing to export" means.
 */
import type { Track } from '../types';

export function hasExportableAudioContent(tracks: Track[]): boolean {
  return tracks.some((track) =>
    track.clips.some((clip) => {
      const hasMidiNotes = clip.notes.length > 0;
      const hasAudioFile =
        typeof clip.audioFileReference === 'string' &&
        clip.audioFileReference.trim().length > 0;
      return hasMidiNotes || hasAudioFile;
    })
  );
}
