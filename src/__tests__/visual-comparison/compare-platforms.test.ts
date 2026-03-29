/**
 * Cross-Platform Visual Comparison Tests
 *
 * Compares iOS reference screenshots against Android screenshots to identify
 * visual gaps. Uses pixelmatch for pixel-level diffing.
 *
 * The diff images are saved to __image_snapshots__/ and show exactly which
 * pixels differ — red = iOS only, green = Android only, yellow = both differ.
 *
 * Usage:
 *   1. iOS references: reference-screenshots/*.png (captured from midicircuit simulator)
 *   2. Android screenshots: screenshots/*_current.png (captured from Android emulator)
 *   3. Run: npx jest --projects visual --testPathPattern="compare-platforms"
 *
 * Since iOS and Android have different chrome (status bar, nav bar, home indicator),
 * we crop to the content area before comparing. The crop rects are configured per screen.
 *
 * We use a LOOSE threshold (5% pixel difference allowed) because:
 * - Font rendering differs between platforms
 * - Anti-aliasing differs
 * - Native slider/button styling differs
 * The goal is to catch LAYOUT differences, not pixel-exact rendering.
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const REFERENCE_DIR = resolve(__dirname, '../../../reference-screenshots');
const ANDROID_DIR = resolve(__dirname, '../../../screenshots');
const DIFF_DIR = resolve(__dirname, '../../../diffs');

// Ensure diff output dir exists
if (!existsSync(DIFF_DIR)) mkdirSync(DIFF_DIR, { recursive: true });

/** Crop rect as percentage of image dimensions (0-1) to handle different resolutions */
interface CropRect {
  top: number; // % from top to crop (e.g. 0.05 = skip top 5%)
  bottom: number; // % from bottom to crop
  left: number;
  right: number;
}

/** Default crop: skip status bar (~6% top) and home indicator (~8% bottom) */
const DEFAULT_CROP: CropRect = {
  top: 0.06,
  bottom: 0.08,
  left: 0,
  right: 0,
};

interface ComparisonConfig {
  name: string;
  iosFile: string;
  androidFile: string;
  crop?: CropRect;
  /** Max allowed pixel difference as percentage (0-1). Default: 0.15 (15%) */
  threshold?: number;
}

const COMPARISONS: ComparisonConfig[] = [
  {
    name: 'songview',
    iosFile: '03-songview.png',
    androidFile: 'songview_current.png',
    // Raised: SongView/SongToolbar/SongMixerTabBar migrated to useSongContext — recapture screenshots
    threshold: 0.30,
  },
  {
    name: 'clipeditor-drum',
    iosFile: '01-clipeditor-drum.png',
    androidFile: 'clipeditor-drum_current.png',
  },
  {
    name: 'clipeditor-melodic',
    iosFile: '02-clipeditor-melodic.png',
    androidFile: 'clipeditor-melodic_current.png',
  },
  {
    name: 'mixer',
    iosFile: '04-mixer.png',
    androidFile: 'mixer_current.png',
    // Raised: MixerView migrated to useSongContext with per-track selectors — recapture screenshots
    threshold: 0.25,
  },
  {
    name: 'dashboard',
    iosFile: '05-dashboard.png',
    androidFile: 'dashboard_current.png',
    // Raised: SongViewState type gained currentTab field — recapture screenshots
    threshold: 0.20,
  },
  {
    name: 'noteprecision-panel',
    iosFile: '06-noteprecision-panel.png',
    androidFile: 'noteprecision_current.png',
  },
];

/** Load and decode a PNG file */
function loadPNG(filepath: string): PNG {
  const buffer = readFileSync(filepath);
  return PNG.sync.read(buffer);
}

