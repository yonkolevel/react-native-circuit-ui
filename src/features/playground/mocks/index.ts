/**
 * Mock Data Factories — aligned with midicircuit-rn types
 */
import type {
  ClipNote,
  Sample,
  SoundBankRef,
  Section,
  Clip,
  Track,
  SongViewState,
  PlaygroundState,
} from '../types';
import { INSTRUMENT_COLORS } from '../types';
import type { InstrumentType } from '../types';

// ─── Atomic Factories ───────────────────────────────────────────────────────

let _id = 0;

export function createMockNote(overrides?: Partial<ClipNote>): ClipNote {
  return {
    noteNumber: 60,
    velocity: 100,
    position: 0,
    duration: 1,
    ...overrides,
  };
}

export function createMockSample(overrides?: Partial<Sample>): Sample {
  const name = overrides?.name ?? 'Kick';
  return {
    id: `sample-${++_id}`,
    name,
    fileName: `${name.toLowerCase().replace(/\s+/g, '_')}.wav`,
    noteNumber: 36,
    ...overrides,
  };
}

export function createMockSoundBank(
  overrides?: Partial<SoundBankRef>
): SoundBankRef {
  return {
    slug: 'analog-rytm-808',
    name: 'Analog Rytm 808 Drums',
    ...overrides,
  };
}

export function createMockSection(overrides?: Partial<Section>): Section {
  const id = overrides?.id ?? ++_id;
  return {
    id: typeof id === 'number' ? id : _id,
    name: `Section ${id}`,
    ...overrides,
  };
}

// ─── Samples (for DrumPads — UI-only, not in songStore) ─────────────────────

export function createDrumSamples(): Sample[] {
  return [
    createMockSample({ name: 'Kick', noteNumber: 36 }),
    createMockSample({ name: 'Snare', noteNumber: 38 }),
    createMockSample({ name: 'Closed HH', noteNumber: 42 }),
    createMockSample({ name: 'Open HH', noteNumber: 46 }),
    createMockSample({ name: 'Clap', noteNumber: 39 }),
    createMockSample({ name: 'Tom Low', noteNumber: 41 }),
    createMockSample({ name: 'Tom Mid', noteNumber: 43 }),
    createMockSample({ name: 'Tom High', noteNumber: 45 }),
    createMockSample({ name: 'Cymbal', noteNumber: 49 }),
    createMockSample({ name: 'Ride', noteNumber: 51 }),
    createMockSample({ name: 'Rim', noteNumber: 37 }),
    createMockSample({ name: 'Cowbell', noteNumber: 56 }),
    createMockSample({ name: 'Shaker', noteNumber: 69 }),
    createMockSample({ name: 'Perc 1', noteNumber: 60 }),
    createMockSample({ name: 'Perc 2', noteNumber: 61 }),
    createMockSample({ name: 'FX', noteNumber: 62 }),
  ];
}

// ─── Clip Factory ───────────────────────────────────────────────────────────

export function createMockClip(overrides?: Partial<Clip>): Clip {
  const id = ++_id;
  return {
    id,
    trackID: 1,
    sectionID: 1,
    lengthInBars: 4,
    activeLengthInBars: 4,
    colorHex: INSTRUMENT_COLORS.drum,
    notes: [],
    ...overrides,
  };
}

export function createMockDrumClip(overrides?: Partial<Clip>): Clip {
  return createMockClip({
    notes: [
      createMockNote({ noteNumber: 36, position: 0, duration: 0.25 }),
      createMockNote({ noteNumber: 36, position: 2, duration: 0.25 }),
      createMockNote({ noteNumber: 38, position: 1, duration: 0.25 }),
      createMockNote({ noteNumber: 38, position: 3, duration: 0.25 }),
      createMockNote({
        noteNumber: 42,
        position: 0,
        duration: 0.25,
        velocity: 80,
      }),
      createMockNote({
        noteNumber: 42,
        position: 0.5,
        duration: 0.25,
        velocity: 60,
      }),
      createMockNote({
        noteNumber: 42,
        position: 1,
        duration: 0.25,
        velocity: 80,
      }),
      createMockNote({
        noteNumber: 42,
        position: 1.5,
        duration: 0.25,
        velocity: 60,
      }),
      createMockNote({
        noteNumber: 42,
        position: 2,
        duration: 0.25,
        velocity: 80,
      }),
      createMockNote({
        noteNumber: 42,
        position: 2.5,
        duration: 0.25,
        velocity: 60,
      }),
      createMockNote({
        noteNumber: 42,
        position: 3,
        duration: 0.25,
        velocity: 80,
      }),
      createMockNote({
        noteNumber: 42,
        position: 3.5,
        duration: 0.25,
        velocity: 60,
      }),
    ],
    ...overrides,
  });
}

