/**
 * WhatsNew Collection utilities — mirrors WhatsNewCollection.swift.
 *
 * Helps find the latest unseen WhatsNew from a collection of versions.
 */
import type {
  WhatsNew,
  WhatsNewCollection,
  WhatsNewVersion,
  WhatsNewVersionStore,
} from '../types';
import { compareVersions } from './WhatsNewVersion';

/**
 * Sort a collection by version, newest first.
 */
export function sortByVersionDescending(
  collection: WhatsNewCollection
): WhatsNewCollection {
  return [...collection].sort((a, b) =>
    compareVersions(b.version, a.version)
  );
}

/**
 * Find the first WhatsNew from the collection whose version
 * has not yet been presented. Returns null if all have been seen.
 *
 * Mirrors the auto-presentation logic in WhatsNewKit's
 * WhatsNewEnvironment — it picks the latest unseen version.
 */
export async function findUnpresented(
  collection: WhatsNewCollection,
  versionStore: WhatsNewVersionStore
): Promise<WhatsNew | null> {
  const sorted = sortByVersionDescending(collection);

  for (const whatsNew of sorted) {
    const seen = await versionStore.hasPresented(whatsNew.version);
    if (!seen) return whatsNew;
  }

  return null;
}

/**
 * Get all versions from a collection that have not been presented.
 */
export async function filterUnpresented(
  collection: WhatsNewCollection,
  versionStore: WhatsNewVersionStore
): Promise<WhatsNewCollection> {
  const results: WhatsNew[] = [];

  for (const whatsNew of collection) {
    const seen = await versionStore.hasPresented(whatsNew.version);
    if (!seen) results.push(whatsNew);
  }

  return results;
}
