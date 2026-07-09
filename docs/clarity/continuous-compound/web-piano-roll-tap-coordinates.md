# Continuous compound: web piano-roll coordinates and shared math

Last updated: 2026-07-09

- Learned: React Native Web `Pressable` mouse events may not populate `nativeEvent.locationX`; grid taps should derive content-relative x from `clientX - currentTarget.getBoundingClientRect().left`, falling back to `offsetX`/`locationX`.
- Applied in `packages/ui/src/components/PianoRoll/SkiaPianoRollGrid.web.tsx` with a focused unit test in `packages/ui/src/__tests__/piano-roll-web-tap.test.ts`.
- Learned: native and web piano-roll interaction code were duplicating the same row/pitch/step math. Shared pure helpers now live in `packages/ui/src/components/PianoRoll/pianoRollMath.ts` so phase 3 web pointer events can reuse native-tested hit-test, move, and resize behavior instead of growing the web fork.
- Validation: targeted piano-roll unit tests and build typecheck pass; full unit suite still has unrelated `AccountLoggedIn` snapshot drift.
