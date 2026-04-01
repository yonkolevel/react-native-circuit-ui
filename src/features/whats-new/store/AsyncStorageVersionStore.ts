/**
 * AsyncStorage-backed WhatsNewVersionStore.
 * Mirrors UserDefaultsWhatsNewVersionStore in WhatsNewKit.
 *
 * Persists presented versions to AsyncStorage using a key prefix.
 */
import type { WhatsNewVersion, WhatsNewVersionStore } from '../types';
import { formatVersion, parseVersion } from '../models/WhatsNewVersion';

const KEY_PREFIX = '@whats_new_presented_';

/**
 * Creates an AsyncStorage-backed version store.
 *
 * @param storage - An object with getItem/setItem/removeItem/getAllKeys
 *   (AsyncStorage from @react-native-async-storage/async-storage,
 *    or any compatible interface).
 */
export function createAsyncStorageVersionStore(
  storage: AsyncStorageLike
): WhatsNewVersionStore {
  const versionKey = (version: WhatsNewVersion): string =>
    `${KEY_PREFIX}${formatVersion(version)}`;

  return {
    async save(version: WhatsNewVersion): Promise<void> {
      await storage.setItem(versionKey(version), formatVersion(version));
    },

    async getPresentedVersions(): Promise<WhatsNewVersion[]> {
      const allKeys = await storage.getAllKeys();
      const whatsNewKeys = allKeys.filter((k: string) =>
        k.startsWith(KEY_PREFIX)
      );
      const values = await Promise.all(
        whatsNewKeys.map((k: string) => storage.getItem(k))
      );
      return values.filter((v): v is string => v != null).map(parseVersion);
    },

    async hasPresented(version: WhatsNewVersion): Promise<boolean> {
      const value = await storage.getItem(versionKey(version));
      return value != null;
    },

    async remove(version: WhatsNewVersion): Promise<void> {
      await storage.removeItem(versionKey(version));
    },

    async removeAll(): Promise<void> {
      const allKeys = await storage.getAllKeys();
      const whatsNewKeys = allKeys.filter((k: string) =>
        k.startsWith(KEY_PREFIX)
      );
      await Promise.all(whatsNewKeys.map((k: string) => storage.removeItem(k)));
    },
  };
}

/**
 * Minimal interface compatible with @react-native-async-storage/async-storage.
 * Allows consumers to pass their own storage implementation.
 */
export interface AsyncStorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
}

// ─── In-Memory Store (for testing) ──────────────────────────────────────────

/**
 * In-memory version store — mirrors InMemoryWhatsNewVersionStore in WhatsNewKit.
 * Useful for tests and previews.
 */
export function createInMemoryVersionStore(): WhatsNewVersionStore & {
  _store: Map<string, WhatsNewVersion>;
} {
  const store = new Map<string, WhatsNewVersion>();

  return {
    _store: store,

    async save(version: WhatsNewVersion): Promise<void> {
      store.set(formatVersion(version), version);
    },

    async getPresentedVersions(): Promise<WhatsNewVersion[]> {
      return Array.from(store.values());
    },

    async hasPresented(version: WhatsNewVersion): Promise<boolean> {
      return store.has(formatVersion(version));
    },

    async remove(version: WhatsNewVersion): Promise<void> {
      store.delete(formatVersion(version));
    },

    async removeAll(): Promise<void> {
      store.clear();
    },
  };
}
