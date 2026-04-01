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
import { useShallow } from 'zustand/react/shallow';
import type {
  SongState,
  SongTab,
  ClipNote,
  InstrumentType,
  Track,
  Clip,
} from '../types';

// ---------------------------------------------------------------------------
// Actions — everything the UI can dispatch
// ---------------------------------------------------------------------------

/**
 * Action names match useSongStore in midicircuit-rn exactly.
 * No adapters, no renaming — circuit-ui components call the same actions as the app.
 */
export interface SongActions {
  // Transport
  setPlaying: (playing: boolean) => void;
  setRecording: (recording: boolean) => void;
  setTempo: (bpm: number) => void;
  toggleMetronome: () => void;
  toggleLoop: () => void;

  // Sections
  setCurrentSection: (sectionId: number) => void;
  addSection: () => void;
  renameSection: (sectionId: number, name: string) => void;

  // Mixer
  setTrackVolume: (trackId: number, volume: number) => void;
  setTrackPan: (trackId: number, pan: number) => void;
  toggleTrackMute: (trackId: number) => void;
  toggleTrackSolo: (trackId: number) => void;

  // Notes
  addNote: (trackId: number, clipId: number, note: ClipNote) => void;
  removeNote: (trackId: number, clipId: number, noteIndex: number) => void;
  updateNote: (
    trackId: number,
    clipId: number,
    noteIndex: number,
    updates: Partial<ClipNote>
  ) => void;
  setClipNotes: (trackId: number, clipId: number, notes: ClipNote[]) => void;

  // Clip
  createClip: (trackId: number, sectionId: number) => void;
  setClipLength: (trackId: number, clipId: number, bars: number) => void;

  // Track management
  addNewTrack: (
    type: InstrumentType,
    soundBank: { slug: string; name: string }
  ) => void;
  removeTrack: (trackId: number) => void;

  // Master
  setMasterVolume: (volume: number) => void;

  // Navigation
  showSongView: () => void;
  showAddTrackMenu: () => void;
  showSoundBankPicker: (instrumentType: InstrumentType) => void;
  openClipEditor: (trackId: number, clipId: number) => void;
  setCurrentTab: (tab: SongTab) => void;

  // Soundbank picker
  fetchSoundBanks: () => Promise<void>;
  selectSoundBank: (slug: string) => void;
  previewSoundBank: (slug: string) => void;
  stopPreview: () => void;
  confirmSoundBank: () => void;

  // Undo/Redo
  undoClipEdit: (trackId: number, clipId: number) => void;
  redoClipEdit: (trackId: number, clipId: number) => void;

  // Live recording
  liveNoteOn: (
    trackId: number,
    clipId: number,
    noteIndex: number,
    velocity: number,
    currentBeat: number
  ) => void;
  liveNoteOff: (
    trackId: number,
    clipId: number,
    noteIndex: number,
    currentBeat: number
  ) => void;

  // Clip settings
  showClipSettings: () => void;
  hideClipSettings: () => void;
  togglePianoNoteNames: () => void;
}

// ---------------------------------------------------------------------------
// Store type = state + actions
// ---------------------------------------------------------------------------

export type SongStore = SongState & SongActions;

// ---------------------------------------------------------------------------
// Context + Provider
// ---------------------------------------------------------------------------

/** The zustand hook type the app passes in (zustand v5 signature) */
export type UseSongStoreHook = {
  (): SongStore;
  <T>(selector: (state: SongStore) => T): T;
  getState: () => SongStore;
  subscribe: (
    listener: (state: SongStore, prevState: SongStore) => void
  ) => () => void;
};

const SongStoreContext = createContext<UseSongStoreHook | null>(null);

export function SongStoreProvider({
  store,
  children,
}: {
  store: UseSongStoreHook;
  children: ReactNode;
}) {
  return (
    <SongStoreContext.Provider value={store}>
      {children}
    </SongStoreContext.Provider>
  );
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
 * For primitive selectors (boolean, number, string), use directly:
 *   const isPlaying = useSongContext(s => s.isPlaying);
 *
 * For object/array selectors, wrap with useShallow at the call site:
 *   const tracks = useSongContext(useShallow(s => s.tracks));
 *
 * Do NOT pass an equalityFn — zustand v5 hooks ignore it.
 */
export function useSongContext<T>(selector: (state: SongStore) => T): T {
  const useStore = useStoreHook();
  return useStore(selector);
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
    useShallow((s) => s.tracks.find((t) => t.id === trackId))
  );
}

/** Select a single clip. Re-renders only when THIS clip changes. */
export function useClip(trackId: number, clipId: number): Clip | undefined {
  return useSongContext(
    useShallow((s) =>
      s.tracks.find((t) => t.id === trackId)?.clips.find((c) => c.id === clipId)
    )
  );
}

/** Select the active clip for a track in the current section. */
export function useActiveClip(trackId: number): Clip | undefined {
  return useSongContext(
    useShallow((s) => {
      const track = s.tracks.find((t) => t.id === trackId);
      return track?.clips.find((c) => c.sectionID === s.currentSectionId);
    })
  );
}

/** Transport state only. Re-renders only on transport changes. */
export function useTransport() {
  return useSongContext(
    useShallow((s) => ({
      isPlaying: s.isPlaying,
      tempo: s.tempo,
      isLoopEnabled: s.isLoopEnabled,
      isMetronomeEnabled: s.isMetronomeEnabled,
      currentBeatPosition: s.currentBeatPosition,
    }))
  );
}

/** Mixer state for a single track. */
export function useTrackMixer(trackId: number) {
  return useSongContext(
    useShallow((s) => {
      const t = s.tracks.find((tr) => tr.id === trackId);
      if (!t) return undefined;
      return {
        volume: t.volume,
        pan: t.pan,
        isMuted: t.isMuted,
        isSoloed: t.isSoloed,
      };
    })
  );
}

// ---------------------------------------------------------------------------
// Scoped ID context — avoids prop-drilling trackId/clipId through deep trees
// ---------------------------------------------------------------------------

const TrackIdContext = createContext<number | null>(null);
const ClipIdContext = createContext<number | null>(null);

export function TrackScope({
  trackId,
  children,
}: {
  trackId: number;
  children: ReactNode;
}) {
  return (
    <TrackIdContext.Provider value={trackId}>
      {children}
    </TrackIdContext.Provider>
  );
}

export function ClipScope({
  clipId,
  children,
}: {
  clipId: number;
  children: ReactNode;
}) {
  return (
    <ClipIdContext.Provider value={clipId}>{children}</ClipIdContext.Provider>
  );
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
