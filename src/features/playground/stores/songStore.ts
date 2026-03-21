/**
 * SongStore — Zustand store for Song state
 *
 * Ports TCA Song.State + Song.Action as a reactive store.
 * Presentation-only — no audio engine integration.
 * Audio bridge will be plugged in via middleware/subscription in the real app.
 */
import { create } from 'zustand';
import type {
  SongState,
  SongDestination,
  InstrumentType,
  TrackState,
} from '../types';
import { INSTRUMENT_COLORS } from '../types';
import { createMockSong } from '../mocks';

interface SongActions {
  // Transport
  play: () => void;
  pause: () => void;
  stop: () => void;
  toggleRecord: () => void;
  toggleMetronome: () => void;
  toggleLoop: () => void;
  setTempo: (bpm: number) => void;

  // Navigation
  navigate: (destination: SongDestination) => void;
  selectClip: (clipId: number, trackId: number) => void;

  // Tracks
  addTrack: (type: InstrumentType) => void;
  deleteTrack: (trackId: number) => void;
  selectSection: (sectionId: string) => void;

  // Mixer
  setTrackVolume: (trackId: number, volume: number) => void;
  setTrackPan: (trackId: number, pan: number) => void;
  toggleMute: (trackId: number) => void;
  toggleSolo: (trackId: number) => void;

  // Menus
  showAddTrackMenu: () => void;
  hideAddTrackMenu: () => void;
  showSoundBankPicker: (category: InstrumentType) => void;
  hideSoundBankPicker: () => void;

  // State management
  setSong: (song: SongState) => void;
  reset: () => void;
}

export type SongStore = SongState & SongActions;

const initialSong = createMockSong();

export const useSongStore = create<SongStore>((set, get) => ({
  ...initialSong,

  // Transport
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  stop: () => set({ isPlaying: false, currentBeatPosition: 0 }),
  toggleRecord: () => set(s => ({ isRecording: !s.isRecording })),
  toggleMetronome: () => set(s => ({ isMetronomeEnabled: !s.isMetronomeEnabled })),
  toggleLoop: () => set(s => ({ isLoopEnabled: !s.isLoopEnabled })),
  setTempo: (bpm) => set({ tempo: bpm }),

  // Navigation
  navigate: (destination) => set({ currentView: destination }),
  selectClip: (clipId, trackId) => {
    const track = get().tracks.find(t => t.id === trackId);
    if (!track) return;
    set({
      currentView: {
        kind: 'pianoRoll',
        config: { clipId, trackId, instrumentType: track.type },
      },
    });
  },

  // Tracks
  addTrack: (type) => {
    const tracks = get().tracks;
    const newId = Math.max(0, ...tracks.map(t => t.id)) + 1;
    const newTrack: TrackState = {
      id: newId,
      type,
      title: type === 'drum' ? 'Drums' : type === 'melodic' ? 'Keys' : type === 'bass' ? 'Bass' : 'Audio',
      color: INSTRUMENT_COLORS[type],
      clips: [],
      soundBank: tracks[0]?.soundBank ?? { category: type, color: INSTRUMENT_COLORS[type], defaultOctave: 4, defaultPreset: '', filters: [], instrumentSlug: `new-${type}`, isDeprecated: false, name: `New ${type}`, release: 0.1, samples: [] },
      volume: 90,
      pan: 0,
      isMuted: false,
      isSoloed: false,
    };
    set({ tracks: [...tracks, newTrack], isNewTrackMenuVisible: false });
  },

  deleteTrack: (trackId) => set(s => ({
    tracks: s.tracks.filter(t => t.id !== trackId),
  })),

  selectSection: (sectionId) => {
    const section = get().sections.find(s => s.id === sectionId);
    if (section) set({ currentSection: section });
  },

  // Mixer
  setTrackVolume: (trackId, volume) => set(s => ({
    tracks: s.tracks.map(t => t.id === trackId ? { ...t, volume } : t),
  })),
  setTrackPan: (trackId, pan) => set(s => ({
    tracks: s.tracks.map(t => t.id === trackId ? { ...t, pan } : t),
  })),
  toggleMute: (trackId) => set(s => ({
    tracks: s.tracks.map(t => t.id === trackId ? { ...t, isMuted: !t.isMuted } : t),
  })),
  toggleSolo: (trackId) => set(s => ({
    tracks: s.tracks.map(t => t.id === trackId ? { ...t, isSoloed: !t.isSoloed } : t),
  })),

  // Menus
  showAddTrackMenu: () => set({ isNewTrackMenuVisible: true }),
  hideAddTrackMenu: () => set({ isNewTrackMenuVisible: false }),
  showSoundBankPicker: (category) => set({ isSoundBankViewVisible: true, currentSoundBankCategorySelection: category }),
  hideSoundBankPicker: () => set({ isSoundBankViewVisible: false, currentSoundBankCategorySelection: undefined }),

  // State management
  setSong: (song) => set(song),
  reset: () => set(initialSong),
}));
