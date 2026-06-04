/**
 * EditProfileHeaderView — Matches EditProfileHeaderView.swift
 *
 * Header showing profile picture, name and email in the EditProfile modal.
 *
 * iOS Reference:
 * - Profile image: 80x80 circle with shadow
 * - HStack: image + VStack(name, email)
 * - Height: 100pt
 */
import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../../components/Text';
import { Avatar } from '../../../components/Avatar';
import { useTheme } from '../../../theme';
import { makeSpacing } from '../../../theme/spacing';
import type { UserProfile } from '../types';

export interface EditProfileHeaderViewProps {
  /** User profile data */
  profile: UserProfile;
  /** Test ID for testing */
  testID?: string;
}

export const EditProfileHeaderView = memo(function EditProfileHeaderView({
  profile,
  testID,
}: EditProfileHeaderViewProps) {
  const { colors, isDark } = useTheme();
  const primaryTextColor = isDark ? colors.mcWhite : colors.mcBlack;
  const secondaryTextColor = isDark ? colors.mcWhite2 : colors.mcBlack2;

  return (
    <View style={styles.container} testID={testID}>
      <Avatar size={80} imageUrl={profile.pictureUrl} />

      <View style={styles.info}>
        <Text variant="h5" style={[styles.name, { color: primaryTextColor }]}>
          {profile.name}
        </Text>
        <Text
          variant="small"
          style={[styles.email, { color: secondaryTextColor }]}
        >
          {profile.email}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: makeSpacing(5),
    height: 100,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: makeSpacing(1),
  },
  name: {
    fontWeight: '600',
  },
  email: {
    fontWeight: '500',
  },
});
