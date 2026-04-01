/**
 * EditProfileView — Matches EditProfileView.swift
 *
 * Modal for editing profile: change email, change password, delete account.
 *
 * Architecture: ALL actions come from the store. No local callbacks.
 * Action names match Swift: didChangeEmail, didChangePassword, didDeleteAccount.
 *
 * iOS Reference:
 * - Modal with close button
 * - Profile header at top
 * - Change Email section (if not Apple auth)
 * - Change Password section (if not Apple auth)
 * - Delete Account section at bottom
 */
import { memo, useState } from 'react';
import { View, StyleSheet, TextInput, Alert } from 'react-native';
import { Text } from '../../../components/Text';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { ThemeProvider, useTheme } from '../../../theme';
import { makeSpacing } from '../../../theme/spacing';
import { EditProfileHeaderView } from './EditProfileHeaderView';
import type { UserProfile } from '../types';

export interface EditProfileViewProps {
  /** Whether modal is visible */
  visible: boolean;
  /** User profile data */
  profile: UserProfile;
  /** Auth provider - 'apple' hides change email/password sections */
  authProvider?: 'apple' | 'email' | 'google';
  /** Is any operation in progress */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Success message to display */
  successMessage?: string | null;
  /** Called when user requests email change — store action */
  didChangeEmail?: (newEmail: string, password: string) => Promise<boolean>;
  /** Called when user requests password change — store action */
  didChangePassword?: (
    oldPassword: string,
    newPassword: string
  ) => Promise<boolean>;
  /** Called when user requests account deletion — store action */
  didDeleteAccount?: () => Promise<boolean>;
  /** Called when modal closes — store action */
  didDismiss: () => void;
  /** Test ID for testing */
  testID?: string;
}

export const EditProfileView = memo(function EditProfileView({
  visible,
  profile,
  authProvider = 'email',
  isLoading = false,
  error,
  successMessage,
  didChangeEmail,
  didChangePassword,
  didDeleteAccount,
  didDismiss,
  testID,
}: EditProfileViewProps) {
  // Wrap in ThemeProvider to ensure theme context is available in Modal
  return (
    <ThemeProvider initialMode="dark">
      <EditProfileViewContent
        visible={visible}
        profile={profile}
        authProvider={authProvider}
        isLoading={isLoading}
        error={error}
        successMessage={successMessage}
        didChangeEmail={didChangeEmail}
        didChangePassword={didChangePassword}
        didDeleteAccount={didDeleteAccount}
        didDismiss={didDismiss}
        testID={testID}
      />
    </ThemeProvider>
  );
});

