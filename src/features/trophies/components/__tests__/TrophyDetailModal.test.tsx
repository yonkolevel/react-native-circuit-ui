import React from 'react';
import { Text } from 'react-native';
import TestRenderer from 'react-test-renderer';
import { TrophyDetailModal } from '../TrophyDetailModal';

const trophy = { id: 't1', title: 'First Beat', description: 'Made your first beat', achieved: true, achievedAt: '2024-01-15T10:00:00Z' };

describe('TrophyDetailModal', () => {
  it('renders trophy title and description', () => {
    const renderer = TestRenderer.create(
      <TrophyDetailModal visible trophy={trophy} onNext={jest.fn()} onPrevious={jest.fn()} onDismiss={jest.fn()} hasNext hasPrevious />
    );
    const texts = renderer.root.findAllByType(Text).map(t => t.props.children);
    expect(texts).toContain('First Beat');
    expect(texts).toContain('Made your first beat');
  });

  it('shows achieved date', () => {
    const renderer = TestRenderer.create(
      <TrophyDetailModal visible trophy={trophy} onNext={jest.fn()} onPrevious={jest.fn()} onDismiss={jest.fn()} hasNext={false} hasPrevious={false} />
    );
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain('Achieved');
  });

  it('disables previous when hasPrevious is false', () => {
    const renderer = TestRenderer.create(
      <TrophyDetailModal visible trophy={trophy} onNext={jest.fn()} onPrevious={jest.fn()} onDismiss={jest.fn()} hasNext hasPrevious={false} />
    );
    const pressables = renderer.root.findAllByProps({ accessibilityLabel: 'Previous trophy' });
    expect(pressables[0].props.disabled).toBe(true);
  });

  it('disables next when hasNext is false', () => {
    const renderer = TestRenderer.create(
      <TrophyDetailModal visible trophy={trophy} onNext={jest.fn()} onPrevious={jest.fn()} onDismiss={jest.fn()} hasNext={false} hasPrevious />
    );
    const pressables = renderer.root.findAllByProps({ accessibilityLabel: 'Next trophy' });
    expect(pressables[0].props.disabled).toBe(true);
  });

  it('returns null when trophy is null', () => {
    const renderer = TestRenderer.create(
      <TrophyDetailModal visible trophy={null} onNext={jest.fn()} onPrevious={jest.fn()} onDismiss={jest.fn()} hasNext={false} hasPrevious={false} />
    );
    expect(renderer.toJSON()).toBeNull();
  });
});
