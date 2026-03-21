/**
 * DashboardView Tests
 *
 * Verifies:
 * - Renders children content
 * - Renders the DashboardTabBar with all tabs
 * - Forwards onTabChange to the tab bar as onTabPress
 */
import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../theme';
import { DashboardView } from '../DashboardView';
import type { DashboardTab } from '../../types';

const ALL_TABS: DashboardTab[] = [
  'myCircuits',
  'discover',
  'profile',
  'playgrounds',
];

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

describe('DashboardView', () => {
  it('renders children content', () => {
    const { getByText } = renderWithTheme(
      <DashboardView tabs={ALL_TABS} selectedTab="myCircuits">
        <Text>Hello Dashboard</Text>
      </DashboardView>
    );

    expect(getByText('Hello Dashboard')).toBeTruthy();
  });

  it('renders the DashboardTabBar with all tab labels', () => {
    const { getByText } = renderWithTheme(
      <DashboardView tabs={ALL_TABS} selectedTab="myCircuits">
        <Text>Content</Text>
      </DashboardView>
    );

    expect(getByText('MY CIRCUITS')).toBeTruthy();
    expect(getByText('DISCOVER')).toBeTruthy();
    expect(getByText('PROFILE')).toBeTruthy();
    expect(getByText('PLAYGROUNDS')).toBeTruthy();
  });

  it('marks the selected tab in the tab bar', () => {
    const { getByLabelText } = renderWithTheme(
      <DashboardView tabs={ALL_TABS} selectedTab="profile">
        <Text>Content</Text>
      </DashboardView>
    );

    expect(getByLabelText('PROFILE').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(getByLabelText('MY CIRCUITS').props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it('fires onTabChange when a tab is pressed', () => {
    const onTabChange = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <DashboardView
        tabs={ALL_TABS}
        selectedTab="myCircuits"
        onTabChange={onTabChange}
      >
        <Text>Content</Text>
      </DashboardView>
    );

    fireEvent.press(getByLabelText('PLAYGROUNDS'));
    expect(onTabChange).toHaveBeenCalledWith('playgrounds');
  });

  it('renders multiple children', () => {
    const { getByText } = renderWithTheme(
      <DashboardView tabs={ALL_TABS} selectedTab="myCircuits">
        <Text>First Child</Text>
        <Text>Second Child</Text>
      </DashboardView>
    );

    expect(getByText('First Child')).toBeTruthy();
    expect(getByText('Second Child')).toBeTruthy();
  });

  it('does not crash when onTabChange is omitted', () => {
    const { getByLabelText } = renderWithTheme(
      <DashboardView tabs={ALL_TABS} selectedTab="myCircuits">
        <Text>Content</Text>
      </DashboardView>
    );

    // Should not throw
    fireEvent.press(getByLabelText('DISCOVER'));
  });
});
