/**
 * Playground Mock Data Factories
 *
 * Injectable fixtures for all playground types.
 * Every factory returns realistic data matching SwiftUI defaults.
 */
import type {
  MIDINoteData,
  Sample,
  SoundBank,
  SongSection,
  ClipState,
  TrackState,
  SongState,
  PlaygroundState,
} from '../types';
// InstrumentType used in createMockTrack parameter type via overrides

import { INSTRUMENT_COLORS } from '../types';

// ─── Atomic Factories ───────────────────────────────────────────────────────

let _noteId = 0;
export function createMockNote(overrides?: Partial<MIDINoteData>): MIDINoteData {
  return {
    noteNumber: 60, // Middle C
    velocity: 100,
    startBeat: 0,
    duration: 1,
    ...overrides,
  };
}

export function createMockSample(overrides?: Partial<Sample>): Sample {
  const name = overrides?.name ?? 'Kick';
  return {
    id: `sample-${++_noteId}`,
    name,
    fileName: `${name.toLowerCase().replace(/\s+/g, '_')}.wav`,
    noteNumber: 36,
    ...overrides,
  };
}

export function createMockSoundBank(
  overrides?: Partial<SoundBank>
): SoundBank {
  return {
    category: 'drums',
    color: '#1AFFA8',
    defaultOctave: 4,
    defaultPreset: 'default',
    filters: [],
    instrumentSlug: 'analog-rytm-808',
    isDeprecated: false,
    name: 'Analog Rytm 808 Drums',
    release: 0.1,
    samples: [
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
    ],
    ...overrides,
  };
}

export function createMockMelodicSoundBank(
  overrides?: Partial<SoundBank>
): SoundBank {
  return createMockSoundBank({
    category: 'keys',
    color: '#FF6C3A',
    instrumentSlug: 'argon8-rhode-keys',
    name: 'Argon 8 Rhode Keys',
    samples: [],
    ...overrides,
  });
}

// ─── Section Factory ────────────────────────────────────────────────────────

let _sectionId = 0;
export function createMockSection(
  overrides?: Partial<SongSection>
): SongSection {
  const id = ++_sectionId;
  return {
    id: `section-${id}`,
    name: id === 1 ? 'Intro' : `Section ${id}`,
    index: id - 1,
    lengthInBars: 4,
    ...overrides,
  };
}

// ─── Clip Factory ───────────────────────────────────────────────────────────

let _clipId = 0;
export function createMockClip(overrides?: Partial<ClipState>): ClipState {
  const id = ++_clipId;
  return {
    id,
    lengthInBars: 4,
    activeLengthInBars: 4,
    trackID: 1,
    sectionID: 'section-1',
    color: INSTRUMENT_COLORS.drum,
    midiNoteData: [],
    soundBank: createMockSoundBank(),
    isInCurrentSection: true,
    isRecordingEnabled: false,
    ...overrides,
  };
}

/** Create a clip with a basic drum pattern */
export function createMockDrumClip(overrides?: Partial<ClipState>): ClipState {
  return createMockClip({
    midiNoteData: [
      // Kick on 1 and 3
      createMockNote({ noteNumber: 36, startBeat: 0, duration: 0.25 }),
      createMockNote({ noteNumber: 36, startBeat: 2, duration: 0.25 }),
      // Snare on 2 and 4
      createMockNote({ noteNumber: 38, startBeat: 1, duration: 0.25 }),
      createMockNote({ noteNumber: 38, startBeat: 3, duration: 0.25 }),
      // Hi-hat on every beat
      createMockNote({ noteNumber: 42, startBeat: 0, duration: 0.25, velocity: 80 }),
      createMockNote({ noteNumber: 42, startBeat: 0.5, duration: 0.25, velocity: 60 }),
      createMockNote({ noteNumber: 42, startBeat: 1, duration: 0.25, velocity: 80 }),
      createMockNote({ noteNumber: 42, startBeat: 1.5, duration: 0.25, velocity: 60 }),
      createMockNote({ noteNumber: 42, startBeat: 2, duration: 0.25, velocity: 80 }),
      createMockNote({ noteNumber: 42, startBeat: 2.5, duration: 0.25, velocity: 60 }),
      createMockNote({ noteNumber: 42, startBeat: 3, duration: 0.25, velocity: 80 }),
      createMockNote({ noteNumber: 42, startBeat: 3.5, duration: 0.25, velocity: 60 }),
    ],
    ...overrides,
  });
}

