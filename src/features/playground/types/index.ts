/**
 * Playground Data Models
 *
 * TypeScript interfaces matching MidicircuitKit Swift state models exactly.
 * These are presentation-only types — no business logic, no reducers.
 */

// ─── Enums ──────────────────────────────────────────────────────────────────

/** Matches Swift InstrumentType enum */
export type InstrumentType = 'drum' | 'melodic' | 'bass' | 'audio';

/** Matches Swift Song.State.Destination */
export type SongDestination =
  | 'song'
  | 'mixer'
  | 'settings'
  | { kind: 'pianoRoll'; config: ClipEditorConfig }
  | { kind: 'audioClipEditor'; config: AudioClipEditorConfig };

/** Note precision grid values */
export type NotePrecision = '1/4' | '1/8' | '1/16' | '1/32' | 'off';

// ─── Core Models ────────────────────────────────────────────────────────────

/** Matches Swift MIDINoteData */
export interface MIDINoteData {
  noteNumber: number; // MIDI note 0-127
  velocity: number; // 0-127
  startBeat: number; // Beat position
  duration: number; // Duration in beats
}

/** Matches Swift Sample */
export interface Sample {
  id: string;
  name: string;
  fileName: string;
  noteNumber: number;
}

/** Matches Swift SoundBank */
export interface SoundBank {
  category: string;
  color: string;
  defaultOctave: number;
  defaultPreset: string;
  filters: string[];
  instrumentSlug: string;
  isDeprecated: boolean;
  name: string;
  release: number;
  samples: Sample[];
  presetURL?: string;
  previewURL?: string;
}

/** Matches Swift SongSection.State */
export interface SongSection {
  id: string;
  name: string;
  index: number;
  lengthInBars: number;
}

/** Matches Swift Clip.State */
export interface ClipState {
  id: number;
  lengthInBars: number;
  activeLengthInBars: number;
  trackID: number;
  sectionID: string;
  color: string;
  midiNoteData: MIDINoteData[];
  soundBank: SoundBank;
  isInCurrentSection: boolean;
  isRecordingEnabled: boolean;
  // Audio clip fields
  audioFileReference?: string;
  audioFileDuration?: number;
}

/** Matches Swift Track.State */
export interface TrackState {
  id: number;
  type: InstrumentType;
  title: string;
  color: string;
  clips: ClipState[];
  soundBank: SoundBank;
  volume: number; // 0-100 (SwiftUI default: 90)
  pan: number; // -1 to 1
  isMuted: boolean;
  isSoloed: boolean;
}

/** Matches Swift Song.State */
export interface SongState {
  id: string;
  sections: SongSection[];
  currentSection: SongSection;
  isPlaying: boolean;
  tempo: number; // BPM (default: 120)
  masterVolume: number;
  lengthInBeats: number;
  isLoopEnabled: boolean;
  isMetronomeEnabled: boolean;
  isRecording: boolean;
  isRecordingArmed: boolean;
  tracks: TrackState[];
  soundBanks: SoundBank[];
  currentView: SongDestination;
  currentBeatPosition: number;
  zoomLevel: number;
  isNewTrackMenuVisible: boolean;
  isSoundBankViewVisible: boolean;
  isSectionNameEditViewVisible: boolean;
  isClipSettingsVisible: boolean;
  editingSection?: SongSection;
}

/** Matches Swift Playground.State */
export interface PlaygroundState {
  id: string;
  name: string;
  coverImage?: string;
  author: string;
  createdAt: string; // ISO date
  updatedAt?: string;
  song: SongState;
  isLoading: boolean;
}

/** Playgrounds dashboard state */
export interface PlaygroundsDashboardState {
  playgrounds: PlaygroundState[];
  currentPlayground?: PlaygroundState;
  isLoading: boolean;
  isImportingBundle: boolean;
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
  onTrackSelect?: (trackId: number) => void;
  onClipSelect?: (clipId: number, trackId: number) => void;
  onAddTrack?: (type: InstrumentType) => void;
  onDeleteTrack?: (trackId: number) => void;
  onSectionSelect?: (sectionId: string) => void;
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
  onNoteAdd?: (note: MIDINoteData) => void;
  onNoteDelete?: (noteIndex: number) => void;
  onNoteMove?: (noteIndex: number, newStartBeat: number, newNoteNumber: number) => void;
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

/** Matches Swift InstrumentType.color computed property */
export const INSTRUMENT_COLORS: Record<InstrumentType, string> = {
  drum: '#1AFFA8', // mcGreen2
  melodic: '#FF6C3A', // mcOrange2
  bass: '#3AA0FF', // mcBlue2 (NOT orange — confirmed from TrackView.swift)
  audio: '#FF3A6B', // mcPink2
};

/** Matches Swift InstrumentType.icon() */
export const INSTRUMENT_ICONS: Record<InstrumentType, string> = {
  drum: 'grid-2x2', // square.grid.2x2
  melodic: 'music-3', // music.quarternote.3
  bass: 'guitar', // guitars
  audio: 'disc-3', // recordingtape
};

// ─── Constants ──────────────────────────────────────────────────────────────

export const CLIP_CONSTANTS = {
  BEATS_PER_BAR: 4,
  STEPS_PER_BEAT: 4,
  STEPS_PER_BAR: 16, // 4 * 4
  MAX_BARS: 16,
} as const;
