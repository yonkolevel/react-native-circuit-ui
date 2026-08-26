import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Button } from '../Button';
import { ProgressBar } from '../ProgressBar';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { makeSpacing } from '../../theme/spacing';

export type MissionMode = 'Learn' | 'Practice' | 'Recall' | 'Creative';

export interface MissionProgress {
  current: number;
  total: number;
  label?: string;
}

export interface MissionRailProps {
  mode: MissionMode;
  title: string;
  instructions: string;
  progress?: MissionProgress;
  feedback?: readonly string[];
  readOnly?: boolean;
  disabled?: boolean;
  helpDisabled?: boolean;
  checkDisabled?: boolean;
  continueDisabled?: boolean;
  onHelp?: () => void;
  onCheck?: () => void;
  onContinue?: () => void;
  a11yId?: string;
  feedbackA11yId?: string;
  helpA11yId?: string;
  checkA11yId?: string;
  continueA11yId?: string;
  style?: StyleProp<ViewStyle>;
}

export const MissionRail = memo(function MissionRail({
  mode,
  title,
  instructions,
  progress,
  feedback = [],
  readOnly = false,
  disabled = false,
  helpDisabled = false,
  checkDisabled = false,
  continueDisabled = false,
  onHelp,
  onCheck,
  onContinue,
  a11yId = 'mission-rail',
  feedbackA11yId = `${a11yId}-feedback`,
  helpA11yId = `${a11yId}-help`,
  checkA11yId = `${a11yId}-check`,
  continueA11yId = `${a11yId}-continue`,
  style,
}: MissionRailProps) {
  const { colors } = useTheme();
  const progressValue = progress
    ? Math.min(
        100,
        Math.max(0, (progress.current / Math.max(1, progress.total)) * 100)
      )
    : 0;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.mcBlack2 }, style]}
      accessibilityLabel={`${mode} mission${readOnly ? ', read only' : ''}`}
      accessibilityState={{ disabled: disabled || undefined }}
      testID={a11yId}
    >
      <Text variant="small" color={colors.mcOrange} uppercase>
        {mode}
      </Text>
      <Text variant="h4" color={colors.mcWhite}>
        {title}
      </Text>
      <Text variant="body" color={colors.mcWhite2}>
        {instructions}
      </Text>

      {progress && (
        <View style={styles.progress}>
          <ProgressBar
            value={progressValue}
            animated={false}
            accessibilityLabel={progress.label ?? 'Mission progress'}
            a11yId={`${a11yId}-progress`}
          />
          <Text variant="small" color={colors.mcWhite3}>
            {progress.label ?? `${progress.current} of ${progress.total}`}
          </Text>
        </View>
      )}

      {feedback.length > 0 && (
        <View
          accessibilityRole="alert"
          accessibilityLabel={`Check feedback: ${feedback.join('. ')}`}
          testID={feedbackA11yId}
          style={[styles.feedback, { borderColor: colors.mcPink }]}
        >
          {feedback.map((item, index) => (
            <Text
              key={`${item}-${index}`}
              variant="small"
              color={colors.mcWhite}
            >
              • {item}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        {onHelp && (
          <Button
            label="Help"
            variant="secondary"
            onPress={onHelp}
            disabled={disabled || helpDisabled}
            a11yId={helpA11yId}
          />
        )}
        {onCheck && (
          <Button
            label="Check"
            variant="secondary"
            onPress={onCheck}
            disabled={disabled || checkDisabled}
            a11yId={checkA11yId}
          />
        )}
        {onContinue && (
          <Button
            label="Continue"
            onPress={onContinue}
            disabled={disabled || continueDisabled}
            a11yId={continueA11yId}
          />
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: makeSpacing(4),
    gap: makeSpacing(2),
  },
  progress: { gap: makeSpacing(1) },
  feedback: {
    borderLeftWidth: 3,
    paddingLeft: makeSpacing(2),
    gap: makeSpacing(1),
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: makeSpacing(2),
  },
});
