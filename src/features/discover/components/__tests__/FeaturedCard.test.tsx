/**
 * FeaturedCard Tests
 *
 * Verifies:
 * - Renders without crashing
 * - Displays title text
 * - Displays description text
 * - Displays "LEARN MORE" button text
 * - onPress fires when card is pressed
 * - accessibilityRole is "button"
 * - accessibilityLabel matches title
 * - Renders without onPress (optional prop)
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../theme';
import { FeaturedCard } from '../FeaturedCard';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

const defaultProps = {
  title: 'Summer Vibes',
  description: 'A cool summer beat pack',
  imageUrl: 'https://example.com/hero.png',
};

describe('FeaturedCard', () => {
  it('renders without crashing', () => {
    const { toJSON } = renderWithTheme(<FeaturedCard {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays the title', () => {
    const { getByText } = renderWithTheme(<FeaturedCard {...defaultProps} />);
    expect(getByText('Summer Vibes')).toBeTruthy();
  });

  it('displays the description', () => {
    const { getByText } = renderWithTheme(<FeaturedCard {...defaultProps} />);
    expect(getByText('A cool summer beat pack')).toBeTruthy();
  });

  it('displays "LEARN MORE" text', () => {
    const { getByText } = renderWithTheme(<FeaturedCard {...defaultProps} />);
    expect(getByText('LEARN MORE')).toBeTruthy();
  });

  it('calls onPress when the card is pressed', () => {
    const onPress = jest.fn();
    const { getByRole } = renderWithTheme(
      <FeaturedCard {...defaultProps} onPress={onPress} />
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has accessibilityRole "button"', () => {
    const { getByRole } = renderWithTheme(<FeaturedCard {...defaultProps} />);
    expect(getByRole('button')).toBeTruthy();
  });

  it('has accessibilityLabel matching the title', () => {
    const { getByLabelText } = renderWithTheme(
      <FeaturedCard {...defaultProps} />
    );
    expect(getByLabelText('Summer Vibes')).toBeTruthy();
  });

  it('renders without onPress (optional prop)', () => {
    const { getByText } = renderWithTheme(
      <FeaturedCard
        title="No Handler"
        description="Testing optional onPress"
        imageUrl="https://example.com/img.png"
      />
    );
    expect(getByText('No Handler')).toBeTruthy();
    expect(getByText('LEARN MORE')).toBeTruthy();
  });

  it('accepts a custom textColor', () => {
    const { getByText } = renderWithTheme(
      <FeaturedCard {...defaultProps} textColor="#FF0000" />
    );
    // Title and description should still render with custom color
    expect(getByText('Summer Vibes')).toBeTruthy();
    expect(getByText('A cool summer beat pack')).toBeTruthy();
  });
});
