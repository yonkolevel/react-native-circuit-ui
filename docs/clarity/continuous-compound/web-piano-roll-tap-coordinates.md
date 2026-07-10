# Continuous compound: web piano-roll coordinates and shared math

Last updated: 2026-07-09

- Learned: React Native Web `Pressable` mouse events may not populate `nativeEvent.locationX`; grid taps should derive content-relative x from `clientX - currentTarget.getBoundingClientRect().left`, falling back to `offsetX`/`locationX`.
- Applied in `packages/ui/src/components/PianoRoll/SkiaPianoRollGrid.web.tsx` with a focused unit test in `packages/ui/src/__tests__/piano-roll-web-tap.test.ts`.
- Learned: native and web piano-roll interaction code were duplicating the same row/pitch/step math. Shared pure helpers now live in `packages/ui/src/components/PianoRoll/pianoRollMath.ts` so phase 3 web pointer events can reuse native-tested hit-test, move, and resize behavior instead of growing the web fork.
- Learned: SwiftUI's AudioKit piano roll defaults to black grid strokes (`gridColor: .black` in Midicircuit), but the RN grid uses alternating black rows; neutral `#F7F7F7` low-alpha lines keep the Midicircuit palette while preserving visibility.
- Learned: React's synthetic `event.currentTarget` is the pointer overlay, while `nativeEvent.currentTarget` can be the delegated React root. Pointer capture must use the synthetic target or `pointerup` bypasses the overlay and leaves pads/recording notes held.
- Applied one web pointer layer for piano-roll add/delete/move/resize and drag preview, plus balanced pad/QWERTY release on pointer loss, mouse leave, blur, visibility change, and unmount.
- Pointer ownership must be modeled both per pointer and per destination cell: two fingers on one pad produce one press and only the final release, while the piano roll rejects a second editing pointer and ignores stale capture-loss events.
- Expanded hit targets must not define drag geometry. Move calculations now start from the note's real row, and add/move/resize results are bounded to the clip.
- Web parity includes semantic input: the labeled grid and note buttons expose keyboard add/move/pitch/resize/delete paths alongside pointer gestures.
- Validation: full unit suite, lint, workspace/build typechecks, browser pointer/keyboard QA, and web export pass.
