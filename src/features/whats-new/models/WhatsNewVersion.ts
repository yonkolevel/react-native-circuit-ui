/**
 * WhatsNew Version utilities — mirrors WhatsNew+Version.swift.
 *
 * Semantic versioning with parse, compare, and format.
 */
import type { WhatsNewVersion } from '../types';

/**
 * Parse a version string "major.minor.patch" into a WhatsNewVersion.
 * Missing components default to 0.
 */
export function parseVersion(versionString: string): WhatsNewVersion {
  const parts = versionString.split('.').map(Number);
  return {
    major: Number.isFinite(parts[0]) ? parts[0]! : 0,
    minor: Number.isFinite(parts[1]) ? parts[1]! : 0,
    patch: Number.isFinite(parts[2]) ? parts[2]! : 0,
  };
}

/**
 * Format a WhatsNewVersion as "major.minor.patch".
 */
export function formatVersion(version: WhatsNewVersion): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Create a WhatsNewVersion from components.
 */
export function createVersion(
  major: number,
  minor: number = 0,
  patch: number = 0
): WhatsNewVersion {
  return { major, minor, patch };
}

/**
 * Compare two versions. Returns:
 * - negative if a < b
 * - 0 if a === b
 * - positive if a > b
 *
 * Matches WhatsNew.Version Comparable in Swift.
 */
export function compareVersions(
  a: WhatsNewVersion,
  b: WhatsNewVersion
): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

/**
 * Check if two versions are equal.
 */
export function versionsEqual(
  a: WhatsNewVersion,
  b: WhatsNewVersion
): boolean {
  return a.major === b.major && a.minor === b.minor && a.patch === b.patch;
}

/**
 * Get the current app version from expo-constants or a fallback.
 * Mirrors WhatsNew.Version.current(in: Bundle) in Swift.
 */
export function currentVersion(
  fallback: string = '1.0.0'
): WhatsNewVersion {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants').default;
    const version =
      Constants.expoConfig?.version ??
      Constants.manifest?.version ??
      fallback;
    return parseVersion(version);
  } catch {
    return parseVersion(fallback);
  }
}
