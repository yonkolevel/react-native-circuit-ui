/**
 * PlaygroundStore — manages playgrounds list + current playground
 */
import { create } from 'zustand';
import type { PlaygroundState } from '../types';
import { createMockPlaygroundsList } from '../mocks';

interface PlaygroundStoreState {
  playgrounds: PlaygroundState[];
  currentPlaygroundId: string | null;
  isLoading: boolean;

  // Actions
  setPlaygrounds: (playgrounds: PlaygroundState[]) => void;
  selectPlayground: (id: string) => void;
  deselectPlayground: () => void;
  createPlayground: () => void;
  deletePlayground: (id: string) => void;
  renamePlayground: (id: string, name: string) => void;
}

export const usePlaygroundStore = create<PlaygroundStoreState>(set => ({
  playgrounds: createMockPlaygroundsList(4),
  currentPlaygroundId: null,
  isLoading: false,

  setPlaygrounds: (playgrounds) => set({ playgrounds }),
  selectPlayground: (id) => set({ currentPlaygroundId: id }),
  deselectPlayground: () => set({ currentPlaygroundId: null }),

  createPlayground: () => {
    const id = `playground-${Date.now()}`;
    const newPlayground: PlaygroundState = {
      id,
      name: 'New Playground',
      author: 'You',
      createdAt: new Date().toISOString(),
      song: { id: `song-${id}`, sections: [], currentSection: { id: 's1', name: 'Intro', index: 0, lengthInBars: 4 }, isPlaying: false, tempo: 120, masterVolume: 90, lengthInBeats: 16, isLoopEnabled: true, isMetronomeEnabled: false, isRecording: false, isRecordingArmed: false, tracks: [], soundBanks: [], currentView: 'song', currentBeatPosition: 0, zoomLevel: 1, isNewTrackMenuVisible: false, isSoundBankViewVisible: false, isSectionNameEditViewVisible: false, isClipSettingsVisible: false },
      isLoading: false,
    };
    set(s => ({
      playgrounds: [newPlayground, ...s.playgrounds],
      currentPlaygroundId: id,
    }));
  },

  deletePlayground: (id) => set(s => ({
    playgrounds: s.playgrounds.filter(p => p.id !== id),
    currentPlaygroundId: s.currentPlaygroundId === id ? null : s.currentPlaygroundId,
  })),

  renamePlayground: (id, name) => set(s => ({
    playgrounds: s.playgrounds.map(p => p.id === id ? { ...p, name } : p),
  })),
}));
