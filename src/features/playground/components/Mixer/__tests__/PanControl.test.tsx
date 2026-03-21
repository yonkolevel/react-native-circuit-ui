/**
 * PanControl Tests
 *
 * Verifies:
 * - Renders with C/L/R labels
 * - Center label for value near 0
 * - Left label for negative values
 * - Right label for positive values
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../../theme';
import { PanControl } from '../PanControl';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

describe('PanControl', () => {
  it('renders without crashing', () => {
    const { getByTestId } = renderWithTheme(
      <PanControl value={0} />
    );
    expect(getByTestId('pan-control')).toBeTruthy();
  });

  it('shows "C" label when value is 0 (center)', () => {
    const { getByTestId } = renderWithTheme(
      <PanControl value={0} />
    );
    const label = getByTestId('pan-control-label');
    expect(label.props.children).toBe('C');
  });

  it('shows "C" label when value is near zero (|val| < 0.1)', () => {
    const { getByTestId } = renderWithTheme(
      <PanControl value={0.05} />
    );
    const label = getByTestId('pan-control-label');
    expect(label.props.children).toBe('C');
  });

  it('shows "C" label for small negative values', () => {
    const { getByTestId } = renderWithTheme(
      <PanControl value={-0.05} />
    );
    const label = getByTestId('pan-control-label');
    expect(label.props.children).toBe('C');
  });

  it('shows "L" label for negative values', () => {
    const { getByTestId } = renderWithTheme(
      <PanControl value={-0.5} />
    );
    const label = getByTestId('pan-control-label');
    expect(label.props.children).toBe('L');
  });

  it('shows "R" label for positive values', () => {
    const { getByTestId } = renderWithTheme(
      <PanControl value={0.5} />
    );
    const label = getByTestId('pan-control-label');
    expect(label.props.children).toBe('R');
  });

  it('shows "L" label for full-left pan', () => {
    const { getByTestId } = renderWithTheme(
      <PanControl value={-1} />
    );
    const label = getByTestId('pan-control-label');
    expect(label.props.children).toBe('L');
  });

  it('shows "R" label for full-right pan', () => {
    const { getByTestId } = renderWithTheme(
      <PanControl value={1} />
    );
    const label = getByTestId('pan-control-label');
    expect(label.props.children).toBe('R');
  });

  it('renders the slider track', () => {
    const { getByTestId } = renderWithTheme(
      <PanControl value={0} />
    );
    expect(getByTestId('pan-control-track')).toBeTruthy();
  });

  it('renders arrow icon', () => {
    const { getByText } = renderWithTheme(
      <PanControl value={0} />
    );
    expect(getByText('↔')).toBeTruthy();
  });

  it('accepts custom testID', () => {
    const { getByTestId } = renderWithTheme(
      <PanControl value={0} testID="custom-pan" />
    );
    expect(getByTestId('custom-pan')).toBeTruthy();
  });
});
