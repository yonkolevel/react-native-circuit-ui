/**
 * Dashboard types — matches AppRootFeature models
 */

export type DashboardTab = 'myCircuits' | 'discover' | 'profile' | 'playgrounds';

export interface DashboardTabConfig {
  key: DashboardTab;
  icon: string; // SF Symbol name → lucide mapping
  text: string;
}

export const DASHBOARD_TABS: DashboardTabConfig[] = [
  { key: 'myCircuits', icon: 'play-circle', text: 'MY CIRCUITS' },
  { key: 'discover', icon: 'star', text: 'DISCOVER' },
  { key: 'profile', icon: 'user-circle', text: 'PROFILE' },
  { key: 'playgrounds', icon: 'gamepad-2', text: 'PLAYGROUNDS' },
];

export interface DashboardState {
  selectedTab: DashboardTab;
  tabs: DashboardTab[];
}
