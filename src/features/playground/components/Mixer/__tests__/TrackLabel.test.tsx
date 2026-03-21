/**
 * TrackLabel Tests
 *
 * Verifies:
 * - Renders color dot and track name
 * - Dot has correct color
 * - Dot is 12×12
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../../theme';
import { TrackLabel } from '../TrackLabel';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

describe('TrackLabel', () => {
  it('renders without crashing', () => {
    const { getByTestId } = renderWithTheme(
      <TrackLabel color="#1AFFA8" name="Drums" />
    );
    expect(getByTestId('track-label')).toBeTruthy();
  });

  it('displays track name', () => {
    const { getByText } = renderWithTheme(
      <TrackLabel color="#FF6C3A" name="Keys" />
    );
    expect(getByText('Keys')).toBeTruthy();
  });

  it('renders color dot with correct color', () => {
    const { getByTestId } = renderWithTheme(
      <TrackLabel color="#1AFFA8" name="Drums" />
    );
    const dot = getByTestId('track-label-dot');
    const flatStyle = Array.isArray(dot.props.style)
      ? Object.assign({}, ...dot.props.style)
      : dot.props.style;
    expect(flatStyle.backgroundColor).toBe('#1AFFA8');
  });

  it('renders dot as 12×12', () => {
    const { getByTestId } = renderWithTheme(
      <TrackLabel color="#1AFFA8" name="Drums" />
    );
    const dot = getByTestId('track-label-dot');
    const flatStyle = Array.isArray(dot.props.style)
      ? Object.assign({}, ...dot.props.style)
      : dot.props.style;
    expect(flatStyle.width).toBe(12);
    expect(flatStyle.height).toBe(12);
  });

  it('accepts custom testID', () => {
    const { getByTestId } = renderWithTheme(
      <TrackLabel color="#1AFFA8" name="Drums" testID="custom-label" />
    );
    expect(getByTestId('custom-label')).toBeTruthy();
    expect(getByTestId('custom-label-dot')).toBeTruthy();
  });
});
