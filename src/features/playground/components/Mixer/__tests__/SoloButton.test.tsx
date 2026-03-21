/**
 * SoloButton Tests
 *
 * Verifies:
 * - Renders "S" text
 * - Active state: green background (#00FF9E)
 * - Inactive state: #333 background
 * - Fires onPress callback
 * - Correct accessibility attributes
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../../theme';
import { SoloButton } from '../SoloButton';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

describe('SoloButton', () => {
  it('renders without crashing', () => {
    const { getByTestId } = renderWithTheme(
      <SoloButton isSoloed={false} />
    );
    expect(getByTestId('solo-button')).toBeTruthy();
  });

  it('displays "S" text', () => {
    const { getByText } = renderWithTheme(
      <SoloButton isSoloed={false} />
    );
    expect(getByText('S')).toBeTruthy();
  });

  it('has green background when soloed', () => {
    const { getByTestId } = renderWithTheme(
      <SoloButton isSoloed={true} />
    );
    const button = getByTestId('solo-button');
    const flatStyle = Array.isArray(button.props.style)
      ? Object.assign({}, ...button.props.style)
      : button.props.style;
    expect(flatStyle.backgroundColor).toBe('#00FF9E');
  });

  it('has dark background when not soloed', () => {
    const { getByTestId } = renderWithTheme(
      <SoloButton isSoloed={false} />
    );
    const button = getByTestId('solo-button');
    const flatStyle = Array.isArray(button.props.style)
      ? Object.assign({}, ...button.props.style)
      : button.props.style;
    expect(flatStyle.backgroundColor).toBe('#333333');
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <SoloButton isSoloed={false} onPress={onPress} />
    );
    fireEvent.press(getByTestId('solo-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility role and label', () => {
    const { getByTestId } = renderWithTheme(
      <SoloButton isSoloed={false} />
    );
    const button = getByTestId('solo-button');
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Solo');
  });

  it('has selected accessibility state when soloed', () => {
    const { getByTestId } = renderWithTheme(
      <SoloButton isSoloed={true} />
    );
    expect(getByTestId('solo-button').props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it('has unselected accessibility state when not soloed', () => {
    const { getByTestId } = renderWithTheme(
      <SoloButton isSoloed={false} />
    );
    expect(getByTestId('solo-button').props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it('is 32×32 in size', () => {
    const { getByTestId } = renderWithTheme(
      <SoloButton isSoloed={false} />
    );
    const button = getByTestId('solo-button');
    const flatStyle = Array.isArray(button.props.style)
      ? Object.assign({}, ...button.props.style)
      : button.props.style;
    expect(flatStyle.width).toBe(32);
    expect(flatStyle.height).toBe(32);
  });

  it('accepts custom testID', () => {
    const { getByTestId } = renderWithTheme(
      <SoloButton isSoloed={false} testID="custom-solo" />
    );
    expect(getByTestId('custom-solo')).toBeTruthy();
  });
});
