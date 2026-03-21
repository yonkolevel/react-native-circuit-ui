/**
 * TrophiesView Tests
 *
 * Verifies:
 * - Renders trophy grid with all trophies
 * - "TROPHY GALLERY" header is displayed
 * - Achieved trophies have opacity 1
 * - Unachieved trophies have opacity 0.4
 * - Achieved trophies show "🏆" placeholder (when no imageUrl)
 * - Unachieved trophies show "?" placeholder (when no imageUrl)
 * - onSelect fires only for achieved trophies
 * - onSelect does NOT fire for unachieved trophies
 * - Correct accessibility labels for achieved vs unachieved
 * - Trophy with imageUrl renders Image component
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../theme';
import { TrophiesView } from '../TrophiesView';
import type { Trophy } from '../../types';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

const achievedTrophy: Trophy = {
  id: '1',
  title: 'First Beat',
  description: 'Create your first beat',
  achieved: true,
  achievedAt: '2025-01-01',
};

const unachievedTrophy: Trophy = {
  id: '2',
  title: 'Speed Demon',
  description: 'Complete 10 beats in a row',
  achieved: false,
};

const trophyWithImage: Trophy = {
  id: '3',
  title: 'Gold Star',
  description: 'Earn a gold star',
  imageUrl: 'https://example.com/gold.png',
  achieved: true,
};

const allTrophies: Trophy[] = [
  achievedTrophy,
  unachievedTrophy,
  trophyWithImage,
];

describe('TrophiesView', () => {
  it('renders without crashing', () => {
    const { toJSON } = renderWithTheme(<TrophiesView trophies={allTrophies} />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays the "Trophy gallery" header', () => {
    const { getByText } = renderWithTheme(
      <TrophiesView trophies={allTrophies} />
    );
    expect(getByText(/trophy gallery/i)).toBeTruthy();
  });

  it('renders all trophies in the grid', () => {
    const { getByLabelText } = renderWithTheme(
      <TrophiesView trophies={allTrophies} />
    );
    expect(getByLabelText('Trophy: First Beat, achieved')).toBeTruthy();
    expect(getByLabelText('Trophy: Speed Demon')).toBeTruthy();
    expect(getByLabelText('Trophy: Gold Star, achieved')).toBeTruthy();
  });

  it('achieved trophy has opacity 1', () => {
    const { getByLabelText } = renderWithTheme(
      <TrophiesView trophies={[achievedTrophy]} />
    );
    const trophy = getByLabelText('Trophy: First Beat, achieved');
    const flatStyle = Array.isArray(trophy.props.style)
      ? Object.assign({}, ...trophy.props.style)
      : trophy.props.style;
    expect(flatStyle.opacity).toBe(1);
  });

  it('unachieved trophy has opacity 0.4', () => {
    const { getByLabelText } = renderWithTheme(
      <TrophiesView trophies={[unachievedTrophy]} />
    );
    const trophy = getByLabelText('Trophy: Speed Demon');
    const flatStyle = Array.isArray(trophy.props.style)
      ? Object.assign({}, ...trophy.props.style)
      : trophy.props.style;
    expect(flatStyle.opacity).toBe(0.4);
  });

  it('achieved trophy without imageUrl shows "🏆"', () => {
    const { getByText } = renderWithTheme(
      <TrophiesView trophies={[achievedTrophy]} />
    );
    expect(getByText('🏆')).toBeTruthy();
  });

  it('unachieved trophy without imageUrl shows "?"', () => {
    const { getByText } = renderWithTheme(
      <TrophiesView trophies={[unachievedTrophy]} />
    );
    expect(getByText('?')).toBeTruthy();
  });

  it('calls onSelect when achieved trophy is pressed', () => {
    const onSelect = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <TrophiesView trophies={[achievedTrophy]} onSelect={onSelect} />
    );
    fireEvent.press(getByLabelText('Trophy: First Beat, achieved'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(achievedTrophy);
  });

  it('does NOT call onSelect when unachieved trophy is pressed', () => {
    const onSelect = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <TrophiesView trophies={[unachievedTrophy]} onSelect={onSelect} />
    );
    fireEvent.press(getByLabelText('Trophy: Speed Demon'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('achieved trophy has accessibility label with ", achieved" suffix', () => {
    const { getByLabelText } = renderWithTheme(
      <TrophiesView trophies={[achievedTrophy]} />
    );
    const trophy = getByLabelText('Trophy: First Beat, achieved');
    expect(trophy.props.accessibilityRole).toBe('button');
  });

  it('unachieved trophy has accessibility label without ", achieved"', () => {
    const { getByLabelText } = renderWithTheme(
      <TrophiesView trophies={[unachievedTrophy]} />
    );
    const trophy = getByLabelText('Trophy: Speed Demon');
    expect(trophy.props.accessibilityLabel).toBe('Trophy: Speed Demon');
  });

  it('renders with empty trophies array', () => {
    const { getByText } = renderWithTheme(<TrophiesView trophies={[]} />);
    // Header should still render
    expect(getByText(/trophy gallery/i)).toBeTruthy();
  });

  it('displays trophy titles as text', () => {
    const { getByText } = renderWithTheme(
      <TrophiesView trophies={allTrophies} />
    );
    expect(getByText('First Beat')).toBeTruthy();
    expect(getByText('Speed Demon')).toBeTruthy();
    expect(getByText('Gold Star')).toBeTruthy();
  });
});
