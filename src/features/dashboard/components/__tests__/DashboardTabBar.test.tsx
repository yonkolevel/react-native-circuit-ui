/**
 * DashboardTabBar Tests
 *
 * Verifies:
 * - Renders all 4 tab labels (MY CIRCUITS, DISCOVER, PROFILE, PLAYGROUNDS)
 * - Selected tab has accessibilityState.selected: true
 * - Non-selected tabs have accessibilityState.selected: false
 * - onTabPress fires with the correct tab value
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../theme';
import { DashboardTabBar } from '../DashboardTabBar';
import type { DashboardTab } from '../../types';

const ALL_TABS: DashboardTab[] = [
  'myCircuits',
  'discover',
  'profile',
  'playgrounds',
];

const TAB_LABELS: Record<DashboardTab, string> = {
  myCircuits: 'MY CIRCUITS',
  discover: 'DISCOVER',
  profile: 'PROFILE',
  playgrounds: 'PLAYGROUNDS',
};

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

describe('DashboardTabBar', () => {
  it('renders all 4 tab labels', () => {
    const { getByText } = renderWithTheme(
      <DashboardTabBar tabs={ALL_TABS} selectedTab="myCircuits" />
    );

    expect(getByText('MY CIRCUITS')).toBeTruthy();
    expect(getByText('DISCOVER')).toBeTruthy();
    expect(getByText('PROFILE')).toBeTruthy();
    expect(getByText('PLAYGROUNDS')).toBeTruthy();
  });

  it('marks the selected tab with accessibilityState.selected: true', () => {
    const { getByLabelText } = renderWithTheme(
      <DashboardTabBar tabs={ALL_TABS} selectedTab="discover" />
    );

    expect(getByLabelText('DISCOVER').props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it('marks non-selected tabs with accessibilityState.selected: false', () => {
    const { getByLabelText } = renderWithTheme(
      <DashboardTabBar tabs={ALL_TABS} selectedTab="discover" />
    );

    expect(getByLabelText('MY CIRCUITS').props.accessibilityState).toEqual({
      selected: false,
    });
    expect(getByLabelText('PROFILE').props.accessibilityState).toEqual({
      selected: false,
    });
    expect(getByLabelText('PLAYGROUNDS').props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it.each<DashboardTab>(ALL_TABS)(
    'fires onTabPress with "%s" when that tab is pressed',
    (tab) => {
      const onTabPress = jest.fn();
      const { getByLabelText } = renderWithTheme(
        <DashboardTabBar
          tabs={ALL_TABS}
          selectedTab="myCircuits"
          onTabPress={onTabPress}
        />
      );

      fireEvent.press(getByLabelText(TAB_LABELS[tab]));
      expect(onTabPress).toHaveBeenCalledWith(tab);
    }
  );

  it('does not crash when onTabPress is omitted', () => {
    const { getByLabelText } = renderWithTheme(
      <DashboardTabBar tabs={ALL_TABS} selectedTab="myCircuits" />
    );

    // Should not throw when pressing without a callback
    fireEvent.press(getByLabelText('DISCOVER'));
  });

  it('renders in landscape layout when isLandscape is true', () => {
    const { getByText } = renderWithTheme(
      <DashboardTabBar tabs={ALL_TABS} selectedTab="myCircuits" isLandscape />
    );

    // All tabs should still render in landscape mode
    expect(getByText('MY CIRCUITS')).toBeTruthy();
    expect(getByText('DISCOVER')).toBeTruthy();
    expect(getByText('PROFILE')).toBeTruthy();
    expect(getByText('PLAYGROUNDS')).toBeTruthy();
  });

  it('renders only the tabs provided in the tabs array', () => {
    const subsetTabs: DashboardTab[] = ['myCircuits', 'playgrounds'];
    const { getByText, queryByText } = renderWithTheme(
      <DashboardTabBar tabs={subsetTabs} selectedTab="myCircuits" />
    );

    expect(getByText('MY CIRCUITS')).toBeTruthy();
    expect(getByText('PLAYGROUNDS')).toBeTruthy();
    expect(queryByText('DISCOVER')).toBeNull();
    expect(queryByText('PROFILE')).toBeNull();
  });
});
