import { shouldDragPointer } from '../components/MultiTouchOverlay/MultiTouchOverlay.web';

describe('shouldDragPointer', () => {
  it('keeps mouse input click-only on web', () => {
    expect(shouldDragPointer({ pointerType: 'mouse' })).toBe(false);
  });

  it('preserves drag-to-play for touch and pen input', () => {
    expect(shouldDragPointer({ pointerType: 'touch' })).toBe(true);
    expect(shouldDragPointer({ pointerType: 'pen' })).toBe(true);
  });
});
