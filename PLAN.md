# React Native Circuit UI — Continuation Plan

## Context

This is a React Native UI library (`react-native-circuit-ui`) that ports Midicircuit's SwiftUI design system to React Native. It's integrated into `midicircuit-rn` (the real app) and running on Android.

### What's Done
- **28 reusable UI components** (Text, Button, Input, Avatar, ProgressBar, etc.)
- **Full DAW UI** (SongView, Mixer, TrackView, DrumPads, PianoKeyboard, ClipEditor, etc.)
- **Feature screens** (Dashboard, Welcome, Account, Discover, Trophies, Circuits)
- **Native MultiTouchOverlay** (iOS only — for drag-to-play on pads/piano)
- **SF Symbols** (iOS) + **MaterialCommunityIcons** (Android) icon system
- **Types aligned** with midicircuit-rn songStore
- **Zustand stores** (prototype) for playground/song state
- **Snapshot tests** — 12 baselines for SongView, MixerView, PlaygroundsDashboard
- **Android app running** — Dashboard → SongView → Mixer flow working
- **iOS routing** — uses native SwiftUI app via NativeAppScreen

### Repository Structure
```
midicircuit-macos/
├── MidicircuitKit/              ← Swift/SwiftUI (iOS original)
├── midicircuit-rn/              ← RN app (audio engine + screens)
├── react-native-circuit-ui/     ← UI library (this repo)
```

### Key Files
- `react-native-circuit-ui/src/features/playground/components/SongView/SongView.tsx` — Main DAW view
- `react-native-circuit-ui/src/features/playground/components/Mixer/MixerView.tsx` — Mixer
- `react-native-circuit-ui/ARCHITECTURE.md` — Architecture doc
- `midicircuit-rn/src/screens/PlaygroundScreen.tsx` — Connected DAW screen
- `midicircuit-rn/src/screens/PlaygroundsDashboardScreen.tsx` — Connected dashboard
- `midicircuit-rn/App.tsx` — App entry point

### How to Run
```bash
# Android
cd midicircuit-rn
npx expo start --port 8082 --clear
# In another terminal:
cd android && ./gradlew app:assembleDebug -PreactNativeDevServerPort=8082
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb reverse tcp:8082 tcp:8082

# iOS (circuit-ui example app)
cd react-native-circuit-ui/example
npx expo run:ios --device circuitui-lab --port 8083
```

### How to Debug
- **iOS original**: Use simulator named "midicircuit" (`xcrun simctl list devices booted`)
- **Android**: Use `adb exec-out screencap -p > screenshot.png` for screenshots
- **Compare**: Always screenshot iOS original first, then fix Android to match
- **Snapshot tests**: `npx jest --testPathPattern="SongView" --no-coverage` to catch regressions

---

## Priority 1: SongView Fidelity (continue current work)

### Remaining Issues
Compare EVERY element against iOS simulator "midicircuit" app:

1. **Toolbar icons** — verify each icon matches iOS SF Symbols exactly
2. **Section tab styling** — iOS has subtle border/active state differences  
3. **Clip MIDI preview** — note rendering inside clips needs exact pixel match
4. **"+ Add track" button** — verify position and styling
5. **Empty clip "+" icon** — iOS uses stroke border, we use colored bg (verify which is correct per section state)
6. **Track label text** — iOS uses `.system(size: 10, weight: .medium)`, verify our `extraSmall` matches

### Method
1. Screenshot iOS original via `xcrun simctl io <UDID> screenshot`
2. Screenshot Android via `adb exec-out screencap -p`
3. Compare pixel-by-pixel
4. Fix differences
5. Run snapshot tests to verify no regressions
6. Update snapshots only when verified correct

---

## Priority 2: Mixer Fidelity

Compare Android Mixer against iOS Mixer:
1. **Track strip card** — verify bg color (#1A1A1A), corner radius (8), padding (16)
2. **Volume slider** — verify colored tint matches track, thumb style
3. **Pan slider** — verify centered thumb, gray tint
4. **M/S buttons** — verify exact colors (M: #FF5C24 active, S: #00FF9E active, #333333 inactive)
5. **Track label** — verify dot size (12px), text style (11pt medium, #888888)
6. **"Volume" / "Pan" labels** — verify font (11pt medium, #888888)

---

## Priority 3: Bottom Panel (DrumPads + Piano)

1. **DrumPads on Android** — currently uses Pressable (tap only). Need native MultiTouchOverlay equivalent for Android (Kotlin) for drag-to-play
2. **Piano keyboard** — same issue, needs Android native touch
3. **Bottom panel height** — verify against iOS (should be ~50% of screen)
4. **Handle bar** — verify styling matches iOS
5. **Panel expand/collapse animation** — add Reanimated animation

---

## Priority 4: ClipEditor / Piano Roll

The most complex view. Currently a basic implementation. Needs:
1. **Pitch labels** — left column with sample names on colored bg
2. **Grid** — dark alternating rows, subtle grid lines
3. **Notes** — colored rectangles with center line + dots
4. **Zoom controls** — floating right panel (expand, zoom+, 100%, zoom-)
5. **Section bar** — orange bar with "— 1 2 +"
6. **Velocity lane** — bars with values on top in orange
7. **Toolbar** — back, play, record, metronome, undo, redo, settings

Compare against iOS ClipEditor screenshots from earlier session.

---

## Priority 5: Remaining Feature Screens

These are built but not yet connected/tested on Android:
1. **Welcome screen** — onboarding flow
2. **Account** — profile, sign in, create account
3. **Discover** — content feed with FeaturedCard
4. **My Circuits** — enrolled circuits list
5. **Trophies** — achievement grid

For each: connect to navigation, verify rendering on Android, compare with iOS.

---

## Priority 6: Android-Specific Polish

1. **Smooth gradients** — expo-linear-gradient is working, verify all gradient covers
2. **Material 3 tab bar** — add icons to dashboard tab bar (currently text-only)
3. **Context menus** — Android uses native Popup menu for "..." buttons
4. **Back gesture** — verify Android predictive back animation works
5. **Status bar** — verify dark theme status bar on all screens

---

## Priority 7: Testing & Stability

1. **Snapshot tests** — add for ALL remaining components (currently only SongView, MixerView, PlaygroundsDashboard)
2. **Unit tests** — callback tests for interactive components
3. **Visual regression** — capture baseline screenshots for automated comparison
4. **TypeScript** — must always compile clean (`npx tsc --noEmit`)

---

## Architecture Rules (from ARCHITECTURE.md)

1. UI library (`react-native-circuit-ui`) = pure presentation components, NO stores/audio/navigation
2. App (`midicircuit-rn`) = stores, audio, navigation, connected screens
3. Data flows in via props, actions flow out via callbacks
4. Types must match `midicircuit-rn/src/stores/songStore.ts`
5. iOS uses native SwiftUI app, Android uses circuit-ui components
6. Each platform uses its native navigation patterns

---

## Debugging Tips

- Android emulator crashes frequently. Use `Pixel_6a_API_33` (more stable than API 34)
- Metro port: use 8082 for midicircuit-rn (8081 often occupied)
- `adb reverse tcp:8082 tcp:8082` after emulator boot
- SVG causes `topSvgLayout` crash on Android Fabric — suppressed in App.tsx ErrorUtils
- Lucide icons use SVG — Android uses MaterialCommunityIcons fallback instead
- `npx expo prebuild` needed after adding native dependencies
- Rebuild APK: `cd android && ./gradlew app:assembleDebug -PreactNativeDevServerPort=8082`