export function createMockMelodyClip(overrides?: Partial<Clip>): Clip {
  return createMockClip({
    colorHex: INSTRUMENT_COLORS.melodic,
    notes: [
      createMockNote({ noteNumber: 60, position: 0, duration: 1 }),
      createMockNote({ noteNumber: 64, position: 1, duration: 1 }),
      createMockNote({ noteNumber: 67, position: 2, duration: 1 }),
      createMockNote({ noteNumber: 72, position: 3, duration: 1 }),
    ],
    ...overrides,
  });
}

// ─── Track Factory ──────────────────────────────────────────────────────────

export function createMockTrack(overrides?: Partial<Track>): Track {
  const id = ++_id;
  const type: InstrumentType = overrides?.type ?? 'drum';
  return {
    id,
    type,
    title:
      type === 'drum'
        ? 'Drums'
        : type === 'melodic'
          ? 'Keys'
          : type === 'bass'
            ? 'Bass'
            : 'Audio',
    colorHex: INSTRUMENT_COLORS[type],
    soundBank: createMockSoundBank({
      slug: `${type}-default`,
      name: `Default ${type}`,
    }),
    clips: [],
    volume: 90,
    pan: 0,
    isMuted: false,
    isSoloed: false,
    ...overrides,
  };
}

// ─── Song Factory ───────────────────────────────────────────────────────────

export function createMockSong(
  overrides?: Partial<SongViewState>
): SongViewState {
  const section1 = createMockSection({ id: 1, name: 'Intro' });
  const section2 = createMockSection({ id: 2, name: 'Verse' });

  const drumTrack = createMockTrack({
    id: 1,
    type: 'drum',
    title: 'Drums',
    clips: [createMockDrumClip({ trackID: 1, sectionID: section1.id })],
  });
  const keysTrack = createMockTrack({
    id: 2,
    type: 'melodic',
    title: 'Keys',
    clips: [createMockMelodyClip({ trackID: 2, sectionID: section1.id })],
  });
  const bassTrack = createMockTrack({
    id: 3,
    type: 'bass',
    title: 'Bass',
  });

  return {
    id: 'song-1',
    isPlaying: false,
    tempo: 120,
    isLoopEnabled: true,
    isMetronomeEnabled: false,
    isRecording: false,
    isRecordingArmed: false,
    sections: [section1, section2],
    currentSectionId: section1.id,
    tracks: [drumTrack, keysTrack, bassTrack],
    currentBeatPosition: 0,
    isDirty: false,
    masterVolume: 90,
    currentTab: 'song' as const,
    availableSoundBanks: [],
    selectedSoundBankSlug: null,
    undoStacks: {},
    redoStacks: {},
    liveRecordingNotes: {},
    isClipSettingsVisible: false,
    showPianoNoteNames: false,
    recordingCountIn: null,
    // UI-only state
    currentView: 'song',
    zoomLevel: 1,
    isNewTrackMenuVisible: false,
    isSoundBankViewVisible: false,
    currentSoundBankCategorySelection: undefined,
    isSectionNameEditViewVisible: false,
    soundBanks: [createMockSoundBank()],
    ...overrides,
  };
}

// ─── Playground Factory ─────────────────────────────────────────────────────

export function createMockPlayground(
  overrides?: Partial<PlaygroundState>
): PlaygroundState {
  return {
    id: `playground-${++_id}`,
    name: 'My First Beat',
    author: 'Ricardo',
    createdAt: new Date().toISOString(),
    isLoading: false,
    ...overrides,
  };
}

export function createMockPlaygroundsList(
  count: number = 4
): PlaygroundState[] {
  const names = [
    'My First Beat',
    'Sunset Vibes',
    'Lo-Fi Chill',
    'Drum & Bass Experiment',
  ];
  return Array.from({ length: count }, (_, i) =>
    createMockPlayground({
      id: `playground-${i + 1}`,
      name: names[i % names.length]!,
    })
  );
}

export function resetMockIds(): void {
  _id = 0;
}
