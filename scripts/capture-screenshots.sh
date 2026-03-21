#!/usr/bin/env bash
#
# capture-screenshots.sh — Capture iOS simulator screenshots for visual regression tests
#
# Usage:
#   ./scripts/capture-screenshots.sh [--simulator <name>] [--output <dir>] [--delay <seconds>]
#
# Captures the example app's component gallery and playground showcase screens.
# Uses deep links to navigate to specific screens for targeted visual tests.
#
# Requirements:
#   - Xcode with iOS simulator
#   - The example app built and installed on the target simulator
#     Build: cd example && npx expo run:ios --device <simulator> --port 8083

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SIMULATOR_NAME="${SIMULATOR_NAME:-circuitui-lab}"
OUTPUT_DIR="${OUTPUT_DIR:-screenshots}"
DELAY="${DELAY:-2}"
BUNDLE_ID="circuitui.example"

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case $1 in
    --simulator) SIMULATOR_NAME="$2"; shift 2 ;;
    --output)    OUTPUT_DIR="$2"; shift 2 ;;
    --delay)     DELAY="$2"; shift 2 ;;
    --help|-h)   head -14 "$0" | tail -12; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ---------------------------------------------------------------------------
# Resolve simulator UDID
# ---------------------------------------------------------------------------
resolve_simulator_udid() {
  local udid
  udid=$(xcrun simctl list devices booted -j \
    | python3 -c "
import sys, json
data = json.load(sys.stdin)
for runtime, devices in data.get('devices', {}).items():
    for d in devices:
        if d.get('name') == '$SIMULATOR_NAME' and d.get('state') == 'Booted':
            print(d['udid'])
            sys.exit(0)
sys.exit(1)
" 2>/dev/null)

  if [[ -z "$udid" ]]; then
    echo "❌ Simulator '$SIMULATOR_NAME' is not booted."
    echo "Booted simulators:"
    xcrun simctl list devices booted
    echo "Boot it with:  xcrun simctl boot '$SIMULATOR_NAME'"
    exit 1
  fi
  echo "$udid"
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
capture() {
  local udid="$1" name="$2"
  mkdir -p "$OUTPUT_DIR"
  xcrun simctl io "$udid" screenshot --type=png "$OUTPUT_DIR/${name}_current.png" 2>/dev/null
  echo "📸  $name"
}

wait_render() { sleep "${1:-$DELAY}"; }

launch_app() {
  local udid="$1"
  xcrun simctl launch "$udid" "$BUNDLE_ID" 2>/dev/null || {
    echo "⚠️  Could not launch $BUNDLE_ID. Build first:"
    echo "   cd example && npx expo run:ios --device '$SIMULATOR_NAME' --port 8083"
    exit 1
  }
}

terminate_app() { xcrun simctl terminate "$1" "$BUNDLE_ID" 2>/dev/null || true; }

# Tap at coordinates (x, y) — simulates single tap via AppleScript + Accessibility
tap() {
  local udid="$1" x="$2" y="$3"
  # Use simctl's UI interaction (Xcode 15+)
  xcrun simctl io "$udid" tap "$x" "$y" 2>/dev/null || true
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  echo "🔍 Resolving simulator '$SIMULATOR_NAME'..."
  local udid
  udid=$(resolve_simulator_udid)
  echo "✅ $SIMULATOR_NAME ($udid)"
  echo ""

  terminate_app "$udid"
  sleep 1

  # ── Screen 1: Component Gallery (home) ──
  launch_app "$udid"
  wait_render 3
  capture "$udid" "home"

  # ── Screen 2: DAW / Playground (tap "🎹 DAW" button) ──
  # The DAW button is at bottom-left of the screen
  # On iPhone 15 Pro (393pt wide): ~60pt from left, ~810pt from top
  tap "$udid" 80 810
  wait_render 2
  capture "$udid" "playground-showcase"

  # ── Screen 3: Features (tap "Features →" button) ──
  tap "$udid" 330 810
  wait_render 2
  capture "$udid" "features-showcase"

  # ── Back to components for individual captures ──
  tap "$udid" 330 810
  wait_render 1

  echo ""
  echo "✅ Screenshots saved to $OUTPUT_DIR/"
  echo "   Compare: npx jest --projects visual"
}

main
