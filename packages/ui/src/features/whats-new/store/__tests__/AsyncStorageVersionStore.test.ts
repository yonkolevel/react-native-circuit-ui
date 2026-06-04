/**
 * Tests for AsyncStorageVersionStore and InMemoryVersionStore.
 * Mirrors UserDefaultsWhatsNewVersionStore behavior.
 */
import {
  createAsyncStorageVersionStore,
  createInMemoryVersionStore,
  type AsyncStorageLike,
} from '../AsyncStorageVersionStore';
import type { WhatsNewVersion } from '../../types';

// ─── Mock AsyncStorage ──────────────────────────────────────────────────────

function createMockAsyncStorage(): AsyncStorageLike {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn(async (key: string) => store.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    getAllKeys: jest.fn(async () => Array.from(store.keys())),
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('createAsyncStorageVersionStore', () => {
  const v1: WhatsNewVersion = { major: 1, minor: 0, patch: 0 };
  const v2: WhatsNewVersion = { major: 2, minor: 1, patch: 0 };

  it('saves a version', async () => {
    const storage = createMockAsyncStorage();
    const store = createAsyncStorageVersionStore(storage);

    await store.save(v1);
    expect(storage.setItem).toHaveBeenCalledWith(
      '@whats_new_presented_1.0.0',
      '1.0.0'
    );
  });

  it('hasPresented returns false for unseen version', async () => {
    const storage = createMockAsyncStorage();
    const store = createAsyncStorageVersionStore(storage);

    expect(await store.hasPresented(v1)).toBe(false);
  });

  it('hasPresented returns true after save', async () => {
    const storage = createMockAsyncStorage();
    const store = createAsyncStorageVersionStore(storage);

    await store.save(v1);
    expect(await store.hasPresented(v1)).toBe(true);
  });

  it('getPresentedVersions returns all saved versions', async () => {
    const storage = createMockAsyncStorage();
    const store = createAsyncStorageVersionStore(storage);

    await store.save(v1);
    await store.save(v2);

    const presented = await store.getPresentedVersions();
    expect(presented).toHaveLength(2);
    expect(presented).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ major: 1, minor: 0, patch: 0 }),
        expect.objectContaining({ major: 2, minor: 1, patch: 0 }),
      ])
    );
  });

  it('remove deletes a specific version', async () => {
    const storage = createMockAsyncStorage();
    const store = createAsyncStorageVersionStore(storage);

    await store.save(v1);
    await store.save(v2);
    await store.remove!(v1);

    expect(await store.hasPresented(v1)).toBe(false);
    expect(await store.hasPresented(v2)).toBe(true);
  });

  it('removeAll clears all versions', async () => {
    const storage = createMockAsyncStorage();
    const store = createAsyncStorageVersionStore(storage);

    await store.save(v1);
    await store.save(v2);
    await store.removeAll!();

    const presented = await store.getPresentedVersions();
    expect(presented).toHaveLength(0);
  });

  it('ignores non-whats-new keys in storage', async () => {
    const storage = createMockAsyncStorage();
    const store = createAsyncStorageVersionStore(storage);

    // Simulate other data in storage
    await storage.setItem('other_key', 'value');
    await store.save(v1);

    const presented = await store.getPresentedVersions();
    expect(presented).toHaveLength(1);
  });
});

describe('createInMemoryVersionStore', () => {
  const v1: WhatsNewVersion = { major: 1, minor: 0, patch: 0 };
  const v2: WhatsNewVersion = { major: 2, minor: 0, patch: 0 };

  it('starts empty', async () => {
    const store = createInMemoryVersionStore();
    expect(await store.getPresentedVersions()).toHaveLength(0);
  });

  it('saves and retrieves versions', async () => {
    const store = createInMemoryVersionStore();
    await store.save(v1);
    expect(await store.hasPresented(v1)).toBe(true);
    expect(await store.hasPresented(v2)).toBe(false);
  });

  it('removeAll clears the store', async () => {
    const store = createInMemoryVersionStore();
    await store.save(v1);
    await store.save(v2);
    await store.removeAll!();
    expect(await store.getPresentedVersions()).toHaveLength(0);
  });

  it('exposes internal _store for test inspection', async () => {
    const store = createInMemoryVersionStore();
    await store.save(v1);
    expect(store._store.size).toBe(1);
  });
});
