/**
 * Visual Regression Tests for react-native-circuit-ui
 *
 * These tests compare screenshots captured from the iOS simulator against
 * baseline images stored in `__image_snapshots__/`. On first run the baselines
 * are created automatically. Subsequent runs diff the current screenshot
 * against the baseline and fail if the difference exceeds the threshold.
 *
 * Prerequisites:
 *   1. Run `./scripts/capture-screenshots.sh` to capture fresh screenshots
 *   2. Run `yarn test:visual` to compare against baselines
 *
 * To update baselines after intentional visual changes:
 *   yarn test:visual -- --updateSnapshot
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

// Extend Jest with the image snapshot matcher
expect.extend({ toMatchImageSnapshot });

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const SCREENSHOTS_DIR = resolve(__dirname, '../../../screenshots');

/** Default diff config — allows up to 0.5% pixel difference */
const DEFAULT_DIFF_CONFIG = {
  threshold: 0.1, // per-pixel sensitivity (0 = exact, 1 = any difference ignored)
  includeAA: false, // ignore anti-aliasing differences
};

const DEFAULT_SNAPSHOT_CONFIG = {
  customDiffConfig: DEFAULT_DIFF_CONFIG,
  failureThreshold: 0.005, // 0.5% of total pixels
  failureThresholdType: 'percent' as const,
  blur: 1, // slight blur to smooth over sub-pixel rendering variance
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function loadScreenshot(filename: string): Buffer {
  const filepath = resolve(SCREENSHOTS_DIR, filename);
  if (!existsSync(filepath)) {
    throw new Error(
      `Screenshot not found: ${filepath}\n` +
        'Run `./scripts/capture-screenshots.sh` first to capture screenshots.'
    );
  }
  return readFileSync(filepath);
}

function screenshotExists(filename: string): boolean {
  return existsSync(resolve(SCREENSHOTS_DIR, filename));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Visual Regression', () => {
  describe('Home Screen', () => {
    it('should match the home screen baseline', () => {
      if (!screenshotExists('home_current.png')) {
        console.warn(
          '⚠️  No screenshot found. Skipping visual regression test.\n' +
            '   Run ./scripts/capture-screenshots.sh to capture screenshots.'
        );
        return;
      }

      const screenshot = loadScreenshot('home_current.png');

      expect(screenshot).toMatchImageSnapshot({
        ...DEFAULT_SNAPSHOT_CONFIG,
        customSnapshotIdentifier: 'home-screen',
      });
    });
  });

  describe('Component Screenshots', () => {
    // Each component screenshot follows the naming convention:
    // `<component-name>_current.png`
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

        if (!screenshotExists(filename)) {
          // Skip gracefully — component screenshot hasn't been captured yet
          console.warn(
            `⚠️  No screenshot for "${component}". Skipping.\n` +
              `   Capture it: xcrun simctl io <UDID> screenshot screenshots/${filename}`
          );
          return;
        }

        const screenshot = loadScreenshot(filename);

        expect(screenshot).toMatchImageSnapshot({
          ...DEFAULT_SNAPSHOT_CONFIG,
          customSnapshotIdentifier: `${component}-component`,
        });
      });
    }
  });
});
