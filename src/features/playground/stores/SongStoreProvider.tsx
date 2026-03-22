/**
 * SongStoreProvider — bridges the app's zustand store to circuit-ui components.
 *
 * Usage:
 *   import { SongStoreProvider } from 'react-native-circuit-ui';
 *   import { useSongStore } from './stores/songStore';
 *
 *   <SongStoreProvider store={useSongStore}>
 *     <SongView />
 *   </SongStoreProvider>
 */
import type { ReactNode } from 'react';
import { SongStoreContext, type SongStore } from './playgroundStore';

type UseSongStore = <T>(selector: (state: SongStore) => T) => T;

interface SongStoreProviderProps {
  /** The app's zustand hook that satisfies the SongStore interface */
  store: UseSongStore;
  children: ReactNode;
}

export function SongStoreProvider({ store, children }: SongStoreProviderProps) {
  return (
    <SongStoreContext.Provider value={store}>
      {children}
    </SongStoreContext.Provider>
  );
}
