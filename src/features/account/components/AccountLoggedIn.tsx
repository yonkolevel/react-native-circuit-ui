/**
 * AccountLoggedIn — Matches AccountLoggedIn.swift
 *
 * Container view showing logged-in user's profile card and stats.
 * On iPhone: VStack (profile card above stats)
 * On iPad/Desktop: HStack (profile card next to stats)
 *
 * Architecture: ALL actions come from the store. No inline callbacks.
 * Action names match Swift: didTapEditProfile, didTapLogout, didTapSettingsButton.
 *
 * iOS Reference:
 * - Profile card: 350pt width, 126pt height
 * - Stats cards: 3 cards in a row (Circuits, Lessons, Trophies)
 * - Spacing: 24pt between sections
 * - "ID" label above profile card
 * - "PROGRESS SUMMARY" label above stats
 */
import { memo } from 'react';
import { View, StyleSheet, useWindowDimensions, Pressable } from 'react-native';
import { Text } from '../../../components/Text';
import { Icon, Icons } from '../../../components/SFSymbol';
import { useTheme } from '../../../theme';
import { makeSpacing } from '../../../theme/spacing';
import { ProfileCard } from './ProfileCard';
import { ProfileStatsCard } from './ProfileStatsCard';
import type { UserProfile } from '../types';

/** Achievement stats for the logged-in user */
export interface UserAchievements {
  /** Number of completed circuits */
  completedCircuitCount: number;
  /** Number of completed lessons */
  completedLessonsCount: number;
  /** Number of achieved trophies */
  achievedTrophyCount: number;
}

export interface AccountLoggedInProps {
  /** User profile data */
  profile: UserProfile;
  /** User achievements/stats */
  achievements: UserAchievements;
  /** Called when user taps Edit Profile — store action */
  didTapEditProfile?: () => void;
  /** Called when user taps Logout — store action */
  didTapLogout?: () => void;
  /** Called when user taps Settings — store action */
  didTapSettingsButton?: () => void;
  /** Test ID for testing */
  testID?: string;
}

/** Breakpoint for switching between mobile and desktop layouts */
const MOBILE_BREAKPOINT = 800;

export const AccountLoggedIn = memo(function AccountLoggedIn({
  profile,
  achievements,
  didTapEditProfile,
  didTapLogout,
  didTapSettingsButton,
  testID,
}: AccountLoggedInProps) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;
  const secondaryTextColor = isDark ? colors.mcWhite2 : colors.mcBlack2;

  return (
    <View style={styles.container} testID={testID}>
      {/* Header: Profile title + Settings button */}
      <View style={styles.header}>
        <Text variant="h3" style={{ color: colors.mcWhite }}>
          Profile
        </Text>
        {didTapSettingsButton && (
          <Pressable
            onPress={didTapSettingsButton}
            style={styles.settingsButton}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Icon icon={Icons.gear} size={22} color={colors.mcWhite} />
          </Pressable>
        )}
      </View>

      {/* Content: Profile card + Stats */}
      <View style={[styles.content, isMobile && styles.contentMobile]}>
        {/* Profile Card Section */}
        <View style={styles.section}>
          <Text
            variant="small"
            style={[styles.sectionLabel, { color: secondaryTextColor }]}
          >
            ID
          </Text>
          <View style={styles.profileCardWrapper}>
            <ProfileCard
              profile={profile}
              onEditProfile={didTapEditProfile}
              onLogout={didTapLogout}
            />
          </View>
        </View>

        {/* Stats Section - Always 3 columns in a row */}
        <View style={styles.section}>
          <Text
            variant="small"
            style={[styles.sectionLabel, { color: secondaryTextColor }]}
          >
            PROGRESS SUMMARY
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <ProfileStatsCard
                title="Circuits"
                value={String(achievements.completedCircuitCount)}
                testID="circuits-stat"
              />
            </View>
            <View style={styles.statCard}>
              <ProfileStatsCard
                title="Lessons"
                value={String(achievements.completedLessonsCount)}
                testID="lessons-stat"
              />
            </View>
            <View style={styles.statCard}>
              <ProfileStatsCard
                title="Trophies"
                value={String(achievements.achievedTrophyCount)}
                testID="trophies-stat"
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    maxWidth: 1440,
    paddingHorizontal: makeSpacing(6),
    paddingVertical: makeSpacing(4),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: makeSpacing(6),
  },
  settingsButton: {
    padding: makeSpacing(2),
  },
  content: {
    flexDirection: 'row',
    gap: makeSpacing(6),
  },
  contentMobile: {
    flexDirection: 'column',
  },
  section: {
    gap: makeSpacing(3),
  },
  sectionLabel: {
    textTransform: 'uppercase',
  },
  profileCardWrapper: {
    maxWidth: 350,
    minHeight: 126,
  },
  statsRow: {
    flexDirection: 'row',
    gap: makeSpacing(3),
    minHeight: 126,
  },
  statCard: {
    flex: 1,
  },
});
