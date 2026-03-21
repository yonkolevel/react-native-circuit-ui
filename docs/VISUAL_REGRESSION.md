# Visual Regression Testing

Visual regression tests ensure that UI components don't change appearance unexpectedly. This project uses **`jest-image-snapshot`** with **`pixelmatch`** to compare screenshots captured from the iOS simulator against stored baselines.

## Architecture

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  iOS Simulator      │────▶│  screenshots/         │────▶│  jest-image-snapshot│
│  (xcrun simctl io)  │     │  home_current.png     │     │  (pixelmatch diff)  │
│                     │     │  button_current.png   │     │                     │
└─────────────────────┘     └──────────────────────┘     └─────────────────────┘
                                                                   │
                                                          ┌────────▼────────┐
                                                          │ __image_        │
                                                          │ snapshots__/    │
                                                          │ (baselines)     │
                                                          └─────────────────┘
```

## Quick Start

### 1. Boot the simulator

```bash
xcrun simctl boot "circuitui-lab"
```

### 2. Build and install the example app

```bash
cd example
npx expo run:ios --device "circuitui-lab"
```

### 3. Capture screenshots

```bash
./scripts/capture-screenshots.sh
```

This will:
- Launch the example app on the `circuitui-lab` simulator
- Wait for it to render
- Capture the home screen to `screenshots/home_current.png`

### 4. Run visual regression tests

```bash
# Run only visual regression tests
yarn test:visual

# Run all tests (unit + visual)
yarn test
```

### 5. Update baselines (after intentional changes)

```bash
yarn test:visual -- -u
```

## Configuration

### Screenshot capture

| Environment Variable | Default           | Description                    |
| -------------------- | ----------------- | ------------------------------ |
| `SIMULATOR_NAME`     | `circuitui-lab`   | Name of the iOS simulator      |
| `OUTPUT_DIR`         | `screenshots`     | Directory for captured images   |
| `DELAY`              | `2`               | Seconds to wait before capture  |

You can also pass these as CLI arguments:

```bash
./scripts/capture-screenshots.sh --simulator "iPhone 16 Pro" --output ./my-screenshots --delay 5
```

### Diff thresholds

The visual regression tests use these default thresholds (configured in `src/__tests__/visual-regression/visual-regression.test.ts`):

| Setting              | Value   | Description                                                  |
| -------------------- | ------- | ------------------------------------------------------------ |
| `threshold`          | `0.1`   | Per-pixel sensitivity (0 = exact match, 1 = ignore all)      |
| `failureThreshold`   | `0.005` | Max percentage of pixels that can differ (0.5%)              |
| `failureThresholdType` | `percent` | Threshold measured as percentage of total pixels          |
| `blur`               | `1`     | Gaussian blur to smooth sub-pixel rendering differences       |
| `includeAA`          | `false` | Ignore anti-aliasing differences                              |

These can be adjusted per-test by passing custom options to `toMatchImageSnapshot()`.

## Capturing Individual Component Screenshots

To capture a screenshot for a specific component, navigate to that component's screen in the example app and use `xcrun simctl io` directly:

```bash
# Get the simulator UDID
UDID=$(xcrun simctl list devices booted -j | python3 -c "
import sys, json
data = json.load(sys.stdin)
for runtime, devices in data.get('devices', {}).items():
    for d in devices:
        if d.get('name') == 'circuitui-lab' and d.get('state') == 'Booted':
            print(d['udid']); sys.exit(0)
")

# Capture a component screenshot
xcrun simctl io "$UDID" screenshot --type=png screenshots/button_current.png
```

### Expected screenshot filenames

The test suite expects screenshots named `<component>_current.png`:

- `home_current.png`
- `button_current.png`
- `avatar_current.png`
- `banner_current.png`
- `input_current.png`
- `modal_current.png`
- `progress-bar_current.png`
- `circular-progress_current.png`
- `segmented-progress-bar_current.png`
- `circuit-card_current.png`
- `learning-path-card_current.png`
- `level-indicator_current.png`
- `text_current.png`
- `toolbar-button_current.png`
- `gradient-cover_current.png`
- `score-indicator_current.png`

## CI Integration

For CI environments, you'll need:

1. **An iOS simulator running** (GitHub Actions macOS runners have Xcode pre-installed)
2. **The example app pre-built** (or use a cached `.app` bundle)
3. **Baseline images committed** to the repo (in `__image_snapshots__/`)

Example GitHub Actions step:

```yaml
- name: Boot simulator
  run: |
    xcrun simctl create circuitui-lab "iPhone 16 Pro" "iOS18.0"
    xcrun simctl boot circuitui-lab

- name: Build example app
  run: |
    cd example
    npx expo run:ios --device circuitui-lab --no-install

- name: Capture screenshots
  run: ./scripts/capture-screenshots.sh

- name: Run visual regression tests
  run: yarn test:visual
```

## Troubleshooting

### "Simulator not booted"

```bash
# List available simulators
xcrun simctl list devices

# Boot a specific simulator
xcrun simctl boot "circuitui-lab"
```

### "Example app not installed"

```bash
cd example
npx expo run:ios --device "circuitui-lab"
```

### "Screenshot differs but the change is intentional"

Update the baseline:

```bash
yarn test:visual -- -u
```

### Diff images are saved on failure

When a test fails, `jest-image-snapshot` saves three images next to the baseline:
- `*-snap.png` — the baseline
- `*-received.png` — the current screenshot
- `*-diff.png` — a highlighted diff showing changed pixels

These are saved in `src/__tests__/visual-regression/__image_snapshots__/__diff_output__/`.

## File Structure

```
react-native-circuit-ui/
├── docs/
│   └── VISUAL_REGRESSION.md          # This file
├── scripts/
│   └── capture-screenshots.sh        # Screenshot capture automation
├── screenshots/                       # Captured screenshots (gitignored)
│   ├── home_current.png
│   ├── button_current.png
│   └── ...
├── src/__tests__/
│   └── visual-regression/
│       ├── visual-regression.test.ts  # Jest test file
│       └── __image_snapshots__/       # Baseline images (committed)
│           └── __diff_output__/       # Diff images on failure (gitignored)
├── jest.config.js                     # Jest configuration with multi-project setup
└── package.json                       # Scripts: test, test:visual
```