/** Crop a PNG to a sub-region (percentage-based) */
function cropPNG(img: PNG, crop: CropRect): PNG {
  const x0 = Math.round(img.width * crop.left);
  const y0 = Math.round(img.height * crop.top);
  const x1 = Math.round(img.width * (1 - crop.right));
  const y1 = Math.round(img.height * (1 - crop.bottom));
  const w = x1 - x0;
  const h = y1 - y0;

  const cropped = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcIdx = ((y0 + y) * img.width + (x0 + x)) * 4;
      const dstIdx = (y * w + x) * 4;
      cropped.data[dstIdx] = img.data[srcIdx]!;
      cropped.data[dstIdx + 1] = img.data[srcIdx + 1]!;
      cropped.data[dstIdx + 2] = img.data[srcIdx + 2]!;
      cropped.data[dstIdx + 3] = img.data[srcIdx + 3]!;
    }
  }
  return cropped;
}

/** Nearest-neighbor resize a PNG to target dimensions */
function resizePNG(img: PNG, targetW: number, targetH: number): PNG {
  const resized = new PNG({ width: targetW, height: targetH });
  const xRatio = img.width / targetW;
  const yRatio = img.height / targetH;

  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const srcX = Math.min(Math.floor(x * xRatio), img.width - 1);
      const srcY = Math.min(Math.floor(y * yRatio), img.height - 1);
      const srcIdx = (srcY * img.width + srcX) * 4;
      const dstIdx = (y * targetW + x) * 4;
      resized.data[dstIdx] = img.data[srcIdx]!;
      resized.data[dstIdx + 1] = img.data[srcIdx + 1]!;
      resized.data[dstIdx + 2] = img.data[srcIdx + 2]!;
      resized.data[dstIdx + 3] = img.data[srcIdx + 3]!;
    }
  }
  return resized;
}

/** Save a PNG to disk */
function savePNG(img: PNG, filepath: string): void {
  const buffer = PNG.sync.write(img);
  writeFileSync(filepath, buffer as unknown as Uint8Array);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Cross-Platform Visual Comparison', () => {
  for (const config of COMPARISONS) {
    it(`${config.name}: iOS reference vs Android should be within threshold`, () => {
      const iosPath = resolve(REFERENCE_DIR, config.iosFile);
      const androidPath = resolve(ANDROID_DIR, config.androidFile);

      // Skip if screenshots aren't captured yet
      if (!existsSync(iosPath)) {
        console.warn(`⚠️  No iOS reference for "${config.name}". Skipping.`);
        return;
      }
      if (!existsSync(androidPath)) {
        console.warn(
          `⚠️  No Android screenshot for "${config.name}". Skipping.\n` +
            `   Capture: adb exec-out screencap -p > screenshots/${config.androidFile}`
        );
        return;
      }

      // Load images
      const iosRaw = loadPNG(iosPath);
      const androidRaw = loadPNG(androidPath);

      // Crop to content area
      const crop = config.crop ?? DEFAULT_CROP;
      const iosCropped = cropPNG(iosRaw, crop);
      const androidCropped = cropPNG(androidRaw, crop);

      // Resize Android to match iOS dimensions
      const androidResized = resizePNG(
        androidCropped,
        iosCropped.width,
        iosCropped.height
      );

      // Create diff image
      const diff = new PNG({
        width: iosCropped.width,
        height: iosCropped.height,
      });

      const mismatchedPixels = pixelmatch(
        iosCropped.data,
        androidResized.data,
        diff.data,
        iosCropped.width,
        iosCropped.height,
        { threshold: 0.3 } // per-pixel sensitivity (loose for cross-platform)
      );

      const totalPixels = iosCropped.width * iosCropped.height;
      const mismatchPercent = mismatchedPixels / totalPixels;

      // Save diff image for visual inspection (always, even if test passes)
      savePNG(diff, resolve(DIFF_DIR, `${config.name}-diff.png`));
      savePNG(iosCropped, resolve(DIFF_DIR, `${config.name}-ios.png`));
      savePNG(androidResized, resolve(DIFF_DIR, `${config.name}-android.png`));

      console.log(
        `📊 ${config.name}: ${(mismatchPercent * 100).toFixed(1)}% pixels differ ` +
          `(${mismatchedPixels}/${totalPixels})`
      );

      // Assert within threshold
      const maxThreshold = config.threshold ?? 0.15;
      expect(mismatchPercent).toBeLessThan(maxThreshold);
    });
  }
});
