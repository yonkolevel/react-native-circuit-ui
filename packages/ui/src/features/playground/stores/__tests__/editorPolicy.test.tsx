import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { create } from 'zustand';
import {
  SongStoreProvider,
  useSongActions,
  useSongContext,
} from '../playgroundStore';
import type { SongActions, SongStore } from '../playgroundStore';
import { EditorPolicyProvider } from '../editorPolicy';
import { createMockSong } from '../../mocks';

const noop = jest.fn();

function actions(): SongActions {
  return {
    setPlaying: jest.fn(),
    setRecording: jest.fn(),
    setTempo: jest.fn(),
    toggleMetronome: jest.fn(),
    toggleLoop: jest.fn(),
    setCurrentSection: jest.fn(),
    addSection: jest.fn(),
    renameSection: jest.fn(),
    duplicateSection: jest.fn(),
    removeSection: jest.fn(),
    setTrackVolume: jest.fn(),
    setTrackPan: jest.fn(),
    toggleTrackMute: jest.fn(),
    toggleTrackSolo: jest.fn(),
    addNote: jest.fn(),
    removeNote: jest.fn(),
    updateNote: jest.fn(),
    setClipNotes: jest.fn(),
    createClip: jest.fn(),
    duplicateClip: jest.fn(),
    removeClip: jest.fn(),
    setClipLength: jest.fn(),
    addNewTrack: jest.fn(),
    removeTrack: jest.fn(),
    setMasterVolume: jest.fn(),
    showSongView: jest.fn(),
    showAddTrackMenu: jest.fn(),
    showSoundBankPicker: jest.fn(),
    openClipEditor: jest.fn(),
    setCurrentTab: jest.fn(),
    fetchSoundBanks: jest.fn(async () => {}),
    selectSoundBank: jest.fn(),
    previewSoundBank: jest.fn(),
    stopPreview: jest.fn(),
    confirmSoundBank: jest.fn(),
    undoClipEdit: jest.fn(),
    redoClipEdit: jest.fn(),
    liveNoteOn: jest.fn(),
    liveNoteOff: jest.fn(),
    showClipSettings: jest.fn(),
    hideClipSettings: jest.fn(),
    togglePianoNoteNames: jest.fn(),
  };
}

describe('guarded Song action surface', () => {
  it('uses only app-supplied actions and blocks every mutation in read-only mode while playback control remains', () => {
    const stateAccess = create<SongStore>()(
      () =>
        ({
          ...createMockSong(),
          extraRawAction: noop,
        }) as unknown as SongStore
    );
    const guarded = actions();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SongStoreProvider stateAccess={stateAccess} actions={guarded}>
        <EditorPolicyProvider policy={{ readOnly: true }}>
          {children}
        </EditorPolicyProvider>
      </SongStoreProvider>
    );
    const { result } = renderHook(
      () => ({
        actions: useSongActions(),
        knownRawAction: useSongContext(
          (state) => (state as unknown as { addNote?: unknown }).addNote
        ),
        unknownRawAction: useSongContext(
          (state) =>
            (state as unknown as { extraRawAction?: unknown }).extraRawAction
        ),
      }),
      { wrapper }
    );

    expect(result.current.knownRawAction).toBeUndefined();
    expect(result.current.unknownRawAction).toBeUndefined();
    expect(
      (result.current.actions as unknown as { extraRawAction?: unknown })
        .extraRawAction
    ).toBeUndefined();
    result.current.actions.setPlaying(true);
    // Playback control is not a musical mutation: transport and the metronome
    // that guides it stay available while read-only locks everything else.
    result.current.actions.toggleMetronome();
    const blocked = [
      'setRecording',
      'setTempo',
      'toggleLoop',
      'setCurrentSection',
      'addSection',
      'renameSection',
      'duplicateSection',
      'removeSection',
      'setTrackVolume',
      'setTrackPan',
      'toggleTrackMute',
      'toggleTrackSolo',
      'addNote',
      'removeNote',
      'updateNote',
      'setClipNotes',
      'createClip',
      'duplicateClip',
      'removeClip',
      'setClipLength',
      'addNewTrack',
      'removeTrack',
      'setMasterVolume',
      'showAddTrackMenu',
      'showSoundBankPicker',
      'fetchSoundBanks',
      'selectSoundBank',
      'previewSoundBank',
      'stopPreview',
      'confirmSoundBank',
      'undoClipEdit',
      'redoClipEdit',
      'liveNoteOn',
      'liveNoteOff',
    ] as const;
    blocked.forEach((name) =>
      (result.current.actions[name] as (...args: any[]) => any)()
    );

    expect(guarded.setPlaying).toHaveBeenCalledWith(true);
    expect(guarded.toggleMetronome).toHaveBeenCalled();
    blocked.forEach((name) => expect(guarded[name]).not.toHaveBeenCalled());
  });

  it('emits only after a synchronous state commit and ignores no-ops', () => {
    const stateAccess = create<SongStore>()(
      () => createMockSong() as unknown as SongStore
    );
    const guarded = actions();
    guarded.addSection = jest.fn(() =>
      stateAccess.setState((state) => ({
        sections: [...state.sections, { id: 99, name: 'Committed' }],
      }))
    );
    const onMutation = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SongStoreProvider
        stateAccess={stateAccess}
        actions={guarded}
        onMutation={onMutation}
      >
        {children}
      </SongStoreProvider>
    );
    const { result } = renderHook(() => useSongActions(), { wrapper });

    result.current.renameSection(1, 'same');
    expect(onMutation).not.toHaveBeenCalled();

    result.current.addSection();
    expect(guarded.addSection).toHaveBeenCalledTimes(1);
    expect(onMutation).toHaveBeenCalledWith({
      type: 'addSection',
      arguments: [],
    });
  });

  it('awaits async actions and emits only after their state commit', async () => {
    const stateAccess = create<SongStore>()(
      () => createMockSong() as unknown as SongStore
    );
    const guarded = actions();
    guarded.removeSection = jest.fn(async () => {
      await Promise.resolve();
      stateAccess.setState({ currentSectionId: 2 });
    });
    const onMutation = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SongStoreProvider
        stateAccess={stateAccess}
        actions={guarded}
        onMutation={onMutation}
      >
        {children}
      </SongStoreProvider>
    );
    const { result } = renderHook(() => useSongActions(), { wrapper });

    let pending: unknown;
    act(() => {
      pending = result.current.removeSection(1);
    });
    expect(onMutation).not.toHaveBeenCalled();
    await act(async () => {
      await pending;
    });
    expect(onMutation).toHaveBeenCalledWith({
      type: 'removeSection',
      arguments: [1],
    });
  });
});
