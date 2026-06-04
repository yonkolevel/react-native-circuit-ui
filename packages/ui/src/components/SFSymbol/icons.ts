/**
 * Icon definitions: SF Symbol (iOS) + MaterialCommunityIcons (Android) + Lucide (Web)
 */
import {
  Play,
  Pause,
  ChevronLeft,
  Settings,
  Repeat,
  Star,
  Heart,
  Check,
  X,
  Plus,
  Grid2x2,
  Music3,
  Guitar,
  Mic,
  PlayCircle,
  UserCircle,
  Gamepad2,
  MoreHorizontal,
  Clock,
  PanelLeft,
  Volume2,
  Square,
  Search,
  RefreshCw,
  WifiOff,
  AlertTriangle,
  Info,
  Lightbulb,
  Piano,
  Timer,
  TimerOff,
  Circle,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Minus,
  MoveHorizontal,
  Trash2,
  Copy,
  Type,
  UserPlus,
  Apple,
  Mail,
  Bell,
  BellRing,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

export interface IconDef {
  sf: string;
  fallback: LucideIcon;
  android: string; // MaterialCommunityIcons name
}

export const Icons = {
  // Transport
  play: { sf: 'play.fill', fallback: Play, android: 'play' },
  pause: { sf: 'pause.fill', fallback: Pause, android: 'pause' },
  record: {
    sf: 'record.circle',
    fallback: Circle,
    android: 'record-circle-outline',
  },
  stop: { sf: 'stop.fill', fallback: Square, android: 'stop' },
  loop: { sf: 'arrow.rectanglepath', fallback: Repeat, android: 'repeat' },

  // Navigation
  back: { sf: 'chevron.left', fallback: ChevronLeft, android: 'chevron-left' },
  close: { sf: 'xmark', fallback: X, android: 'close' },
  settings: { sf: 'gearshape.fill', fallback: Settings, android: 'cog' },
  sidebar: { sf: 'sidebar.left', fallback: PanelLeft, android: 'dock-left' },

  // Actions
  plus: { sf: 'plus', fallback: Plus, android: 'plus' },
  minus: { sf: 'minus', fallback: Minus, android: 'minus' },
  undo: { sf: 'arrow.uturn.backward', fallback: Undo2, android: 'undo' },
  redo: { sf: 'arrow.uturn.forward', fallback: Redo2, android: 'redo' },
  more: {
    sf: 'ellipsis',
    fallback: MoreHorizontal,
    android: 'dots-horizontal',
  },

  // Track types
  drumTrack: { sf: 'square.grid.2x2', fallback: Grid2x2, android: 'grid' },
  melodicTrack: {
    sf: 'music.quarternote.3',
    fallback: Music3,
    android: 'music-note',
  },
  bassTrack: { sf: 'guitars', fallback: Guitar, android: 'guitar-electric' },
  audioTrack: { sf: 'mic.fill', fallback: Mic, android: 'microphone' },
  piano: { sf: 'pianokeys', fallback: Piano, android: 'piano' },

  // Dashboard tabs
  tabCircuits: {
    sf: 'play.circle',
    fallback: PlayCircle,
    android: 'play-circle-outline',
  },
  tabDiscover: { sf: 'star', fallback: Star, android: 'star-outline' },
  tabProfile: {
    sf: 'person.crop.circle',
    fallback: UserCircle,
    android: 'account-circle-outline',
  },
  tabPlaygrounds: {
    sf: 'gamecontroller',
    fallback: Gamepad2,
    android: 'gamepad-variant-outline',
  },

  // Content
  star: { sf: 'star', fallback: Star, android: 'star-outline' },
  starFill: { sf: 'star.fill', fallback: Star, android: 'star' },
  heart: { sf: 'heart', fallback: Heart, android: 'heart-outline' },
  heartFill: { sf: 'heart.fill', fallback: Heart, android: 'heart' },
  checkmark: {
    sf: 'checkmark.circle.fill',
    fallback: Check,
    android: 'check-circle',
  },
  clock: { sf: 'clock', fallback: Clock, android: 'clock-outline' },

  // Audio
  speaker: { sf: 'speaker', fallback: Volume2, android: 'volume-high' },
  metronomeOn: {
    sf: 'metronome.fill',
    fallback: Timer,
    android: 'metronome-tick',
  },
  metronomeOff: { sf: 'metronome', fallback: TimerOff, android: 'metronome' },

  // Placeholder
  search: { sf: 'magnifyingglass', fallback: Search, android: 'magnify' },
  refresh: { sf: 'arrow.clockwise', fallback: RefreshCw, android: 'refresh' },
  noWifi: { sf: 'wifi.slash', fallback: WifiOff, android: 'wifi-off' },
  warning: {
    sf: 'exclamationmark.triangle',
    fallback: AlertTriangle,
    android: 'alert-outline',
  },
  infoCircle: {
    sf: 'info.circle.fill',
    fallback: Info,
    android: 'information-outline',
  },
  lightbulb: {
    sf: 'lightbulb.fill',
    fallback: Lightbulb,
    android: 'lightbulb-outline',
  },

  // Mixer
  panArrows: {
    sf: 'arrow.left.and.right',
    fallback: MoveHorizontal,
    android: 'arrow-left-right',
  },
  speakerFill: {
    sf: 'speaker.wave.2.fill',
    fallback: Volume2,
    android: 'volume-high',
  },

  // Context menus
  trash: { sf: 'trash', fallback: Trash2, android: 'delete-outline' },
  duplicate: {
    sf: 'plus.square.on.square',
    fallback: Copy,
    android: 'content-copy',
  },
  editText: {
    sf: 'character.cursor.ibeam',
    fallback: Type,
    android: 'cursor-text',
  },

  // Zoom
  zoomIn: {
    sf: 'plus.magnifyingglass',
    fallback: ZoomIn,
    android: 'magnify-plus-outline',
  },
  zoomOut: {
    sf: 'minus.magnifyingglass',
    fallback: ZoomOut,
    android: 'magnify-minus-outline',
  },
  expand: {
    sf: 'arrow.up.left.and.arrow.down.right',
    fallback: Maximize2,
    android: 'arrow-expand',
  },
  collapse: {
    sf: 'arrow.down.right.and.arrow.up.left',
    fallback: Minimize2,
    android: 'arrow-collapse',
  },

  // Account
  gear: { sf: 'gearshape', fallback: Settings, android: 'cog' },
  personFill: { sf: 'person.fill', fallback: UserCircle, android: 'account' },
  createAccount: {
    sf: 'person.crop.circle.badge.plus',
    fallback: UserPlus,
    android: 'account-plus',
  },

  // Notifications
  bell: { sf: 'bell', fallback: Bell, android: 'bell-outline' },
  bellFill: { sf: 'bell.fill', fallback: BellRing, android: 'bell' },

  // Social sign-in
  apple: { sf: 'apple.logo', fallback: Apple, android: 'apple' },
  google: { sf: 'g.circle', fallback: UserCircle, android: 'google' },
  envelope: { sf: 'envelope', fallback: Mail, android: 'email-outline' },
} as const satisfies Record<string, IconDef>;

export type IconName = keyof typeof Icons;
