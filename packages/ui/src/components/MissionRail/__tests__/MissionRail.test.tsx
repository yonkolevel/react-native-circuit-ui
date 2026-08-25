import { render } from '@testing-library/react-native';
import { MissionRail, missionRailColors } from '../MissionRail';

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
});
