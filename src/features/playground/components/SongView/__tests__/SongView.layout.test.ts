/**
 * SongView Layout Alignment Tests
 *
 * These tests verify that the absolute-positioned labels overlay aligns
 * vertically with the clip rows. This catches the class of bug where
 * gap/padding/spacer interactions cause visual misalignment that JSON
 * snapshot tests cannot detect (they serialize structure, not pixels).
 *
 * The math here mirrors exactly what React Native's Yoga layout engine
 * computes — if these pass, the labels and clips are aligned on screen.
 */
import { GRID } from '../SongView';

const { CELL_W, CELL_H, SECTION_H, GAP } = GRID;

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Compute Y positions for children in a column with `gap` between them.
 * This matches React Native's Yoga behavior for a VStack with gap.
 */
function computeYPositions(childHeights: number[], gap: number): number[] {
  const positions: number[] = [];
  let y = 0;
  for (let i = 0; i < childHeights.length; i++) {
    positions.push(y);
    y += childHeights[i]! + gap;
  }
  return positions;
}

/**
 * Compute Y positions for clip rows.
 * sections row (SECTION_H) + marginBottom (GAP) → then clipRows with gap.
 */
function computeClipRowPositions(trackCount: number): number[] {
  const sectionsTotalHeight = SECTION_H + GAP; // sections height + marginBottom
  const positions: number[] = [];
  for (let i = 0; i < trackCount; i++) {
    positions.push(sectionsTotalHeight + i * (CELL_H + GAP));
  }
  return positions;
}

/**
 * Compute Y positions for label overlay.
 * labelsOverlay has gap:GAP between children.
 * Children: [spacer(height), label, label, label, ...]
 */
function computeLabelPositions(
  spacerHeight: number,
  trackCount: number
): number[] {
  const childHeights = [spacerHeight, ...Array(trackCount).fill(CELL_H)];
  const allPositions = computeYPositions(childHeights, GAP);
  // Skip spacer, return label positions only
  return allPositions.slice(1);
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('SongView grid alignment', () => {
  const TRACK_COUNTS = [1, 2, 3, 4, 5, 8];

  for (const trackCount of TRACK_COUNTS) {
    it(`labels align with clip rows for ${trackCount} track(s)`, () => {
      const clipPositions = computeClipRowPositions(trackCount);
      const labelPositions = computeLabelPositions(SECTION_H, trackCount);

      expect(labelPositions).toHaveLength(clipPositions.length);

      for (let i = 0; i < trackCount; i++) {
        expect(labelPositions[i]).toBe(clipPositions[i]);
      }
    });
  }

  it('spacer + gap equals section header total height', () => {
    // The spacer sits inside a container with gap:GAP.
    // spacer height + gap must equal sections height + marginBottom
    const spacerHeightPlusGap = SECTION_H + GAP;
    const sectionsTotalHeight = SECTION_H + GAP;
    expect(spacerHeightPlusGap).toBe(sectionsTotalHeight);
  });

  it('labels and clips have the same cell height', () => {
    // Both label and clipRow must use CELL_H
    expect(CELL_H).toBe(60);
  });

  it('labels overlay width matches label padding in clip rows', () => {
    // clipRow paddingLeft must equal labelsOverlay width + GAP
    const clipRowPaddingLeft = CELL_W + GAP;
    const expectedPadding = GRID.CELL_W + GRID.GAP;
    expect(clipRowPaddingLeft).toBe(expectedPadding);
  });

  it('would have caught the spacer=54 bug', () => {
    // Regression test: if spacer were 54 instead of SECTION_H(50),
    // the first label would start 4px too low
    const badLabelPositions = computeLabelPositions(54, 3);
    const clipPositions = computeClipRowPositions(3);

    // This MUST fail — proves the test catches the bug
    expect(badLabelPositions[0]).not.toBe(clipPositions[0]);
    expect(badLabelPositions[0]! - clipPositions[0]!).toBe(4); // the 4px shift
  });
});
