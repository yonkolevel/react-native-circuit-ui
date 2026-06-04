/**
 * CreateAccountView — Matches CreateAccountView.swift
 */
import { memo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../../components/Text';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { useTheme } from '../../../theme';
import { makeSpacing } from '../../../theme/spacing';

export interface CreateAccountViewProps {
  onCreateAccount?: (name: string, email: string, password: string) => void;
  onBack?: () => void;
  isLoading?: boolean;
  error?: string;
}

export const CreateAccountView = memo(function CreateAccountView({
  onCreateAccount,
  onBack,
  isLoading,
  error,
}: CreateAccountViewProps) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: colors.mcBlack2 }]}>
      <Text variant="h4" style={styles.title}>
        Create Account
      </Text>

      {error && (
        <Text variant="small" color={colors.mcPink}>
          {error}
        </Text>
      )}

      <Input
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Your name"
      />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="your@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />

      <Button
        label="Create Account"
        variant="primary"
        fullWidth
        loading={isLoading}
        onPress={() => onCreateAccount?.(name, email, password)}
      />
      {onBack && <Button label="Back" variant="outline" onPress={onBack} />}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { padding: makeSpacing(5), gap: makeSpacing(4) },
  title: { marginBottom: makeSpacing(2) },
});
