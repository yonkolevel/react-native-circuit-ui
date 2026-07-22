import {
  getDragPreviewSeed,
  getPianoRollNoteRect,
  hitTestPianoRollNote,
  type PianoRollMathContext,
} from '../pianoRollMath';
import type { ClipNote } from '../../../features/playground/types';

const melodicContext: PianoRollMathContext = {
  isDrum: false,
  basePitch: 48,
  totalPitches: 24,
  beatWidth: 80,
  stepWidth: 20,
  gridWidth: 16 * 80,
  rowHeight: 34,
  pitchToMidi: Array.from({ length: 24 }, (_, i) => 48 + i),
};

const makeNote = (overrides: Partial<ClipNote> = {}): ClipNote => ({
  noteNumber: 60,
  velocity: 100,
  position: 2,
  duration: 0.5,
  ...overrides,
});

describe('getDragPreviewSeed', () => {
  // Regression: the live drag preview used to start from stale shared
  // values (the previous drag's rect, or 0,0) until the first pan update,
  // and the resize preview derived its row from the raw touch Y — which
  // can sit in the adjacent row thanks to the hit test's touch padding.
  it('seeds the preview at the note rect, row derived from the note itself', () => {
    const note = makeNote();
    const seed = getDragPreviewSeed(note, false, melodicContext);
    const rect = getPianoRollNoteRect(note, melodicContext);

    expect(seed.x).toBe(note.position * melodicContext.beatWidth);
    expect(seed.y).toBe(rect.rowIdx * melodicContext.rowHeight + 1);
    expect(seed.y).toBe(rect.y);
  });

  it('matches the first pan-update width: move keeps the 1px gap, resize follows the exact end', () => {
    const note = makeNote({ duration: 1 });
    const moveSeed = getDragPreviewSeed(note, false, melodicContext);
    const resizeSeed = getDragPreviewSeed(note, true, melodicContext);

    expect(moveSeed.width).toBe(1 * melodicContext.beatWidth - 1);
    expect(resizeSeed.width).toBe(1 * melodicContext.beatWidth);
  });

  it('places drum notes on the sample row, not the raw MIDI pitch', () => {
    const drumContext: PianoRollMathContext = {
      ...melodicContext,
      isDrum: true,
      basePitch: 0,
      totalPitches: 4,
      samples: [
        { noteNumber: 36 },
        { noteNumber: 38 },
        { noteNumber: 42 },
        { noteNumber: 46 },
      ],
      pitchToMidi: [36, 38, 42, 46],
    };
    const seed = getDragPreviewSeed(
      makeNote({ noteNumber: 42 }),
      false,
      drumContext
    );
    // sample index 2 → rowIdx = totalPitches - 1 - 2 = 1
    expect(seed.y).toBe(1 * drumContext.rowHeight + 1);
  });
});

describe('hitTestPianoRollNote — resize-zone drift', () => {
  // Regression: SkiaPianoRollGrid's pan gesture uses
  // .activateAfterLongPress(120).minDistance(PAN_MIN_DISTANCE), which lets
  // the touch drift up to PAN_MIN_DISTANCE px *during the hold* before the
  // gesture activates — RNGH only fails the gesture if the drift exceeds
  // that, it doesn't reset the reference point. On a narrow (single-step)
  // note that drift alone can cross into the resize zone, turning an
  // intended move into an accidental resize (reported worse on Android,
  // where this drift shows up more often). The fix reads the touch point
  // from the gesture's onBegin (first contact, zero drift) rather than
  // onStart (post-hold, possibly drifted) for this hit test — this test
  // pins the exact geometry where that distinction matters.
  const PAN_MIN_DISTANCE = 8;

  it('classifies a touch left-of-center as a move', () => {
    const narrowContext: PianoRollMathContext = {
      ...melodicContext,
      stepWidth: 19.7,
      beatWidth: 19.7 * 4,
    };
    // Single-step drum-style note: width ≈ stepWidth - 1 ≈ 18.7px.
    const note = makeNote({ position: 0, duration: 0.25 });
    const rect = getPianoRollNoteRect(note, narrowContext);
    const touchX = rect.x + rect.width * 0.3;

    const hit = hitTestPianoRollNote(
      [note],
      touchX,
      rect.y + rect.height / 2,
      narrowContext
    );

    expect(hit?.isResizeEdge).toBe(false);
  });

  it('a PAN_MIN_DISTANCE drift from that same touch can cross into the resize zone', () => {
    const narrowContext: PianoRollMathContext = {
      ...melodicContext,
      stepWidth: 19.7,
      beatWidth: 19.7 * 4,
    };
    const note = makeNote({ position: 0, duration: 0.25 });
    const rect = getPianoRollNoteRect(note, narrowContext);
    const touchX = rect.x + rect.width * 0.3;
    const driftedX = touchX + PAN_MIN_DISTANCE;

    const hit = hitTestPianoRollNote(
      [note],
      driftedX,
      rect.y + rect.height / 2,
      narrowContext
    );

    // This is the false positive the onBegin-based fix avoids: the same
    // finger placement reads as a move when hit-tested at first contact,
    // but as a resize once drift during the long-press hold is baked in.
    expect(hit?.isResizeEdge).toBe(true);
  });
});
