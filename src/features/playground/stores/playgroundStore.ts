/**
 * PlaygroundStore — the contract between circuit-ui components and the app.
 *
 * circuit-ui defines WHAT state and actions it needs.
 * The app provides a zustand store that implements this interface.
 * Components consume via `useSongContext()` — no callback props needed.
 *
 * Pattern:
 *   App:        <SongStoreProvider store={useSongStore}> <SongView /> </SongStoreProvider>
 *   Component:  const isPlaying = useSongContext(s => s.isPlaying)
 *               const play = useSongContext(s => s.play)
 */
import { createContext, useContext } from 'react';
import type { StoreApi } from 'zustand';
import type {
  SongState,
  ClipNote,
  InstrumentType,
  NotePrecision,
  Sample,
} from '../types';

// ---------------------------------------------------------------------------
// Actions — everything the UI can dispatch
// ---------------------------------------------------------------------------

export interface SongActions {
  // Transport
  play: () => void;
  pause: () => void;
  toggleMetronome: () => void;
  toggleLoop: () => void;
  setTempo: (bpm: number) => void;

  // Sections
  selectSection: (sectionId: number) => void;
  addSection: () => void;
  renameSection: (sectionId: number, name: string) => void;

  // Mixer
  setTrackVolume: (trackId: number, volume: number) => void;
  setTrackPan: (trackId: number, pan: number) => void;
  toggleTrackMute: (trackId: number) => void;
  toggleTrackSolo: (trackId: number) => void;

  // Notes (clip editing)
  addNote: (trackId: number, clipId: number, note: ClipNote) => void;
  removeNote: (trackId: number, clipId: number, noteIndex: number) => void;
  moveNote: (trackId: number, clipId: number, noteIndex: number, position: number, noteNumber: number) => void;
  resizeNote: (trackId: number, clipId: number, noteIndex: number, duration: number) => void;
  setVelocity: (trackId: number, clipId: number, noteIndex: number, velocity: number) => void;

  // Clip
  setClipLength: (trackId: number, clipId: number, bars: number) => void;

  // Track management
  addTrack: (type: InstrumentType) => void;
  removeTrack: (trackId: number) => void;

  // Audition (live sound trigger)
  triggerPad: (trackId: number, sampleIndex: number) => void;
  pressKey: (trackId: number, noteNumber: number) => void;
  releaseKey: (trackId: number, noteNumber: number) => void;

  // Navigation
  navigateBack: () => void;
  openClipEditor: (clipId: number, trackId: number) => void;
  closeClipEditor: () => void;

  // Soundbank data (read-only helpers the UI needs)
  getSamplesForTrack: (trackId: number) => Sample[];
}

// ---------------------------------------------------------------------------
// Store type — state + actions
// ---------------------------------------------------------------------------

export type SongStore = SongState & SongActions;

// ---------------------------------------------------------------------------
// Context — app provides, components consume
// ---------------------------------------------------------------------------

type UseSongStore = <T>(selector: (state: SongStore) => T) => T;

// The context holds a zustand-compatible selector hook
const SongStoreContext = createContext<UseSongStore | null>(null);

/**
 * Read from the song store. Use a selector for optimal re-renders.
 *
 * @example
 * const isPlaying = useSongContext(s => s.isPlaying);
 * const play = useSongContext(s => s.play);
 */
export function useSongContext<T>(selector: (state: SongStore) => T): T {
  const useStore = useContext(SongStoreContext);
  if (!useStore) {
    throw new Error(
      'useSongContext must be used within <SongStoreProvider>. ' +
      'Wrap your playground UI in the provider and pass the app\'s zustand store.'
    );
  }
  return useStore(selector);
}

/**
 * Get the store API for imperative access (e.g., in callbacks).
 * Returns the raw useStore hook — call it without a selector to get full state.
 */
export function useSongStoreApi(): UseSongStore {
  const useStore = useContext(SongStoreContext);
  if (!useStore) {
    throw new Error('useSongStoreApi must be used within <SongStoreProvider>.');
  }
  return useStore;
}

export { SongStoreContext };