function EditProfileViewContent({
  visible,
  profile,
  authProvider = 'email',
  isLoading = false,
  error,
  successMessage,
  didChangeEmail,
  didChangePassword,
  didDeleteAccount,
  didDismiss,
  testID,
}: EditProfileViewProps) {
  const { colors, isDark } = useTheme();
  const secondaryTextColor = isDark ? colors.mcWhite2 : colors.mcBlack2;
  const bgColor = isDark ? colors.mcBlack2 : colors.mcWhite;

  // Email change state (form only — not business state)
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  // Password change state (form only — not business state)
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const isSocialProvider =
    authProvider === 'apple' || authProvider === 'google';

  // Validation helpers (pure functions — not store actions)
  const validateEmail = (): boolean => {
    if (!newEmail.trim()) return false;
    if (!emailPassword.trim()) return false;
    if (newEmail === profile.email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(newEmail);
  };

  const validatePassword = (): boolean => {
    if (!oldPassword.trim() || !newPassword.trim()) return false;
    if (newPassword === oldPassword) return false;
    if (newPassword.length < 8) return false;
    return true;
  };

  const handleChangeEmail = async () => {
    if (!validateEmail() || !didChangeEmail) return;
    await didChangeEmail(newEmail, emailPassword);
    setNewEmail('');
    setEmailPassword('');
  };

  const handleChangePassword = async () => {
    if (!validatePassword() || !didChangePassword) return;
    await didChangePassword(oldPassword, newPassword);
    setOldPassword('');
    setNewPassword('');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Deleting your account will result in the permanent loss of your learning progress and trophies! Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            if (didDeleteAccount) {
              await didDeleteAccount();
            }
          },
        },
      ]
    );
  };

  const canSubmitEmail = validateEmail() && !isLoading;
  const canSubmitPassword = validatePassword() && !isLoading;

  return (
    <Modal visible={visible} onClose={didDismiss} testID={testID}>
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Profile Header */}
        <EditProfileHeaderView profile={profile} />

        {/* Change Email Section (hidden for social auth) */}
        {!isSocialProvider && (
          <View style={styles.section}>
            <Text
              variant="h5"
              style={[styles.sectionTitle, { color: secondaryTextColor }]}
            >
              Change Email
            </Text>

            <LabeledInput
              label="New email"
              placeholder="E.g. johnsmith@mail.com"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <LabeledInput
              label="Current Password"
              placeholder="Your Password"
              value={emailPassword}
              onChangeText={setEmailPassword}
              secureTextEntry
            />

            <View style={styles.actionRow}>
              {error && (
                <Text variant="small" style={{ color: colors.mcPink, flex: 1 }}>
                  {error}
                </Text>
              )}
              {successMessage && (
                <Text
                  variant="small"
                  style={{ color: colors.mcGreen, flex: 1 }}
                >
                  {successMessage}
                </Text>
              )}
              <Button
                variant="secondary"
                label="Save"
                onPress={handleChangeEmail}
                disabled={!canSubmitEmail}
              />
            </View>
          </View>
        )}

        {/* Change Password Section (hidden for social auth) */}
        {!isSocialProvider && (
          <View style={styles.section}>
            <Text
              variant="h5"
              style={[styles.sectionTitle, { color: secondaryTextColor }]}
            >
              Change Password
            </Text>

            <LabeledInput
              label="Current Password"
              placeholder="Your old password"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
            />

            <LabeledInput
              label="New Password"
              placeholder="Your new desired password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <View style={styles.actionRow}>
              <Button
                variant="secondary"
                label="Save"
                onPress={handleChangePassword}
                disabled={!canSubmitPassword}
              />
            </View>
          </View>
        )}

        {/* Delete Account Section */}
        <View style={styles.deleteSection}>
          <Button
            variant="outline"
            label="Delete Account"
            onPress={handleDeleteAccount}
            disabled={isLoading}
          />
        </View>
      </View>
    </Modal>
  );
}

/** Helper component for labeled input fields */
interface LabeledInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
}

const LabeledInput = memo(function LabeledInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: LabeledInputProps) {
  const { colors, isDark } = useTheme();
  const textColor = isDark ? colors.mcWhite : colors.mcBlack;
  const placeholderColor = isDark ? colors.mcWhite3 : colors.mcBlack3;
  const borderColor = isDark ? colors.mcWhite3 : colors.mcBlack3;

  return (
    <View style={labeledInputStyles.container}>
      <Text
        variant="small"
        style={[labeledInputStyles.label, { color: placeholderColor }]}
      >
        {label}
      </Text>
      <TextInput
        style={[labeledInputStyles.input, { color: textColor, borderColor }]}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: makeSpacing(5),
    padding: makeSpacing(5),
    minWidth: 300,
    borderRadius: 8,
  },
  section: {
    gap: makeSpacing(4),
  },
  sectionTitle: {
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: makeSpacing(3),
  },
  deleteSection: {
    marginTop: 'auto',
    paddingTop: makeSpacing(4),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
});

const labeledInputStyles = StyleSheet.create({
  container: {
    gap: makeSpacing(2),
  },
  label: {
    fontWeight: '600',
  },
  input: {
    height: 36,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: makeSpacing(4),
  },
});
