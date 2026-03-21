/**
 * SignInView — Matches SignInView.swift
 * Email + password fields + Sign In button + Apple Sign In
 */
import { memo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../../components/Text';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { useTheme } from '../../../theme';
import { makeSpacing } from '../../../theme/spacing';

export interface SignInViewProps {
  onSignIn?: (email: string, password: string) => void;
  onSignInWithApple?: () => void;
  onBack?: () => void;
  isLoading?: boolean;
  error?: string;
}

export const SignInView = memo(function SignInView({
  onSignIn, onSignInWithApple, onBack, isLoading, error,
}: SignInViewProps) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="h4" style={styles.title}>Sign In</Text>

      {error && <Text variant="small" color={colors.error} style={styles.error}>{error}</Text>}

      <Input label="Email" value={email} onChangeText={setEmail} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" />
      <Input label="Password" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />

      <Button label="Sign In" variant="primary" fullWidth loading={isLoading} onPress={() => onSignIn?.(email, password)} />

      <Button label="Sign in with Apple" variant="normal" fullWidth onPress={onSignInWithApple} />

      {onBack && <Button label="Back" variant="outline" onPress={onBack} />}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { padding: makeSpacing(5), gap: makeSpacing(4) },
  title: { marginBottom: makeSpacing(2) },
  error: { marginBottom: makeSpacing(1) },
});
