import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../../../components/Text';
import { Button } from '../../../../components/Button';
import { useTheme } from '../../../../theme';
import { makeSpacing } from '../../../../theme/spacing';

export interface OnboardingSheetProps {
  title: string;
  body: string;
  buttonTitle: string;
  onDismiss?: () => void;
}

export const OnboardingSheet = memo(function OnboardingSheet({
  title,
  body,
  buttonTitle,
  onDismiss,
}: OnboardingSheetProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.container, { backgroundColor: colors.mcBlack3 }]}
      accessibilityLabel={title}
    >
      <Text variant="h5" style={styles.title}>
        {title}
      </Text>
      <Text variant="body" color={colors.mcWhite2} style={styles.body}>
        {body}
      </Text>
      <Button
        label={buttonTitle}
        variant="primary"
        onPress={onDismiss}
        fullWidth
      />
    </View>
  );
});

export interface OnboardingCelebrationProps {
  onComplete?: () => void;
}

export const OnboardingCelebration = memo(function OnboardingCelebration({
  onComplete,
}: OnboardingCelebrationProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.celebration, { backgroundColor: colors.mcBlack2 }]}
      accessibilityLabel="Congratulations"
    >
      <Text variant="h2" center>
        🎉
      </Text>
      <Text variant="h4" center style={styles.celebrationTitle}>
        Great job!
      </Text>
      <Text variant="body" center color={colors.mcWhite2}>
        You've completed the tutorial.
      </Text>
      <Button
        label="Continue"
        variant="primary"
        onPress={onComplete}
        style={styles.celebrationBtn}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { padding: makeSpacing(5), borderRadius: 12, gap: makeSpacing(3) },
  title: { marginBottom: 4 },
  body: { lineHeight: 22 },
  celebration: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: makeSpacing(8),
    gap: makeSpacing(4),
  },
  celebrationTitle: { marginTop: makeSpacing(2) },
  celebrationBtn: { marginTop: makeSpacing(4), minWidth: 200 },
});
