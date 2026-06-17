import { hasExportableAudioContent } from '../hasExportableAudioContent';
import {
  createMockClip,
  createMockNote,
  createMockTrack,
  resetMockIds,
} from '../../mocks';

beforeEach(() => resetMockIds());

describe('hasExportableAudioContent', () => {
  it('is false with no tracks', () => {
    expect(hasExportableAudioContent([])).toBe(false);
  });

  it('is false when every clip is empty', () => {
    const track = createMockTrack({ clips: [createMockClip({ notes: [] })] });
    expect(hasExportableAudioContent([track])).toBe(false);
  });

  it('is true when a clip has MIDI notes', () => {
    const track = createMockTrack({
      clips: [createMockClip({ notes: [createMockNote()] })],
    });
    expect(hasExportableAudioContent([track])).toBe(true);
  });

  it('is true when a clip has an audio-file reference', () => {
    const track = createMockTrack({
      type: 'audio',
      clips: [createMockClip({ notes: [], audioFileReference: 'a/b.wav' })],
    });
    expect(hasExportableAudioContent([track])).toBe(true);
  });

  it('ignores whitespace-only audio references', () => {
    const track = createMockTrack({
      type: 'audio',
      clips: [createMockClip({ notes: [], audioFileReference: '   ' })],
    });
    expect(hasExportableAudioContent([track])).toBe(false);
  });
});