/** Create a clip with a simple melody */
export function createMockMelodyClip(overrides?: Partial<ClipState>): ClipState {
  return createMockClip({
    color: INSTRUMENT_COLORS.melodic,
    soundBank: createMockMelodicSoundBank(),
    midiNoteData: [
      createMockNote({ noteNumber: 60, startBeat: 0, duration: 1 }), // C4
      createMockNote({ noteNumber: 64, startBeat: 1, duration: 1 }), // E4
      createMockNote({ noteNumber: 67, startBeat: 2, duration: 1 }), // G4
      createMockNote({ noteNumber: 72, startBeat: 3, duration: 1 }), // C5
    ],
    ...overrides,
  });
}

// ─── Track Factory ──────────────────────────────────────────────────────────

let _trackId = 0;
export function createMockTrack(overrides?: Partial<TrackState>): TrackState {
  const id = ++_trackId;
  const type = overrides?.type ?? 'drum';
  return {
    id,
    type,
    title: type === 'drum' ? 'Drums' : type === 'melodic' ? 'Keys' : type === 'bass' ? 'Bass' : 'Audio',
    color: INSTRUMENT_COLORS[type],
    clips: [],
    soundBank: type === 'drum' ? createMockSoundBank() : createMockMelodicSoundBank(),
    volume: 90,
    pan: 0,
    isMuted: false,
    isSoloed: false,
    ...overrides,
  };
}

// ─── Song Factory ───────────────────────────────────────────────────────────

export function createMockSong(overrides?: Partial<SongState>): SongState {
  const section = createMockSection({ id: 'section-1', name: 'Intro', index: 0 });
  const drumTrack = createMockTrack({
    id: 1,
    type: 'drum',
    title: 'Drums',
    clips: [createMockDrumClip({ trackID: 1, sectionID: section.id })],
  });
  const keysTrack = createMockTrack({
    id: 2,
    type: 'melodic',
    title: 'Keys',
    clips: [createMockMelodyClip({ trackID: 2, sectionID: section.id })],
  });
  const bassTrack = createMockTrack({
    id: 3,
    type: 'bass',
    title: 'Bass',
    clips: [],
  });

  return {
    id: 'song-1',
    sections: [section, createMockSection({ id: 'section-2', name: 'Verse', index: 1 })],
    currentSection: section,
    isPlaying: false,
    tempo: 120,
    masterVolume: 90,
    lengthInBeats: 16,
    isLoopEnabled: true,
    isMetronomeEnabled: false,
    isRecording: false,
    isRecordingArmed: false,
    tracks: [drumTrack, keysTrack, bassTrack],
    soundBanks: [createMockSoundBank(), createMockMelodicSoundBank()],
    currentView: 'song',
    currentBeatPosition: 0,
    zoomLevel: 1,
    isNewTrackMenuVisible: false,
    isSoundBankViewVisible: false,
    isSectionNameEditViewVisible: false,
    isClipSettingsVisible: false,
    ...overrides,
  };
}

// ─── Playground Factory ─────────────────────────────────────────────────────

export function createMockPlayground(
  overrides?: Partial<PlaygroundState>
): PlaygroundState {
  return {
    id: 'playground-1',
    name: 'My First Beat',
    author: 'Ricardo',
    createdAt: new Date().toISOString(),
    song: createMockSong(),
    isLoading: false,
    ...overrides,
  };
}

/** Create a list of playgrounds for the dashboard */
export function createMockPlaygroundsList(count: number = 4): PlaygroundState[] {
  const names = [
    'My First Beat',
    'Sunset Vibes',
    'Lo-Fi Chill',
    'Drum & Bass Experiment',
    'Ambient Textures',
    'Pop Progression',
    'Jazz Chords',
    'Trap Beat',
  ];

  return Array.from({ length: count }, (_, i) =>
    createMockPlayground({
      id: `playground-${i + 1}`,
      name: names[i % names.length]!,
      song: createMockSong({ id: `song-${i + 1}` }),
    })
  );
}

// ─── Reset ID counters (for tests) ─────────────────────────────────────────

export function resetMockIds(): void {
  _noteId = 0;
  _sectionId = 0;
  _clipId = 0;
  _trackId = 0;
}
