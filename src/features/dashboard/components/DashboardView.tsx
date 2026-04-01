/**
 * DashboardView — Matches DashboardView.swift
 *
 * Tab container rendering the active feature screen.
 * Presentation only — content of each tab is passed as children or render props.
 */
import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';
import { DashboardTabBar } from './DashboardTabBar';
import type { DashboardTab } from '../types';

export interface DashboardViewProps {
  tabs: DashboardTab[];
  selectedTab: DashboardTab;
  onTabChange?: (tab: DashboardTab) => void;
  children: React.ReactNode;
}

export const DashboardView = memo(function DashboardView({
  tabs,
  selectedTab,
  onTabChange,
  children,
}: DashboardViewProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.mcBlack }]}>
      <View style={styles.content}>{children}</View>
      <DashboardTabBar
        tabs={tabs}
        selectedTab={selectedTab}
        onTabPress={onTabChange}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
});
