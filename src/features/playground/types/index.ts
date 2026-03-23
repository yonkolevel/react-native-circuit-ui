/**
 * Playground Data Models
 *
 * ALIGNED WITH midicircuit-rn/src/stores/songStore.ts
 * These types mirror the real app's store types exactly.
 * When integrating, replace these imports with the app's store types.
 */

// ─── Enums ──────────────────────────────────────────────────────────────────

export type InstrumentType = 'drum' | 'melodic' | 'bass' | 'audio';

export type NotePrecision = '1/4' | '1/8' | '1/16' | '1/32' | 'off';

// ─── Core Models (matching midicircuit-rn songStore exactly) ────────────────

/** Matches midicircuit-rn ClipNote */
export interface ClipNote {
  noteNumber: number;
  velocity: number; // 0-127
  /** Position in beats (e.g., 0, 0.25, 1.5) */
  position: number;
  /** Duration in beats */
  duration: number;
}

/** Matches midicircuit-rn SoundBankRef */
export interface SoundBankRef {
  slug: string;
  name: string;
  /** Number of samples (for pitch count in clip preview) */
  samples?: { noteNumber: number; name?: string; fileName?: string }[];
  /** Base MIDI note (for pitch positioning in clip preview) */
  defaultOctave?: number;
}

/** Matches midicircuit-rn Section */
export interface Section {
  id: number;
  name: string;
}

/** Matches midicircuit-rn Clip */
export interface Clip {
  id: number;
  trackID: number;
  sectionID: number;
  lengthInBars: number;
  activeLengthInBars: number;
  colorHex: string;
  notes: ClipNote[];
  audioFileReference?: string;
  audioFileDuration?: number;
}

/** Matches midicircuit-rn Track */
export interface Track {
  id: number;
  type: InstrumentType;
  title: string;
  colorHex: string;
  soundBank: SoundBankRef;
  clips: Clip[];
  volume: number; // 0-100
  pan: number; // -1 to 1
  isMuted: boolean;
  isSoloed: boolean;
}

/** Matches midicircuit-rn SongState */
export interface SongState {
  id: string;
  isPlaying: boolean;
  tempo: number;
  isLoopEnabled: boolean;
  isMetronomeEnabled: boolean;
  isRecording: boolean;
  sections: Section[];
  currentSectionId: number;
  tracks: Track[];
  currentBeatPosition: number;
  isDirty: boolean;
  masterVolume: number;
}

// ─── UI-only state (not in midicircuit-rn songStore) ────────────────────────
// These exist only for UI presentation and don't need to sync with the app store.

export type SongDestination =
  | 'song'
  | 'mixer'
  | 'settings'
  | { kind: 'pianoRoll'; config: ClipEditorConfig }
  | { kind: 'audioClipEditor'; config: AudioClipEditorConfig };

export interface SongViewState extends SongState {
  currentView: SongDestination;
  zoomLevel: number;
  isNewTrackMenuVisible: boolean;
  isSoundBankViewVisible: boolean;
  currentSoundBankCategorySelection?: InstrumentType;
  isSectionNameEditViewVisible: boolean;
  isClipSettingsVisible: boolean;
  soundBanks: SoundBankRef[];
}

export interface PlaygroundState {
  id: string;
  name: string;
  coverImage?: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
  isLoading: boolean;
}

// ─── Config Types ───────────────────────────────────────────────────────────

export interface ClipEditorConfig {
  clipId: number;
  trackId: number;
  instrumentType: InstrumentType;
}

export interface AudioClipEditorConfig {
  clipId: number;
  trackId: number;
  audioFileReference: string;
}

// ─── Callback Types ─────────────────────────────────────────────────────────

export interface SongCallbacks {
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onRecord?: () => void;
  onTempoChange?: (bpm: number) => void;
  onMasterVolumeChange?: (volume: number) => void;
  onTrackSelect?: (trackId: number) => void;
  onClipSelect?: (clipId: number, trackId: number) => void;
  onEmptyClipPress?: (trackId: number, sectionId: number) => void;
  onAddTrack?: (type: InstrumentType) => void;
  onDeleteTrack?: (trackId: number) => void;
  onSectionSelect?: (sectionId: number) => void;
  onAddSection?: () => void;
  onNavigate?: (destination: SongDestination) => void;
  onToggleMetronome?: () => void;
  onToggleLoop?: () => void;
  onBack?: () => void;
}

export interface MixerCallbacks {
  onVolumeChange?: (trackId: number, volume: number) => void;
  onPanChange?: (trackId: number, pan: number) => void;
  onMuteToggle?: (trackId: number) => void;
  onSoloToggle?: (trackId: number) => void;
}

export interface ClipEditorCallbacks {
  onNoteAdd?: (note: ClipNote) => void;
  onNoteDelete?: (noteIndex: number) => void;
  onNoteMove?: (
    noteIndex: number,
    newPosition: number,
    newNoteNumber: number
  ) => void;
  onNoteResize?: (noteIndex: number, newDuration: number) => void;
  onVelocityChange?: (noteIndex: number, velocity: number) => void;
  onQuantize?: (precision: NotePrecision) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onClose?: () => void;
}

export interface DrumPadCallbacks {
  onPadPress?: (sampleIndex: number) => void;
  onPadRelease?: (sampleIndex: number) => void;
}

export interface PianoKeyCallbacks {
  onKeyPress?: (noteNumber: number, velocity: number) => void;
  onKeyRelease?: (noteNumber: number) => void;
}

// ─── Instrument Color Map ───────────────────────────────────────────────────

export const INSTRUMENT_COLORS: Record<InstrumentType, string> = {
  drum: '#1AFFA8', // mcGreen2
  melodic: '#FF6C3A', // mcOrange2
  bass: '#3AA0FF', // mcBlue2
  audio: '#FF3A6B', // mcPink2
};

export const INSTRUMENT_ICONS: Record<InstrumentType, string> = {
  drum: 'square.grid.2x2',
  melodic: 'music.quarternote.3',
  bass: 'guitars',
  audio: 'mic.fill',
};

// ─── Constants ──────────────────────────────────────────────────────────────

export const CLIP_CONSTANTS = {
  BEATS_PER_BAR: 4,
  STEPS_PER_BEAT: 4,
  STEPS_PER_BAR: 16,
  MAX_BARS: 16,
} as const;

// ─── Deprecated aliases (for backward compat during migration) ──────────────
// Remove these once all components are updated

/** @deprecated Use ClipNote */
export type MIDINoteData = ClipNote;
/** @deprecated Use Clip */
export type ClipState = Clip;
/** @deprecated Use Track */
export type TrackState = Track;
/** @deprecated Use Section */
export type SongSection = Section;
/** @deprecated Use SoundBankRef */
export type SoundBank = SoundBankRef;
/** @deprecated Use SongViewState */
export type SongStateUI = SongViewState;

// Re-export Sample for DrumPads (not in midicircuit-rn yet — UI-only)
export interface Sample {
  id: string;
  name: string;
  fileName: string;
  noteNumber: number;
}

/** Extended sound bank for UI display (SoundBankView needs category + slug) */
export interface SoundBankDisplay extends SoundBankRef {
  category?: string;
  colorHex?: string;
}
