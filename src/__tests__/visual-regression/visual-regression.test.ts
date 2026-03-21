/**
 * Visual Regression Tests for react-native-circuit-ui
 *
 * Uses jest-image-snapshot to compare simulator screenshots against baselines.
 * This catches layout shifts, alignment bugs, and visual regressions that
 * JSON snapshot tests cannot detect.
 *
 * Workflow:
 *   1. Build example app: cd example && npx expo run:ios --device circuitui-lab --port 8083
 *   2. Capture screenshots: ./scripts/capture-screenshots.sh
 *   3. Run visual tests: npx jest --projects visual
 *   4. Update baselines: npx jest --projects visual -- -u
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const SCREENSHOTS_DIR = resolve(__dirname, '../../../screenshots');

const DEFAULT_DIFF_CONFIG = {
  threshold: 0.1,
  includeAA: false,
};

const DEFAULT_SNAPSHOT_CONFIG = {
  customDiffConfig: DEFAULT_DIFF_CONFIG,
  failureThreshold: 0.005, // 0.5% of total pixels
  failureThresholdType: 'percent' as const,
  blur: 1,
};

/** Stricter config for layout-critical views (SongView grid, Mixer) */
const STRICT_SNAPSHOT_CONFIG = {
  customDiffConfig: { threshold: 0.05, includeAA: false },
  failureThreshold: 0.001, // 0.1% — catches even small alignment shifts
  failureThresholdType: 'percent' as const,
  blur: 0, // no blur — we want pixel-exact alignment checks
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function loadScreenshot(filename: string): Buffer {
  const filepath = resolve(SCREENSHOTS_DIR, filename);
  if (!existsSync(filepath)) {
    throw new Error(
      `Screenshot not found: ${filepath}\n` +
        'Run `./scripts/capture-screenshots.sh` first.'
    );
  }
  return readFileSync(filepath);
}

function screenshotExists(filename: string): boolean {
  return existsSync(resolve(SCREENSHOTS_DIR, filename));
}

function skipIfMissing(name: string, filename: string): boolean {
  if (!screenshotExists(filename)) {
    console.warn(
      `⚠️  No screenshot for "${name}". Skipping.\n` +
        `   Capture: ./scripts/capture-screenshots.sh`
    );
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Visual Regression', () => {
  // ── Full-screen captures ──────────────────────────────────────────────
  describe('Screen Screenshots', () => {
    const screens = [
      { name: 'home', id: 'home-screen' },
      { name: 'playground-showcase', id: 'playground-showcase', strict: true },
      { name: 'features-showcase', id: 'features-showcase' },
    ];

    for (const screen of screens) {
      it(`should match the ${screen.name} baseline`, () => {
        const filename = `${screen.name}_current.png`;
        if (skipIfMissing(screen.name, filename)) return;

        const screenshot = loadScreenshot(filename);
        expect(screenshot).toMatchImageSnapshot({
          ...(screen.strict ? STRICT_SNAPSHOT_CONFIG : DEFAULT_SNAPSHOT_CONFIG),
          customSnapshotIdentifier: screen.id,
        });
      });
    }
  });

  // ── Component-level captures ──────────────────────────────────────────
  describe('Component Screenshots', () => {
    const components = [
      'button',
      'avatar',
      'banner',
      'input',
      'modal',
      'progress-bar',
      'circular-progress',
      'segmented-progress-bar',
      'circuit-card',
      'learning-path-card',
      'level-indicator',
      'text',
      'toolbar-button',
      'gradient-cover',
      'score-indicator',
    ];

    for (const component of components) {
      it(`should match the ${component} baseline`, () => {
        const filename = `${component}_current.png`;
        if (skipIfMissing(component, filename)) return;

        const screenshot = loadScreenshot(filename);
        expect(screenshot).toMatchImageSnapshot({
          ...DEFAULT_SNAPSHOT_CONFIG,
          customSnapshotIdentifier: `${component}-component`,
        });
      });
    }
  });
});
