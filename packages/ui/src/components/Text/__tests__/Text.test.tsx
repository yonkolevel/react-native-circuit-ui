import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme';
import { typography } from '../../../theme/typography';
import { Text } from '../Text';

function renderText(ui: React.ReactElement) {
  return render(<ThemeProvider initialMode="dark">{ui}</ThemeProvider>);
}

const flat = (node: { props: { style?: unknown } }) =>
  StyleSheet.flatten(node.props.style as never) as {
    fontSize?: number;
    lineHeight?: number;
  };

describe('Text line box', () => {
  it('never renders a line box shorter than the font size', () => {
    // `body` bakes in lineHeight 21. Blowing fontSize up to 28 through `style`
    // used to keep that 21pt box and clip the tops of the glyphs.
    const { getByText } = renderText(
      <Text style={{ fontSize: 28 }}>🏆 Trophy Earned!</Text>
    );
    const style = flat(getByText('🏆 Trophy Earned!'));
    expect(style.fontSize).toBe(28);
    expect(style.lineHeight).toBeGreaterThanOrEqual(28);
    // The variant's own ratio is preserved: body is 21/14 = 1.5.
    expect(style.lineHeight).toBe(42);
  });

  it('respects an explicit lineHeight override', () => {
    const { getByText } = renderText(
      <Text style={{ fontSize: 28, lineHeight: 30 }}>Explicit</Text>
    );
    expect(flat(getByText('Explicit')).lineHeight).toBe(30);
  });

  it('leaves the variant alone when the override fits', () => {
    const { getByText } = renderText(
      <Text style={{ fontSize: 12 }}>Small</Text>
    );
    // 12pt inside body's 21pt box is loose, not clipped — nothing to correct.
    expect(flat(getByText('Small')).lineHeight).toBe(
      typography.body.lineHeight
    );
  });

  it('leaves an unstyled variant untouched', () => {
    const { getByText } = renderText(<Text variant="h4">Heading</Text>);
    const style = flat(getByText('Heading'));
    expect(style.fontSize).toBe(typography.h4.fontSize);
    expect(style.lineHeight).toBe(typography.h4.lineHeight);
  });
});
