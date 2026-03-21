/**
 * WelcomeView — Matches WelcomeView.swift
 *
 * Full-screen welcome with logo, tagline, Get Started + Sign In buttons.
 * Background: mcBlack with waveform decorations.
 */
import { memo } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { Text } from '../../../components/Text';
import { Button } from '../../../components/Button';
import { useTheme } from '../../../theme';
import { makeSpacing } from '../../../theme/spacing';

export interface WelcomeViewProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
  backgroundImage?: string;
}

export const WelcomeView = memo(function WelcomeView({
  onGetStarted, onSignIn, backgroundImage,
}: WelcomeViewProps) {
  const { colors } = useTheme();

  const content = (
    <View style={[styles.container, { backgroundColor: colors.mcBlack }]}>
      <View style={styles.spacer} />

      <View style={styles.content}>
        <Text variant="h1" center color={colors.mcWhite}>
          midicircuit
        </Text>
        <Text variant="label" center color={colors.mcWhite3} style={styles.tagline}>
          Learn Create Share
        </Text>
      </View>

      <View style={styles.buttons}>
        <Button
          label="Get Started"
          variant="primary"
          fullWidth
          onPress={onGetStarted}
        />
        <Button
          label="Sign In"
          variant="secondary"
          fullWidth
          onPress={onSignIn}
        />
      </View>

      <View style={styles.bottomSpacer} />
    </View>
  );

  if (backgroundImage) {
    return (
      <ImageBackground source={{ uri: backgroundImage }} style={styles.bg}>
        {content}
      </ImageBackground>
    );
  }

  return content;
});

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1, paddingHorizontal: makeSpacing(5) },
  spacer: { flex: 2 },
  content: { alignItems: 'center', gap: makeSpacing(2) },
  tagline: { letterSpacing: 4 },
  buttons: { gap: makeSpacing(3), paddingTop: makeSpacing(10) },
  bottomSpacer: { flex: 1 },
});
