/**
 * PlaygroundStore — the contract between circuit-ui and the app.
 *
 * Architecture:
 *   - ONE zustand store (no fragmentation)
 *   - Fine-grained selectors (components only re-render when their slice changes)
 *   - Scoped context for IDs (TrackContext, ClipContext — avoids prop-drilling)
 *   - `shallow` equality for object selectors
 *
 * The app creates a zustand store with `create<SongStore>()` and passes
 * the hook to <SongStoreProvider>. Components consume via useSongContext().
 *
 * Why one store:
 *   zustand selectors already prevent unnecessary re-renders. A component
 *   calling `useSongContext(s => s.isPlaying)` only re-renders when isPlaying
 *   changes — not when tempo, tracks, or anything else changes.
 *   Splitting into multiple stores adds sync complexity for zero perf gain.
 */
import { createContext, useContext, type ReactNode } from 'react';
import { shallow } from 'zustand/shallow';
import type {
  SongState,
  ClipNote,
  InstrumentType,
  NotePrecision,
  Sample,
  Track,
  Clip,
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

  // Soundbank data
  getSamplesForTrack: (trackId: number) => Sample[];
}

// ---------------------------------------------------------------------------
// Store type = state + actions
// ---------------------------------------------------------------------------

export type SongStore = SongState & SongActions;

// ---------------------------------------------------------------------------
// Context + Provider
// ---------------------------------------------------------------------------

/** The zustand hook type the app passes in */
export type UseSongStoreHook = {
  (): SongStore;
  <T>(selector: (state: SongStore) => T): T;
  <T>(selector: (state: SongStore) => T, equalityFn: (a: T, b: T) => boolean): T;
  getState: () => SongStore;
};

const SongStoreContext = createContext<UseSongStoreHook | null>(null);

export function SongStoreProvider({ store, children }: { store: UseSongStoreHook; children: ReactNode }) {
  return <SongStoreContext.Provider value={store}>{children}</SongStoreContext.Provider>;
}

/** Raw hook access — for building custom selectors */
function useStoreHook(): UseSongStoreHook {
  const hook = useContext(SongStoreContext);
  if (!hook) throw new Error('useSongContext requires <SongStoreProvider>');
  return hook;
}

// ---------------------------------------------------------------------------
// Selectors — the primary API for components
// ---------------------------------------------------------------------------

/**
 * Read a slice of the song store. Only re-renders when the selected value changes.
 *
 * @example
 * const isPlaying = useSongContext(s => s.isPlaying);          // primitive — exact equality
 * const track = useSongContext(s => s.tracks[0], shallow);     // object — shallow equality
 */
export function useSongContext<T>(selector: (state: SongStore) => T, equalityFn?: (a: T, b: T) => boolean): T {
  const useStore = useStoreHook();
  return equalityFn ? useStore(selector, equalityFn) : useStore(selector);
}

/** Get store for imperative access in callbacks (no subscription, no re-render) */
export function useSongActions(): SongActions {
  const useStore = useStoreHook();
  // Actions are stable references — reading them doesn't cause re-renders
  return useStore.getState();
}

// ---------------------------------------------------------------------------
// Scoped selector hooks — fine-grained subscriptions for nested data
// ---------------------------------------------------------------------------

/** Select a single track. Re-renders only when THIS track's data changes. */
export function useTrack(trackId: number): Track | undefined {
  return useSongContext(
    (s) => s.tracks.find(t => t.id === trackId),
    shallow
  );
}

/** Select a single clip. Re-renders only when THIS clip changes. */
export function useClip(trackId: number, clipId: number): Clip | undefined {
  return useSongContext(
    (s) => s.tracks.find(t => t.id === trackId)?.clips.find(c => c.id === clipId),
    shallow
  );
}

/** Select the active clip for a track in the current section. */
export function useActiveClip(trackId: number): Clip | undefined {
  return useSongContext(
    (s) => {
      const track = s.tracks.find(t => t.id === trackId);
      return track?.clips.find(c => c.sectionID === s.currentSectionId);
    },
    shallow
  );
}

/** Transport state only. Re-renders only on transport changes. */
export function useTransport() {
  return useSongContext(
    (s) => ({
      isPlaying: s.isPlaying,
      tempo: s.tempo,
      isLoopEnabled: s.isLoopEnabled,
      isMetronomeEnabled: s.isMetronomeEnabled,
      currentBeatPosition: s.currentBeatPosition,
    }),
    shallow
  );
}

/** Mixer state for a single track. */
export function useTrackMixer(trackId: number) {
  return useSongContext(
    (s) => {
      const t = s.tracks.find(tr => tr.id === trackId);
      if (!t) return undefined;
      return { volume: t.volume, pan: t.pan, isMuted: t.isMuted, isSoloed: t.isSoloed };
    },
    shallow
  );
}

// ---------------------------------------------------------------------------
// Scoped ID context — avoids prop-drilling trackId/clipId through deep trees
// ---------------------------------------------------------------------------

const TrackIdContext = createContext<number | null>(null);
const ClipIdContext = createContext<number | null>(null);

export function TrackScope({ trackId, children }: { trackId: number; children: ReactNode }) {
  return <TrackIdContext.Provider value={trackId}>{children}</TrackIdContext.Provider>;
}

export function ClipScope({ clipId, children }: { clipId: number; children: ReactNode }) {
  return <ClipIdContext.Provider value={clipId}>{children}</ClipIdContext.Provider>;
}

export function useTrackId(): number {
  const id = useContext(TrackIdContext);
  if (id === null) throw new Error('useTrackId requires <TrackScope>');
  return id;
}

export function useClipId(): number {
  const id = useContext(ClipIdContext);
  if (id === null) throw new Error('useClipId requires <ClipScope>');
  return id;
}
