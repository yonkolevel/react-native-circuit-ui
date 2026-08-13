import {
  bendFromMidpoint,
  contourPreviewVelocities,
  curveFromDrag,
  hitTestVelocityHandle,
  latchPointerModifiers,
  makeVelocityPreset,
  nextPrecisionBand,
  polylineFromPixels,
  rawPolylineFromPixels,
  shouldActivateTouchDraw,
  touchLiftOutcome,
  xForVelocityHandle,
} from '../velocityContourAuthoring';

const notes = [
  { noteNumber: 36, position: 0, duration: 0.25, velocity: 80 },
  { noteNumber: 36, position: 1, duration: 0.25, velocity: 90 },
  { noteNumber: 36, position: 2, duration: 0.25, velocity: 100 },
];

describe('velocity contour authoring math', () => {
  it('activates touch drawing only after 120ms within 6 logical points', () => {
    expect(shouldActivateTouchDraw(119, 0)).toBe(false);
    expect(shouldActivateTouchDraw(120, 6)).toBe(true);
    expect(shouldActivateTouchDraw(200, 6.01)).toBe(false);
  });

  it('commits when the primary lifts and freezes when the secondary lifts', () => {
    expect(touchLiftOutcome(1, 2, [1])).toBe('freeze-bend');
    expect(touchLiftOutcome(1, 2, [2])).toBe('commit');
    expect(touchLiftOutcome(1, -1, [])).toBe('commit');
  });

  it('hit-tests the nearest handle and breaks exact ties toward the later index', () => {
    const handles = [
      { globalIndex: 2, centerX: 10, centerY: 10 },
      { globalIndex: 7, centerX: 10, centerY: 10 },
    ];
    expect(hitTestVelocityHandle(handles, 10, 10)).toBe(7);
    expect(hitTestVelocityHandle(handles, 30, 10)).toBe(7);
    expect(hitTestVelocityHandle(handles, 10, 30)).toBe(7);
    expect(hitTestVelocityHandle(handles, 30, 26)).toBe(-1);
    expect(hitTestVelocityHandle(handles, 100, 100)).toBe(-1);
    expect(
      hitTestVelocityHandle(
        [handles[0]!, { ...handles[1]!, centerX: 10.0000005 }],
        10,
        10
      )
    ).toBe(2);
  });

  it('keeps edge velocity handles inside the shared timeline width', () => {
    expect(xForVelocityHandle(0, 10, 32)).toBe(0);
    expect(xForVelocityHandle(31.75, 10, 32)).toBe(296);
    expect(xForVelocityHandle(2, 10, 32)).toBe(20);
  });

  it('uses the specified precision-band hysteresis and multi-band transitions', () => {
    expect(nextPrecisionBand(1, 43)).toEqual({ band: 1, transitions: 0 });
    expect(nextPrecisionBand(1, 104)).toEqual({ band: 8, transitions: 2 });
    expect(nextPrecisionBand(8, 97)).toEqual({ band: 8, transitions: 0 });
    expect(nextPrecisionBand(8, 35)).toEqual({ band: 1, transitions: 2 });
  });

  it('normalizes right-to-left curves and swaps endpoint velocities', () => {
    const contour = curveFromDrag(
      { x: 200, y: 0 },
      { x: 0, y: 100 },
      100,
      116,
      4,
      0
    );
    expect(contour.startBeat).toBe(0);
    expect(contour.endBeat).toBe(2);
    expect(contour.variant).toEqual({
      type: 'curve',
      from: 0,
      to: 127,
      bend: 0,
    });
  });

  it('derives bounded bend from the second finger midpoint', () => {
    expect(bendFromMidpoint(64, 64, 127)).toBe(1);
    expect(bendFromMidpoint(64, 64, 0)).toBe(-1);
    expect(bendFromMidpoint(0, 0, 0)).toBe(0);
  });

  it('simplifies pointer points in logical space before converting to a polyline', () => {
    const contour = polylineFromPixels(
      [
        { x: 0, y: 50 },
        { x: 50, y: 50.5 },
        { x: 100, y: 50 },
      ],
      100,
      116,
      4,
      2
    );
    expect(contour.variant.type).toBe('polyline');
    if (contour.variant.type === 'polyline') {
      expect(contour.variant.points).toHaveLength(2);
    }
  });

  it('keeps every raw pointer point for the in-progress preview', () => {
    const contour = rawPolylineFromPixels(
      [
        { x: 0, y: 50 },
        { x: 50, y: 50.5 },
        { x: 100, y: 50 },
      ],
      100,
      116,
      4
    );

    expect(contour.variant.type).toBe('polyline');
    if (contour.variant.type === 'polyline') {
      expect(contour.variant.points).toHaveLength(3);
    }
  });

  it('latches desktop modifiers at pointer-down', () => {
    expect(
      latchPointerModifiers({
        shiftKey: true,
        altKey: true,
        metaKey: false,
        ctrlKey: true,
      })
    ).toEqual({ curve: true, fine: true, mode: 'additive' });
  });

  it('builds preview velocities only for selected indexes inside the contour range', () => {
    const preview = contourPreviewVelocities(
      {
        startBeat: 0,
        endBeat: 1,
        variant: { type: 'curve', from: 40, to: 100, bend: 0 },
      },
      'absolute',
      notes,
      [0, 2]
    );
    expect(preview).toEqual([40, -1, -1]);
  });

  it('creates the documented wave and accent presets', () => {
    const wave = makeVelocityPreset('wave', notes);
    expect(wave?.variant).toEqual({
      type: 'polyline',
      points: [
        { beat: 0, velocity: 64 },
        { beat: 0.5, velocity: 112 },
        { beat: 1, velocity: 64 },
        { beat: 1.5, velocity: 112 },
        { beat: 2, velocity: 64 },
      ],
    });
    const accentNotes = Array.from({ length: 5 }, (_, index) => ({
      ...notes[0]!,
      position: index,
    }));
    const accent = makeVelocityPreset('accent', accentNotes);
    expect(accent?.variant.type).toBe('polyline');
    if (accent?.variant.type === 'polyline') {
      expect(accent.variant.points.map((point) => point.velocity)).toEqual([
        120, 80, 80, 80, 120,
      ]);
    }

    const chordAccent = makeVelocityPreset('accent', [
      accentNotes[0]!,
      { ...accentNotes[0]!, noteNumber: 40 },
      ...accentNotes.slice(1),
    ]);
    if (chordAccent?.variant.type === 'polyline') {
      expect(chordAccent.variant.points).toEqual([
        { beat: 0, velocity: 120 },
        { beat: 1, velocity: 80 },
        { beat: 2, velocity: 80 },
        { beat: 3, velocity: 80 },
        { beat: 4, velocity: 120 },
      ]);
    }
  });
});
