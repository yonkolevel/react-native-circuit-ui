/**
 * Tests for WhatsNewVersion — mirrors WhatsNew+Version.swift behavior.
 */
import {
  parseVersion,
  formatVersion,
  createVersion,
  compareVersions,
  versionsEqual,
} from '../WhatsNewVersion';

describe('WhatsNewVersion', () => {
  describe('parseVersion', () => {
    it('parses a full semver string', () => {
      expect(parseVersion('2.1.3')).toEqual({ major: 2, minor: 1, patch: 3 });
    });

    it('parses major.minor with missing patch', () => {
      expect(parseVersion('3.5')).toEqual({ major: 3, minor: 5, patch: 0 });
    });

    it('parses major only', () => {
      expect(parseVersion('7')).toEqual({ major: 7, minor: 0, patch: 0 });
    });

    it('handles empty string', () => {
      expect(parseVersion('')).toEqual({ major: 0, minor: 0, patch: 0 });
    });

    it('handles non-numeric components', () => {
      expect(parseVersion('abc.def')).toEqual({ major: 0, minor: 0, patch: 0 });
    });
  });

  describe('formatVersion', () => {
    it('formats as major.minor.patch', () => {
      expect(formatVersion({ major: 2, minor: 1, patch: 3 })).toBe('2.1.3');
    });

    it('formats zeroes', () => {
      expect(formatVersion({ major: 0, minor: 0, patch: 0 })).toBe('0.0.0');
    });
  });

  describe('createVersion', () => {
    it('creates with all components', () => {
      expect(createVersion(1, 2, 3)).toEqual({ major: 1, minor: 2, patch: 3 });
    });

    it('defaults minor and patch to 0', () => {
      expect(createVersion(5)).toEqual({ major: 5, minor: 0, patch: 0 });
    });
  });

  describe('compareVersions', () => {
    it('returns 0 for equal versions', () => {
      expect(
        compareVersions(
          { major: 1, minor: 2, patch: 3 },
          { major: 1, minor: 2, patch: 3 }
        )
      ).toBe(0);
    });

    it('returns negative when a < b (major)', () => {
      expect(
        compareVersions(
          { major: 1, minor: 0, patch: 0 },
          { major: 2, minor: 0, patch: 0 }
        )
      ).toBeLessThan(0);
    });

    it('returns positive when a > b (major)', () => {
      expect(
        compareVersions(
          { major: 3, minor: 0, patch: 0 },
          { major: 1, minor: 0, patch: 0 }
        )
      ).toBeGreaterThan(0);
    });

    it('compares minor when major is equal', () => {
      expect(
        compareVersions(
          { major: 1, minor: 2, patch: 0 },
          { major: 1, minor: 5, patch: 0 }
        )
      ).toBeLessThan(0);
    });

    it('compares patch when major and minor are equal', () => {
      expect(
        compareVersions(
          { major: 1, minor: 2, patch: 3 },
          { major: 1, minor: 2, patch: 1 }
        )
      ).toBeGreaterThan(0);
    });
  });

  describe('versionsEqual', () => {
    it('returns true for equal versions', () => {
      expect(
        versionsEqual(
          { major: 1, minor: 2, patch: 3 },
          { major: 1, minor: 2, patch: 3 }
        )
      ).toBe(true);
    });

    it('returns false for different versions', () => {
      expect(
        versionsEqual(
          { major: 1, minor: 2, patch: 3 },
          { major: 1, minor: 2, patch: 4 }
        )
      ).toBe(false);
    });
  });
});
