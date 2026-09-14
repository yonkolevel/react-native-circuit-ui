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
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type {
  SongState,
  SongTab,
  ClipNote,
  InstrumentType,
  Track,
  Clip,
} from '../types';
import {
  isEditorCapabilityAllowed,
  useResolvedEditorPolicy,
  type EditorCapability,
  type EditorPolicy,
} from './editorPolicy';

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
  duplicateSection: (sectionId: number) => void;
  removeSection: (sectionId: number) => void;

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
  duplicateClip: (trackId: number, clipId: number) => void;
  removeClip: (trackId: number, clipId: number) => void;
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
  toggleAuditionOnPlace: () => void;
}

// ---------------------------------------------------------------------------
// Store type = state + actions
// ---------------------------------------------------------------------------

export type SongStore = SongState & SongActions;

// ---------------------------------------------------------------------------
// Context + Provider
// ---------------------------------------------------------------------------

/** Read-only zustand access supplied by the app. Selectors cannot reach actions. */
export type UseSongStateHook = {
  (): SongState;
  <T>(selector: (state: SongState) => T): T;
  getState: () => SongState;
  getInitialState: () => SongState;
  subscribe: (
    listener: (state: SongState, prevState: SongState) => void
  ) => () => void;
};

/** Backward-compatible combined store type. Prefer stateAccess + actions. */
export type UseSongStoreHook = {
  (): SongStore;
  <T>(selector: (state: SongStore) => T): T;
  getState: () => SongStore;
  getInitialState: () => SongStore;
  subscribe: (
    listener: (state: SongStore, prevState: SongStore) => void
  ) => () => void;
};

export type SongActionName = keyof SongActions;
export interface SongMutationEvent {
  type: SongActionName;
  arguments: readonly unknown[];
}

const ACTION_CAPABILITIES: Record<SongActionName, EditorCapability | null> = {
  setPlaying: 'transport',
  setRecording: 'recording',
  setTempo: 'tempo',
  toggleMetronome: 'metronome',
  toggleLoop: 'loop',
  setCurrentSection: 'arrangement',
  addSection: 'sections',
  renameSection: 'sections',
  duplicateSection: 'sections',
  removeSection: 'sections',
  setTrackVolume: 'mixer',
  setTrackPan: 'mixer',
  toggleTrackMute: 'mixer',
  toggleTrackSolo: 'mixer',
  addNote: 'notes',
  removeNote: 'notes',
  updateNote: 'notes',
  setClipNotes: 'quantize',
  createClip: 'clips',
  duplicateClip: 'clips',
  removeClip: 'clips',
  setClipLength: 'clips',
  addNewTrack: 'tracks',
  removeTrack: 'tracks',
  setMasterVolume: 'mixer',
  showSongView: null,
  showAddTrackMenu: 'tracks',
  showSoundBankPicker: 'sound',
  openClipEditor: null,
  setCurrentTab: null,
  fetchSoundBanks: 'sound',
  selectSoundBank: 'sound',
  previewSoundBank: 'sound',
  stopPreview: 'sound',
  confirmSoundBank: 'sound',
  undoClipEdit: 'undoRedo',
  redoClipEdit: 'undoRedo',
  liveNoteOn: 'liveRecording',
  liveNoteOff: 'liveRecording',
  showClipSettings: null,
  hideClipSettings: null,
  togglePianoNoteNames: null,
  toggleAuditionOnPlace: null,
};

const ASYNC_ACTIONS = new Set<SongActionName>(['fetchSoundBanks']);

const NON_MUTATION_ACTIONS = new Set<SongActionName>([
  'showSongView',
  'showAddTrackMenu',
  'showSoundBankPicker',
  'openClipEditor',
  'setCurrentTab',
  'fetchSoundBanks',
  'previewSoundBank',
  'stopPreview',
  'showClipSettings',
  'hideClipSettings',
  'togglePianoNoteNames',
  'toggleAuditionOnPlace',
]);

const SongStateContext = createContext<UseSongStateHook | null>(null);
const SongActionsContext = createContext<SongActions | null>(null);
const SongMutationContext = createContext<
  ((event: SongMutationEvent) => void) | undefined
>(undefined);

function pickSongActions(store: UseSongStoreHook): SongActions {
  const raw = store.getState();
  return Object.fromEntries(
    (Object.keys(ACTION_CAPABILITIES) as SongActionName[]).map((name) => [
      name,
      raw[name],
    ])
  ) as unknown as SongActions;
}

type SongStoreProviderProps = {
  children: ReactNode;
  /** Called after an allowed synchronous musical action returns. */
  onMutation?: (event: SongMutationEvent) => void;
} & (
  | {
      /** State-only access, paired with an app-guarded action surface. */
      stateAccess: UseSongStateHook;
      actions: SongActions;
      store?: never;
    }
  | {
      /** @deprecated Standalone compatibility. Prefer stateAccess + actions. */
      store: UseSongStoreHook;
      stateAccess?: never;
      actions?: never;
    }
);

