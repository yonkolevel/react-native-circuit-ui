/**
 * DashboardTabBar — Matches DashboardTabBarView.swift
 *
 * SwiftUI: Portrait = horizontal HStack at bottom, Landscape = vertical VStack sidebar (118pt wide)
 * Icons: 28×28, mcOrange when active, mcWhite3 when inactive
 * Labels: .mcExtraSmall .semibold
 * Background: mcBlack, ignores safe area
 */
import { memo } from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Text } from '../../../components/Text';
import { useTheme } from '../../../theme';
import { Icon, Icons } from '../../../components/SFSymbol';
import type { DashboardTab } from '../types';

const TAB_ICON_DEFS = {
  myCircuits: Icons.tabCircuits,
  discover: Icons.tabDiscover,
  profile: Icons.tabProfile,
  playgrounds: Icons.tabPlaygrounds,
};

const TAB_LABELS: Record<DashboardTab, string> = {
  myCircuits: 'MY CIRCUITS',
  discover: 'DISCOVER',
  profile: 'PROFILE',
  playgrounds: 'PLAYGROUNDS',
};

export interface DashboardTabBarProps {
  tabs: DashboardTab[];
  selectedTab: DashboardTab;
  onTabPress?: (tab: DashboardTab) => void;
  isLandscape?: boolean;
}

export const DashboardTabBar = memo(function DashboardTabBar({
  tabs, selectedTab, onTabPress, isLandscape,
}: DashboardTabBarProps) {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const landscape = isLandscape ?? width > height;

  const renderTab = (tab: DashboardTab) => {
    const tabIcon = TAB_ICON_DEFS[tab];
    const isActive = tab === selectedTab;
    const color = isActive ? colors.mcOrange : colors.mcWhite3;

    return (
      <Pressable
        key={tab}
        onPress={() => onTabPress?.(tab)}
        style={styles.tabButton}
        accessibilityRole="button"
        accessibilityLabel={TAB_LABELS[tab]}
        accessibilityState={{ selected: isActive }}
      >
        <Icon icon={tabIcon} size={28} color={color} />
        <Text variant="extraSmallSemiBold" color={color} style={styles.tabLabel}>
          {TAB_LABELS[tab]}
        </Text>
      </Pressable>
    );
  };

  if (landscape) {
    return (
      <View style={[styles.sideBar, { backgroundColor: colors.mcBlack }]}>
        {tabs.map(renderTab)}
        <View style={styles.spacer} />
      </View>
    );
  }

  return (
    <View style={[styles.bottomBar, { backgroundColor: colors.mcBlack }]}>
      {tabs.map(renderTab)}
    </View>
  );
});

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: 12,
  },
  sideBar: {
    width: 118, paddingVertical: 40, gap: 40, alignItems: 'center',
  },
  tabButton: { alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  tabLabel: { textAlign: 'center' },
  spacer: { flex: 1 },
});
