import React from 'react';
import { Text } from 'react-native';
import TestRenderer from 'react-test-renderer';
import { TrophyAwardedModal } from '../TrophyAwardedModal';

const trophy = { id: 't1', title: 'Melody Master', description: 'Completed all melody lessons', achieved: true };

describe('TrophyAwardedModal', () => {
  it('renders celebration header', () => {
    const renderer = TestRenderer.create(
      <TrophyAwardedModal visible trophy={trophy} onClose={jest.fn()} hasNext={false} />
    );
    const texts = renderer.root.findAllByType(Text).map(t => t.props.children);
    expect(texts).toContain('🏆 Trophy Earned!');
  });

  it('renders trophy title and description', () => {
    const renderer = TestRenderer.create(
      <TrophyAwardedModal visible trophy={trophy} onClose={jest.fn()} hasNext={false} />
    );
    const texts = renderer.root.findAllByType(Text).map(t => t.props.children);
    expect(texts).toContain('Melody Master');
    expect(texts).toContain('Completed all melody lessons');
  });

  it('shows Next button when hasNext', () => {
    const renderer = TestRenderer.create(
      <TrophyAwardedModal visible trophy={trophy} onClose={jest.fn()} onNext={jest.fn()} hasNext />
    );
    const nextBtn = renderer.root.findAllByProps({ accessibilityLabel: 'Next trophy' });
    expect(nextBtn.length).toBeGreaterThan(0);
  });

  it('shows only Close when no next', () => {
    const renderer = TestRenderer.create(
      <TrophyAwardedModal visible trophy={trophy} onClose={jest.fn()} hasNext={false} />
    );
    const closeBtn = renderer.root.findAllByProps({ accessibilityLabel: 'Close' });
    expect(closeBtn.length).toBeGreaterThan(0);
    const nextBtn = renderer.root.findAllByProps({ accessibilityLabel: 'Next trophy' });
    expect(nextBtn.length).toBe(0);
  });

  it('returns null when trophy is null', () => {
    const renderer = TestRenderer.create(
      <TrophyAwardedModal visible trophy={null} onClose={jest.fn()} hasNext={false} />
    );
    expect(renderer.toJSON()).toBeNull();
  });
});
