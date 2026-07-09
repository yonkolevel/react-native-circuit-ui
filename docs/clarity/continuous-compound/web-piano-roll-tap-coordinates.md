# Continuous compound: web piano-roll tap coordinates

Last updated: 2026-07-09

- Learned: React Native Web `Pressable` mouse events may not populate `nativeEvent.locationX`; grid taps should derive content-relative x from `clientX - currentTarget.getBoundingClientRect().left`, falling back to `offsetX`/`locationX`.
- Applied in `packages/ui/src/components/PianoRoll/SkiaPianoRollGrid.web.tsx` with a focused unit test in `packages/ui/src/__tests__/piano-roll-web-tap.test.ts`.
- No promotion needed yet; phase 2 should extract shared piano-roll math before adding more web interaction logic.
