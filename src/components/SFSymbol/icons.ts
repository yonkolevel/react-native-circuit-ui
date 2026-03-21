/**
 * SF Symbol → Lucide icon mapping
 *
 * Centralized map so every component uses consistent icon references.
 * On iOS: native SF Symbols via expo-symbols
 * On other platforms: Lucide fallback
 */
import {
  Play, Pause, ChevronLeft, Settings, Repeat,
  Star, Heart, Check, X, Plus,
  Grid2x2, Music3, Guitar, Mic,
  PlayCircle, UserCircle, Gamepad2,
  MoreHorizontal, Clock, PanelLeft,
  Volume2, Square,
  Search, RefreshCw, WifiOff, AlertTriangle,
  Piano,
  Timer, TimerOff,
  Circle,
  Undo2, Redo2,
  ZoomIn, ZoomOut, Maximize2, Minimize2,
  Minus,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

/**
 * Icon definition: SF Symbol name + Lucide fallback
 */
export interface IconDef {
  sf: string;
  fallback: LucideIcon;
}

/** All icons used across the app, keyed by semantic name */
export const Icons = {
  // Transport
  play: { sf: 'play.fill', fallback: Play },
  pause: { sf: 'pause.fill', fallback: Pause },
  record: { sf: 'record.circle', fallback: Circle },
  stop: { sf: 'stop.fill', fallback: Square },
  loop: { sf: 'arrow.rectanglepath', fallback: Repeat },

  // Navigation
  back: { sf: 'chevron.left', fallback: ChevronLeft },
  close: { sf: 'xmark', fallback: X },
  settings: { sf: 'gearshape.fill', fallback: Settings },
  sidebar: { sf: 'sidebar.left', fallback: PanelLeft },

  // Actions
  plus: { sf: 'plus', fallback: Plus },
  minus: { sf: 'minus', fallback: Minus },
  undo: { sf: 'arrow.uturn.backward', fallback: Undo2 },
  redo: { sf: 'arrow.uturn.forward', fallback: Redo2 },
  more: { sf: 'ellipsis', fallback: MoreHorizontal },

  // Track types (instruments)
  drumTrack: { sf: 'square.grid.2x2', fallback: Grid2x2 },
  melodicTrack: { sf: 'music.quarternote.3', fallback: Music3 },
  bassTrack: { sf: 'guitars', fallback: Guitar },
  audioTrack: { sf: 'mic.fill', fallback: Mic },
  piano: { sf: 'pianokeys', fallback: Piano },

  // Dashboard tabs
  tabCircuits: { sf: 'play.circle', fallback: PlayCircle },
  tabDiscover: { sf: 'star', fallback: Star },
  tabProfile: { sf: 'person.crop.circle', fallback: UserCircle },
  tabPlaygrounds: { sf: 'gamecontroller', fallback: Gamepad2 },

  // Content
  star: { sf: 'star', fallback: Star },
  starFill: { sf: 'star.fill', fallback: Star },
  heart: { sf: 'heart', fallback: Heart },
  heartFill: { sf: 'heart.fill', fallback: Heart },
  checkmark: { sf: 'checkmark.circle.fill', fallback: Check },
  clock: { sf: 'clock', fallback: Clock },

  // Audio
  speaker: { sf: 'speaker', fallback: Volume2 },
  metronomeOn: { sf: 'metronome.fill', fallback: Timer },
  metronomeOff: { sf: 'metronome', fallback: TimerOff },

  // Placeholder
  search: { sf: 'magnifyingglass', fallback: Search },
  refresh: { sf: 'arrow.clockwise', fallback: RefreshCw },
  noWifi: { sf: 'wifi.slash', fallback: WifiOff },
  warning: { sf: 'exclamationmark.triangle', fallback: AlertTriangle },

  // Zoom
  zoomIn: { sf: 'plus.magnifyingglass', fallback: ZoomIn },
  zoomOut: { sf: 'minus.magnifyingglass', fallback: ZoomOut },
  expand: { sf: 'arrow.up.left.and.arrow.down.right', fallback: Maximize2 },
  collapse: { sf: 'arrow.down.right.and.arrow.up.left', fallback: Minimize2 },
} as const satisfies Record<string, IconDef>;

export type IconName = keyof typeof Icons;
