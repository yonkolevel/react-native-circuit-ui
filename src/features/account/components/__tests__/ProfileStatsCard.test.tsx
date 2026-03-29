import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../theme';
import { ProfileStatsCard } from '../ProfileStatsCard';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

describe('ProfileStatsCard', () => {
  it('matches snapshot (dark mode)', () => {
    const tree = renderWithTheme(<ProfileStatsCard title="Circuits" value="5" />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot (light mode)', () => {
    const tree = render(
      <ThemeProvider initialMode="light">
        <ProfileStatsCard title="Trophies" value="12" />
      </ThemeProvider>
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('displays title in uppercase', () => {
    const { getByText } = renderWithTheme(<ProfileStatsCard title="circuits" value="3" />);
    expect(getByText('CIRCUITS')).toBeTruthy();
  });

  it('displays value correctly', () => {
    const { getByText } = renderWithTheme(<ProfileStatsCard title="Lessons" value="42" />);
    expect(getByText('42')).toBeTruthy();
  });

  it('has correct accessibility label', () => {
    const { getByLabelText } = renderWithTheme(
      <ProfileStatsCard title="Trophies" value="7" testID="trophy-stat" />
    );
    expect(getByLabelText('Trophies: 7')).toBeTruthy();
  });

  it('applies testID', () => {
    const { getByTestId } = renderWithTheme(
      <ProfileStatsCard title="Circuits" value="10" testID="circuits-stat" />
    );
    expect(getByTestId('circuits-stat')).toBeTruthy();
  });

  it('renders with zero value', () => {
    const { getByText } = renderWithTheme(<ProfileStatsCard title="Lessons" value="0" />);
    expect(getByText('0')).toBeTruthy();
  });

  it('renders with large value', () => {
    const { getByText } = renderWithTheme(<ProfileStatsCard title="Points" value="10000" />);
    expect(getByText('10000')).toBeTruthy();
  });
});