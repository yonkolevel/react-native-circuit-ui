import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme';
import { NotePrecisionPanel } from '../NotePrecisionPanel';
import { NotePrecisionPanel as WebNotePrecisionPanel } from '../NotePrecisionPanel.web';

const props = {
  notes: [],
  pitchIndex: 0,
  pitchLabel: 'C4',
  pitchMidiNumber: 60,
  activeLengthInBars: 1,
  trackColor: '#FF5C24',
  stepWidth: 10,
  onClose: jest.fn(),
  editable: false,
};

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);

describe('NotePrecisionPanel accessibility', () => {
  it.each([
    ['native', NotePrecisionPanel],
    ['web', WebNotePrecisionPanel],
  ])(
    'exposes read-only state through a reachable %s status element',
    (_name, Panel) => {
      const { getByLabelText } = renderWithTheme(<Panel {...props} />);

      expect(
        getByLabelText('Note precision editor, read only').props
      ).toMatchObject({
        accessible: true,
        accessibilityRole: 'text',
        accessibilityState: { disabled: true },
      });
    }
  );
});
