#!/usr/bin/env bash
#
# capture-screenshots.sh — Capture iOS simulator screenshots for visual regression tests
#
# Usage:
#   ./scripts/capture-screenshots.sh [--simulator <name>] [--output <dir>] [--delay <seconds>]
#
# Requirements:
#   - Xcode with iOS simulator
#   - The example app built and installed on the target simulator
#
# The script captures a screenshot of the currently-visible screen in the simulator.
# For a full component gallery, navigate the example app to each screen and call
# this script with a descriptive output filename.

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
    --simulator)
      SIMULATOR_NAME="$2"
      shift 2
      ;;
    --output)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --delay)
      DELAY="$2"
      shift 2
      ;;
    --help|-h)
      head -14 "$0" | tail -12
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
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
    echo ""
    echo "Booted simulators:"
    xcrun simctl list devices booted
    echo ""
    echo "Boot it with:  xcrun simctl boot '$SIMULATOR_NAME'"
    exit 1
  fi

  echo "$udid"
}

# ---------------------------------------------------------------------------
# Screenshot helpers
# ---------------------------------------------------------------------------
capture_screenshot() {
  local udid="$1"
  local filename="$2"

  mkdir -p "$OUTPUT_DIR"

  local filepath="$OUTPUT_DIR/$filename"
  xcrun simctl io "$udid" screenshot --type=png "$filepath" 2>/dev/null
  echo "📸 Captured: $filepath"
}

wait_for_app() {
  local seconds="${1:-$DELAY}"
  echo "⏳ Waiting ${seconds}s for app to render..."
  sleep "$seconds"
}

launch_app() {
  local udid="$1"
  echo "🚀 Launching $BUNDLE_ID on $SIMULATOR_NAME..."
  xcrun simctl launch "$udid" "$BUNDLE_ID" 2>/dev/null || {
    echo "⚠️  Could not launch $BUNDLE_ID. Is the example app installed?"
    echo "   Build it first: cd example && npx expo run:ios --device '$SIMULATOR_NAME'"
    exit 1
  }
}

terminate_app() {
  local udid="$1"
  xcrun simctl terminate "$udid" "$BUNDLE_ID" 2>/dev/null || true
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  echo "🔍 Resolving simulator '$SIMULATOR_NAME'..."
  local udid
  udid=$(resolve_simulator_udid)
  echo "✅ Found: $SIMULATOR_NAME ($udid)"
  echo ""

  # Ensure clean state
  terminate_app "$udid"
  sleep 1

  # Launch the example app
  launch_app "$udid"
  wait_for_app "$DELAY"

  # Capture the main screen
  local timestamp
  timestamp=$(date +%Y%m%d_%H%M%S)
  capture_screenshot "$udid" "home_${timestamp}.png"

  # Also capture a canonical "current" screenshot for CI diffing
  capture_screenshot "$udid" "home_current.png"

  echo ""
  echo "✅ Screenshots saved to $OUTPUT_DIR/"
  echo ""
  echo "To compare against baselines, run:"
  echo "  yarn test:visual"
}

main
