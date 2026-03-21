/**
 * PlaygroundStore — prototype for UI development
 * The real store lives in midicircuit-rn.
 */
import { create } from 'zustand';
import type { PlaygroundState } from '../types';
import { createMockPlaygroundsList } from '../mocks';

interface PlaygroundStoreState {
  playgrounds: PlaygroundState[];
  currentPlaygroundId: string | null;
  isLoading: boolean;
  setPlaygrounds: (playgrounds: PlaygroundState[]) => void;
  selectPlayground: (id: string) => void;
  deselectPlayground: () => void;
  createPlayground: () => void;
  deletePlayground: (id: string) => void;
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
    set(s => ({
      playgrounds: [{ id, name: 'New Playground', author: 'You', createdAt: new Date().toISOString(), isLoading: false }, ...s.playgrounds],
      currentPlaygroundId: id,
    }));
  },
  deletePlayground: (id) => set(s => ({
    playgrounds: s.playgrounds.filter(p => p.id !== id),
  })),
}));
