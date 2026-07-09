import { getWebGridTapX } from '../components/PianoRoll/SkiaPianoRollGrid.web';

describe('getWebGridTapX', () => {
  it('uses DOM offsetX when RN-web locationX is missing', () => {
    expect(getWebGridTapX({ nativeEvent: { offsetX: 96 } })).toBe(96);
  });

  it('falls back to client coordinates relative to the pressed row', () => {
    expect(
      getWebGridTapX({
        nativeEvent: { clientX: 250 },
        currentTarget: { getBoundingClientRect: () => ({ left: 40 }) },
      })
    ).toBe(210);
  });
});
