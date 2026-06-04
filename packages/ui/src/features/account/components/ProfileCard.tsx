/**
 * ProfileCardView — Matches ProfileCardView.swift
 *
 * HStack: profile image (80×80 circle) + VStack(name, email, edit, logout)
 * Background: theme bg, cornerRadius 5, shadow radius 3
 * Padding: makeSpacing(4) all sides
 */
import { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '../../../components/Text';
import { Avatar } from '../../../components/Avatar';
import { useTheme } from '../../../theme';
import { makeSpacing } from '../../../theme/spacing';
import type { UserProfile } from '../types';

export interface ProfileCardProps {
  profile: UserProfile;
  onEditProfile?: () => void;
  onLogout?: () => void;
}

export const ProfileCard = memo(function ProfileCard({
  profile,
  onEditProfile,
  onLogout,
}: ProfileCardProps) {
  const { colors, isDark } = useTheme();
  const bgColor = isDark ? colors.mcBlack3 : colors.mcWhite;

  return (
    <View
      style={[styles.container, { backgroundColor: bgColor }]}
      accessibilityLabel={`Profile: ${profile.name}`}
    >
      <Avatar size={80} imageUrl={profile.pictureUrl} />

      <View style={styles.info}>
        {profile.name.trim().length > 0 && (
          <Text variant="body" numberOfLines={2}>
            {profile.name}
          </Text>
        )}
        <Text variant="small" color={colors.mcWhite2}>
          {profile.email}
        </Text>

        {onEditProfile && (
          <Pressable
            onPress={onEditProfile}
            style={styles.link}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <Text variant="small" color={colors.mcBlue}>
              Edit Account
            </Text>
          </Pressable>
        )}

        {onLogout && (
          <Pressable
            onPress={onLogout}
            style={styles.link}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <Text variant="small" color={colors.mcPink}>
              Log out
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: makeSpacing(3),
    padding: makeSpacing(4),
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  info: { flex: 1, gap: makeSpacing(3) },
  link: { paddingVertical: 2 },
});
