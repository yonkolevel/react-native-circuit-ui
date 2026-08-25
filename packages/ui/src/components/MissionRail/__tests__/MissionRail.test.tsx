import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { MissionRail, missionRailColors } from '../MissionRail';

const hidden = { includeHiddenElements: true } as const;

describe('MissionRail', () => {
  it('uses a cool practice gradient', () => {
    expect(missionRailColors('practice')).toEqual(['#00FF9E', '#2496FF']);
  });

  it('uses a warm challenge gradient', () => {
    expect(missionRailColors('challenge')).toEqual(['#FF5C24', '#FF245B']);
  });

  it('labels the mode rail accessibly', () => {
    const screen = render(
      <MissionRail mode="challenge" label="Challenge" testID="missionRail" />
    );
    expect(screen.getByLabelText('Challenge')).toBeTruthy();
  });

  it('announces the mode once — the rail owns the label, not the text node', () => {
    const screen = render(
      <MissionRail mode="practice" label="Practice" testID="missionRail" />
    );
    expect(screen.getByTestId('missionRail', hidden).props.accessible).toBe(
      true
    );
    expect(
      screen.getByText('Practice', hidden).props.importantForAccessibility
    ).toBe('no-hide-descendants');
  });

  it('stacks the label under the rule instead of overlaying the gradient', () => {
    const screen = render(
      <MissionRail mode="practice" label="Practice" testID="missionRail" />
    );
    const style = StyleSheet.flatten(
      screen.getByText('Practice', hidden).props.style
    );
    expect(style.position).toBeUndefined();
    expect(style.marginTop).toBeGreaterThan(0);
  });

  it('fills the rule to the step progress when given one', () => {
    const screen = render(
      <MissionRail
        mode="practice"
        label="Practice"
        progress={0.25}
        testID="missionRail"
      />
    );
    // The width has to sit on the painted element itself — a sized wrapper
    // around it does not clip, so the rule would read full at every value.
    expect(widthOfFill(screen)).toBe('25%');
  });

  it('shows an empty rule at zero progress rather than a full one', () => {
    const screen = render(
      <MissionRail
        mode="practice"
        label="Practice"
        progress={0}
        testID="missionRail"
      />
    );
    expect(widthOfFill(screen)).toBe('0%');
  });

  it('keeps both gradient colors when Expo is unavailable', () => {
    const screen = render(
      <MissionRail mode="challenge" label="Challenge" testID="missionRail" />
    );
    const backgrounds = screen
      .getByTestId('missionRail', hidden)
      .findAll((node) => StyleSheet.flatten(node.props.style)?.backgroundColor)
      .map((node) => StyleSheet.flatten(node.props.style).backgroundColor);

    expect(backgrounds).toEqual(expect.arrayContaining(['#FF5C24', '#FF245B']));
  });

  it('runs the rule full width when no progress is given', () => {
    const screen = render(
      <MissionRail mode="challenge" label="Challenge" testID="missionRail" />
    );
    const rule = screen.getByTestId('missionRail', hidden).children[0] as any;
    expect(
      StyleSheet.flatten(rule.props.style).backgroundColor
    ).toBeUndefined();
  });
});

/** Width of the rail's painted rule, whichever element ends up painting it. */
function widthOfFill(screen: ReturnType<typeof render>): string | undefined {
  const rail = screen.getByTestId('missionRail', hidden);
  // The track and the fill are both 3pt tall; the fill is the deeper of the two.
  const painted = rail
    .findAll((node) => StyleSheet.flatten(node.props.style)?.height === 3)
    .pop();
  return StyleSheet.flatten(painted?.props.style)?.width;
}
