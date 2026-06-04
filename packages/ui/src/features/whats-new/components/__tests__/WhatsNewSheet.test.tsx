/**
 * Tests for WhatsNewSheet — auto-presenting modal wrapper.
 */
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { WhatsNewSheet } from '../WhatsNewSheet';
import type { WhatsNew } from '../../types';

const makeWhatsNew = (): WhatsNew => ({
  version: { major: 2, minor: 0, patch: 0 },
  features: [
    {
      image: { type: 'systemName', name: 'star.fill' },
      title: 'New Feature',
      subtitle: 'Description of the feature.',
    },
  ],
});

describe('WhatsNewSheet', () => {
  it('renders children', () => {
    const { getByText } = render(
      <WhatsNewSheet whatsNew={null} onDismiss={jest.fn()}>
        <Text>App Content</Text>
      </WhatsNewSheet>
    );
    expect(getByText('App Content')).toBeTruthy();
  });

  it('shows WhatsNewView when whatsNew is provided', () => {
    const { getByTestId, getByText } = render(
      <WhatsNewSheet whatsNew={makeWhatsNew()} onDismiss={jest.fn()}>
        <Text>App Content</Text>
      </WhatsNewSheet>
    );
    expect(getByTestId('whats-new-view')).toBeTruthy();
    expect(getByText('New Feature')).toBeTruthy();
  });

  it('hides WhatsNewView when whatsNew is null', () => {
    const { queryByTestId } = render(
      <WhatsNewSheet whatsNew={null} onDismiss={jest.fn()}>
        <Text>App Content</Text>
      </WhatsNewSheet>
    );
    expect(queryByTestId('whats-new-view')).toBeNull();
  });

  it('renders children alongside the modal', () => {
    const { getByText } = render(
      <WhatsNewSheet whatsNew={makeWhatsNew()} onDismiss={jest.fn()}>
        <Text>Behind the sheet</Text>
      </WhatsNewSheet>
    );
    expect(getByText('Behind the sheet')).toBeTruthy();
    expect(getByText('New Feature')).toBeTruthy();
  });
});
