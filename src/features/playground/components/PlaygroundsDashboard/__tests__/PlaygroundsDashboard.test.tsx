import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../../theme';
import { PlaygroundsDashboard } from '../PlaygroundsDashboard';
import { createMockPlaygroundsList, resetMockIds } from '../../../mocks';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

beforeEach(() => resetMockIds());

describe('PlaygroundsDashboard snapshots', () => {
  it('matches snapshot with playgrounds', () => {
    const playgrounds = createMockPlaygroundsList(3);
    const tree = renderWithTheme(<PlaygroundsDashboard playgrounds={playgrounds} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot empty state', () => {
    const tree = renderWithTheme(<PlaygroundsDashboard playgrounds={[]} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

describe('PlaygroundsDashboard behavior', () => {
  it('calls onSelect when tapping a playground', () => {
    const onSelect = jest.fn();
    const playgrounds = createMockPlaygroundsList(2);
    const { getByText } = renderWithTheme(
      <PlaygroundsDashboard playgrounds={playgrounds} onSelect={onSelect} />
    );
    fireEvent.press(getByText('My First Beat'));
    expect(onSelect).toHaveBeenCalled();
  });

  it('calls onCreate when tapping + New', () => {
    const onCreate = jest.fn();
    const playgrounds = createMockPlaygroundsList(1);
    const { getByText } = renderWithTheme(
      <PlaygroundsDashboard playgrounds={playgrounds} onCreate={onCreate} />
    );
    fireEvent.press(getByText('+ New'));
    expect(onCreate).toHaveBeenCalled();
  });
});