export function SongStoreProvider({
  stateAccess,
  actions,
  onMutation,
  store,
  children,
}: SongStoreProviderProps) {
  const resolvedState = stateAccess ?? (store as unknown as UseSongStateHook);
  const resolvedActions = useMemo(
    () => actions ?? (store ? pickSongActions(store) : undefined),
    [actions, store]
  );
  if (!resolvedState || !resolvedActions) {
    throw new Error(
      'SongStoreProvider requires stateAccess and actions (or legacy store)'
    );
  }
  return (
    <SongStateContext.Provider value={resolvedState}>
      <SongActionsContext.Provider value={resolvedActions}>
        <SongMutationContext.Provider value={onMutation}>
          {children}
        </SongMutationContext.Provider>
      </SongActionsContext.Provider>
    </SongStateContext.Provider>
  );
}

const stateOnlyCache = new WeakMap<object, SongState>();
const isFunctionProperty = (
  target: SongState,
  property: PropertyKey
): boolean => typeof Reflect.get(target, property) === 'function';

function toStateOnly(state: SongState): SongState {
  const object = state as unknown as object;
  const cached = stateOnlyCache.get(object);
  if (cached) return cached;
  const safe = new Proxy(state, {
    get(target, property, receiver) {
      if (isFunctionProperty(target, property)) return undefined;
      return Reflect.get(target, property, receiver);
    },
    has(target, property) {
      if (isFunctionProperty(target, property)) return false;
      return Reflect.has(target, property);
    },
    ownKeys(target) {
      return Reflect.ownKeys(target).filter(
        (key) => !isFunctionProperty(target, key)
      );
    },
    getOwnPropertyDescriptor(target, property) {
      if (isFunctionProperty(target, property)) return undefined;
      return Reflect.getOwnPropertyDescriptor(target, property);
    },
  });
  stateOnlyCache.set(object, safe);
  return safe;
}

function useStateHook(): UseSongStateHook {
  const hook = useContext(SongStateContext);
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
export function useSongContext<T>(selector: (state: SongState) => T): T {
  const store = useStateHook();
  return useStore(store, (state) => selector(toStateOnly(state)));
}

/** The policy-filtered app action surface. Raw state-store actions never escape. */
const COMMIT_REVISION_KEYS = [
  'saveRevision',
  'transportRevision',
  'contentRevision',
  'revision',
] as const;

function captureCommit(state: SongState) {
  const record = state as unknown as Record<string, unknown>;
  return {
    state,
    revisions: COMMIT_REVISION_KEYS.map((key) => record[key]),
  };
}

function didCommit(
  before: ReturnType<typeof captureCommit>,
  after: ReturnType<typeof captureCommit>
): boolean {
  return (
    before.state !== after.state ||
    before.revisions.some(
      (revision, index) => revision !== after.revisions[index]
    )
  );
}

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  !!value && typeof (value as PromiseLike<unknown>).then === 'function';

export function useSongActions(policyOverride?: EditorPolicy): SongActions {
  const actions = useContext(SongActionsContext);
  const stateAccess = useContext(SongStateContext);
  const onMutation = useContext(SongMutationContext);
  const policy = useResolvedEditorPolicy(policyOverride);

  const wrappedActions = useMemo(() => {
    if (!actions || !stateAccess) return null;
    const wrapped = {} as Record<SongActionName, (...args: any[]) => any>;
    for (const name of Object.keys(ACTION_CAPABILITIES) as SongActionName[]) {
      wrapped[name] = (...args: unknown[]) => {
        const capability = ACTION_CAPABILITIES[name];
        if (capability && !isEditorCapabilityAllowed(policy, capability))
          return ASYNC_ACTIONS.has(name) ? Promise.resolve() : undefined;
        if (NON_MUTATION_ACTIONS.has(name)) {
          return (actions[name] as (...values: unknown[]) => unknown)(...args);
        }

        const before = captureCommit(stateAccess.getState());
        const result = (actions[name] as (...values: unknown[]) => unknown)(
          ...args
        );
        const emitIfCommitted = () => {
          const after = captureCommit(stateAccess.getState());
          if (didCommit(before, after)) {
            onMutation?.({ type: name, arguments: args });
          }
        };
        if (isPromiseLike(result)) {
          return Promise.resolve(result).then((value) => {
            emitIfCommitted();
            return value;
          });
        }
        emitIfCommitted();
        return result;
      };
    }
    return wrapped as unknown as SongActions;
  }, [actions, stateAccess, onMutation, policy]);

  if (!wrappedActions)
    throw new Error('useSongActions requires <SongStoreProvider>');
  return wrappedActions;
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
