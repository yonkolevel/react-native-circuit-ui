/**
 * VolumeFader Tests
 *
 * Verifies:
 * - Renders with percentage label
 * - Shows correct percentage text
 * - Has slider track
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../../theme';
import { VolumeFader } from '../VolumeFader';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

describe('VolumeFader', () => {
  it('renders without crashing', () => {
    const { getByTestId } = renderWithTheme(
      <VolumeFader value={90} trackColor="#1AFFA8" isAudible={true} />
    );
    expect(getByTestId('volume-fader')).toBeTruthy();
  });

  it('displays volume as percentage text', () => {
    const { getByTestId } = renderWithTheme(
      <VolumeFader value={75} trackColor="#1AFFA8" isAudible={true} />
    );
    const label = getByTestId('volume-fader-label');
    expect(label.props.children).toBe('75%');
  });

  it('displays 0% for zero volume', () => {
    const { getByTestId } = renderWithTheme(
      <VolumeFader value={0} trackColor="#1AFFA8" isAudible={true} />
    );
    const label = getByTestId('volume-fader-label');
    expect(label.props.children).toBe('0%');
  });

  it('displays 100% for max volume', () => {
    const { getByTestId } = renderWithTheme(
      <VolumeFader value={100} trackColor="#1AFFA8" isAudible={true} />
    );
    const label = getByTestId('volume-fader-label');
    expect(label.props.children).toBe('100%');
  });

  it('renders the slider track', () => {
    const { getByTestId } = renderWithTheme(
      <VolumeFader value={50} trackColor="#1AFFA8" isAudible={true} />
    );
    expect(getByTestId('volume-fader-track')).toBeTruthy();
  });

  it('renders speaker icon', () => {
    const { getByText } = renderWithTheme(
      <VolumeFader value={50} trackColor="#1AFFA8" isAudible={true} />
    );
    expect(getByText('🔊')).toBeTruthy();
  });

  it('accepts custom testID', () => {
    const { getByTestId } = renderWithTheme(
      <VolumeFader
        value={50}
        trackColor="#1AFFA8"
        isAudible={true}
        testID="custom-fader"
      />
    );
    expect(getByTestId('custom-fader')).toBeTruthy();
  });
});
