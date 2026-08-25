import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme';
import { createDrumSamples } from '../../../features/playground/mocks';
import { SkiaPianoRollGrid } from '../SkiaPianoRollGrid.web';

beforeEach(() => {
  Object.assign(globalThis, {
    window: {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      scrollX: 0,
    },
    document: {
      activeElement: null,
      hidden: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  });
});

describe('SkiaPianoRollGrid web guided rows', () => {
  it('dims rows outside the focused mission notes', () => {
    const samples = createDrumSamples();
    const screen = render(
      <ThemeProvider initialMode="dark">
        <SkiaPianoRollGrid
          notes={[]}
          samples={samples}
          instrumentType="drum"
          trackColor="#FF6C3A"
          lengthInBeats={4}
          focusNoteNumbers={[36]}
        />
      </ThemeProvider>
    );

    const focusedLabel = screen.getByLabelText('Edit Kick notes');
    const dimmedLabel = screen.getByLabelText('Edit Snare notes');
    expect(
      StyleSheet.flatten(focusedLabel?.props.style).opacity
    ).toBeUndefined();
    expect(StyleSheet.flatten(dimmedLabel?.props.style).opacity).toBe(0.45);
  });
});
