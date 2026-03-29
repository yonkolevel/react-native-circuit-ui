/**
 * Tests for WhatsNewCollection utilities.
 */
import {
  sortByVersionDescending,
  findUnpresented,
  filterUnpresented,
} from '../WhatsNewCollection';
import { createInMemoryVersionStore } from '../../store/AsyncStorageVersionStore';
import type { WhatsNew } from '../../types';

const makeWhatsNew = (major: number, minor = 0, patch = 0): WhatsNew => ({
  version: { major, minor, patch },
  features: [
    {
      image: { type: 'systemName', name: 'star.fill' },
      title: `Feature for v${major}.${minor}.${patch}`,
      subtitle: 'Description',
    },
  ],
});

describe('WhatsNewCollection', () => {
  describe('sortByVersionDescending', () => {
    it('sorts newest first', () => {
      const collection = [makeWhatsNew(1), makeWhatsNew(3), makeWhatsNew(2)];
      const sorted = sortByVersionDescending(collection);
      expect(sorted[0]!.version.major).toBe(3);
      expect(sorted[1]!.version.major).toBe(2);
      expect(sorted[2]!.version.major).toBe(1);
    });

    it('does not mutate the original array', () => {
      const collection = [makeWhatsNew(1), makeWhatsNew(2)];
      sortByVersionDescending(collection);
      expect(collection[0]!.version.major).toBe(1);
    });
  });

  describe('findUnpresented', () => {
    it('returns the latest unseen version', async () => {
      const store = createInMemoryVersionStore();
      await store.save({ major: 1, minor: 0, patch: 0 });

      const collection = [makeWhatsNew(1), makeWhatsNew(2), makeWhatsNew(3)];
      const result = await findUnpresented(collection, store);

      expect(result).not.toBeNull();
      expect(result!.version.major).toBe(3);
    });

    it('returns null when all versions are seen', async () => {
      const store = createInMemoryVersionStore();
      await store.save({ major: 1, minor: 0, patch: 0 });
      await store.save({ major: 2, minor: 0, patch: 0 });

      const collection = [makeWhatsNew(1), makeWhatsNew(2)];
      const result = await findUnpresented(collection, store);

      expect(result).toBeNull();
    });

    it('returns null for empty collection', async () => {
      const store = createInMemoryVersionStore();
      const result = await findUnpresented([], store);
      expect(result).toBeNull();
    });

    it('returns the only item when store is empty', async () => {
      const store = createInMemoryVersionStore();
      const collection = [makeWhatsNew(1)];
      const result = await findUnpresented(collection, store);

      expect(result).not.toBeNull();
      expect(result!.version.major).toBe(1);
    });
  });

  describe('filterUnpresented', () => {
    it('filters out presented versions', async () => {
      const store = createInMemoryVersionStore();
      await store.save({ major: 1, minor: 0, patch: 0 });

      const collection = [makeWhatsNew(1), makeWhatsNew(2), makeWhatsNew(3)];
      const result = await filterUnpresented(collection, store);

      expect(result).toHaveLength(2);
      expect(result.map((w) => w.version.major)).toEqual([2, 3]);
    });

    it('returns all when none are presented', async () => {
      const store = createInMemoryVersionStore();
      const collection = [makeWhatsNew(1), makeWhatsNew(2)];
      const result = await filterUnpresented(collection, store);

      expect(result).toHaveLength(2);
    });

    it('returns empty when all are presented', async () => {
      const store = createInMemoryVersionStore();
      await store.save({ major: 1, minor: 0, patch: 0 });

      const result = await filterUnpresented([makeWhatsNew(1)], store);
      expect(result).toHaveLength(0);
    });
  });
});
