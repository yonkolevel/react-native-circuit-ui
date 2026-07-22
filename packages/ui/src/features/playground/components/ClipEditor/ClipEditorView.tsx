/**
 * ClipEditorView — Faithful port of ClipEditorView.swift
 *
 * Layout (from screenshots):
 * ┌─────────────────────────────────────────────────┐
 * │ Toolbar: < | ▶ ⏺ 🔔 ↩ ↪ | ⚙                  │
 * ├──────┬──────────────────────────────┬────────────┤
 * │ Note │ Piano Roll Grid             │ Zoom       │
 * │ Names│ (notes on grid)             │ Controls   │
 * │ (col)│                             │ ↕ 🔍+ 100% │
 * │      │                             │ 🔍-        │
 * ├──────┴──────────────────────────────┴────────────┤
 * │ — | 1        2        | +    (clip length bar)   │
 * ├──────────────────────────────────────────────────┤
 * │ SELECTED_NOTE_NAME                          ✕    │
 * │ NOTES: [note blocks in row]                      │
 * │ VEL:   [velocity bars with values]               │
 * └──────────────────────────────────────────────────┘
 */
import { memo, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Alert,
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useFrameCallback,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Text } from '../../../../components/Text';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { useTheme, hexToRgba } from '../../../../theme';
import { makeSpacing, spacing } from '../../../../theme/spacing';
import { ClipSettingsModal } from './ClipSettingsModal';
import { DrumPadsView } from '../DrumPads/DrumPadsView';
import { PianoKeyboard } from '../PianoKeyboard/PianoKeyboard';
import { SkiaPianoRollGrid } from '../../../../components/PianoRoll';
import type {
  RecordingNotePreviewData,
  SkiaPianoRollGridHandle,
} from '../../../../components/PianoRoll';
import { NotePrecisionPanel } from '../../../../components/NotePrecisionPanel';
import type { NotePrecisionPanelHandle } from '../../../../components/NotePrecisionPanel';
import { WithHint, HintIDs } from '../../../../components/Hint';
import type {
  Clip,
  ClipNote,
  InstrumentType,
  ClipEditorCallbacks,
  DrumPadCallbacks,
  PianoKeyCallbacks,
  Sample,
} from '../../types';

// ─── ClipEditorToolbar ──────────────────────────────────────────────────────
// Matches ClipEditorToolbarView.swift exactly:
// HStack(spacing: makeSpacing(4)): back | Spacer | play, record, metronome, undo, redo | Spacer | settings
// padding: horizontal 24, bottom 16, bg mcBlack2

interface ClipEditorToolbarProps {
  isPlaying?: boolean;
  isRecording?: boolean;
  isMetronomeEnabled?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onBack?: () => void;
  onPlayPause?: () => void;
  onRecord?: () => void;
  onMetronome?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSettings?: () => void;
}

const ClipEditorToolbar = memo(function ClipEditorToolbar({
  isPlaying,
  isRecording,
  isMetronomeEnabled,
  canUndo = true,
  canRedo = true,
  onBack,
  onPlayPause,
  onRecord,
  onMetronome,
  onUndo,
  onRedo,
  onSettings,
}: ClipEditorToolbarProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.toolbar, { backgroundColor: colors.mcBlack2 }]}>
      <Pressable onPress={onBack} hitSlop={8} accessibilityLabel="Back">
        <Icon icon={Icons.back} size={22} color={colors.mcGray} />
      </Pressable>

      <View style={styles.toolbarSpacer} />

      <View style={styles.toolbarCenter}>
        <Pressable
          onPress={onPlayPause}
          hitSlop={8}
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        >
          <Icon
            icon={isPlaying ? Icons.pause : Icons.play}
            size={22}
            color={colors.mcWhite}
          />
        </Pressable>
        <Pressable onPress={onRecord} hitSlop={8} accessibilityLabel="Record">
          <Icon
            icon={Icons.record}
            size={22}
            color={isRecording ? colors.mcPink : colors.mcWhite}
          />
        </Pressable>
        <Pressable
          onPress={onMetronome}
          hitSlop={8}
          accessibilityLabel="Metronome"
        >
          <Icon
            icon={isMetronomeEnabled ? Icons.metronomeOn : Icons.metronomeOff}
            size={22}
            color={colors.mcWhite}
          />
        </Pressable>
        <Pressable
          onPress={onUndo}
          hitSlop={8}
          disabled={!canUndo}
          accessibilityLabel="Undo"
        >
          <Icon
            icon={Icons.undo}
            size={22}
            color={canUndo ? colors.mcWhite : colors.mcGray}
          />
        </Pressable>
        <Pressable
          onPress={onRedo}
          hitSlop={8}
          disabled={!canRedo}
          accessibilityLabel="Redo"
        >
          <Icon
            icon={Icons.redo}
            size={22}
            color={canRedo ? colors.mcWhite : colors.mcGray}
          />
        </Pressable>
      </View>

      <View style={styles.toolbarSpacer} />

      <Pressable onPress={onSettings} hitSlop={8} accessibilityLabel="Settings">
        <Icon icon={Icons.settings} size={22} color={colors.mcWhite} />
      </Pressable>
    </View>
  );
});

// Note name lookup for melodic/bass pitch labels — matches iOS getNoteName
const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

/** Width of the pitch label column in the piano roll grid */
const LABEL_COL_WIDTH = 60;

/** Default MIDI pitch range for melodic/bass tracks (2 octaves starting at C3 = MIDI 48).
 *  Can be overridden per-track via the `melodicMinPitch` prop on ClipEditorView. */
const DEFAULT_MELODIC_MIN_PITCH = 48;

// ─── Clip Length Bar ─────────────────────────────────────────────────────────
// Orange bar: "— | 1  2  3  4 | +"

/**
 * ClipLengthBar — continuous bar-range strip.
 *
 * Layout: HStack(spacing:0) { minus | locator + bar segments | plus }
 * - Minus/Plus: mcOrange icon on mcBlack bg, 34x34 — change the clip's TOTAL length
 * - Locator: thin non-interactive strip above the bar segments, mirrors the
 *   scrubber's visible-window concept — width/position track the piano
 *   roll's current scroll range and zoom, purely informational
 * - Bar segments: one continuous strip, divided by hairlines, each showing a
 *   mini thumbnail of that bar's own notes (mirrors the piano roll above)
 *   plus its bar number. No isolated per-bar underline anymore.
 * - Tap a bar → focuses it and navigates the piano roll there (no loop change)
 * - Drag across bars → selects the contiguous loop range between them
 * - Active (in loop range): translucent mcOrange tint
 * - Focused: white outline; focus is independent from the loop range
 * - Inactive: mcBlack3 bg
 */
interface ClipLengthBarProps {
  lengthInBars: number;
  activeBarStart: number;
  activeLengthInBars: number;
  /** Loop-range tint for each bar segment mirrors this (the clip/track's own color) */
  trackColor: string;
  /** Notes used to render each bar segment's mini note-thumbnail */
  notes: ClipNote[];
  /** 0-indexed, half-open [start, end) range of bars currently scrolled into view on the grid above — drives the locator strip */
  visibleBarRange?: { start: number; end: number };
  onSetActiveBarRange?: (start: number, length: number) => void;
  onDecrease?: () => void;
  onIncrease?: () => void;
  /** Duplicate the first bar when adding the second bar. */
  onDuplicateBar?: (barIndex: number) => void;
  /** Scroll the piano roll to the focused (0-indexed) bar */
  onNavigateToBar?: (barIndex: number) => void;
}

const BAR_HEIGHT = 28;
const BAR_BTN_W = 34;
const LOCATOR_HEIGHT = 2;
const LOCATOR_GAP = 0;

/** Return the inclusive bar range between two 0-based bar indices. */
export const rangeForBarDrag = (from: number, to: number): [number, number] => {
  const start = Math.min(from, to);
  return [start, Math.abs(to - from) + 1];
};

/** Convert a local x-coordinate into a clamped 0-based bar index. */
const barIndexAtX = (
  x: number,
  stripWidth: number,
  barCount: number
): number => {
  'worklet';
  if (stripWidth <= 0) return 0;
  return Math.max(
    0,
    Math.min(barCount - 1, Math.floor((x / stripWidth) * barCount))
  );
};

const ClipLengthBarSegment = memo(function ClipLengthBarSegment({
  barIndex,
  isActive,
  isFocused,
  isLast,
  trackColor,
  dashes,
  onFocus,
}: {
  barIndex: number;
  isActive: boolean;
  isFocused: boolean;
  isLast: boolean;
  trackColor: string;
  dashes: { xFrac: number; yFrac: number }[];
  onFocus: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.clipLengthSegment,
        {
          backgroundColor: isActive
            ? hexToRgba(trackColor, 0.35)
            : colors.mcBlack3,
          borderWidth: isFocused ? 1 : 0,
          borderColor: colors.mcWhite2,
          borderRightWidth: isLast ? 0 : 1,
          borderRightColor: isFocused ? colors.mcWhite2 : colors.mcBlack,
        },
      ]}
      accessibilityLabel={`Bar ${barIndex}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      onAccessibilityTap={onFocus}
    >
      <Text
        variant="extraSmall10SemiBold"
        color={isActive ? colors.mcWhite2 : colors.mcWhite3}
        style={styles.clipLengthSegmentNum}
      >
        {barIndex}
      </Text>
      {dashes.map((d, di) => (
        <View
          key={di}
          style={[
            styles.clipLengthDash,
            {
              left: `${d.xFrac * 100}%`,
              top: `${d.yFrac * 100}%`,
              backgroundColor: colors.mcWhite2,
            },
          ]}
        />
      ))}
    </View>
  );
});

const ClipLengthBar = memo(function ClipLengthBar({
  lengthInBars,
  activeBarStart,
  activeLengthInBars,
  trackColor,
  notes,
  visibleBarRange,
  onSetActiveBarRange,
  onDecrease,
  onIncrease,
  onDuplicateBar,
  onNavigateToBar,
}: ClipLengthBarProps) {
  const { colors } = useTheme();
  const barCount = Math.max(1, lengthInBars);
  const [stripWidth, setStripWidth] = useState(0);
  const [focusedBarIndex, setFocusedBarIndex] = useState<number | null>(null);
  const [dragPreview, setDragPreview] = useState<[number, number] | null>(null);
  const dragStartBar = useSharedValue(0);
  const lastDragBar = useSharedValue(-1);
  const displayActiveBarStart = dragPreview?.[0] ?? activeBarStart;
  const displayActiveLength = dragPreview?.[1] ?? activeLengthInBars;
  const canAdd = barCount < 16;
  const canRemove = barCount > 1;

  const handlePlusPress = useCallback(() => {
    if (barCount !== 1 || notes.length === 0) {
      onIncrease?.();
      return;
    }

    Alert.alert(
      'Add Bar',
      'Would you like to duplicate the notes from the last bar?',
      [
        {
          text: 'Duplicate notes from the last bar',
          onPress: () => onDuplicateBar?.(0),
        },
        { text: 'Add Empty Bar', onPress: onIncrease },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [barCount, notes.length, onDuplicateBar, onIncrease]);

  const handleBarTap = useCallback(
    (i: number) => {
      setFocusedBarIndex(i);
      onNavigateToBar?.(i);
    },
    [onNavigateToBar]
  );
  const updateDragPreview = useCallback((from: number, to: number) => {
    const next = rangeForBarDrag(from, to);
    setDragPreview((previous) =>
      previous?.[0] === next[0] && previous?.[1] === next[1] ? previous : next
    );
  }, []);
  const finishDrag = useCallback(
    (from: number, to: number) => {
      setFocusedBarIndex(to);
      setDragPreview(null);
      const [start, length] = rangeForBarDrag(from, to);
      onSetActiveBarRange?.(start, length);
    },
    [onSetActiveBarRange]
  );
  const barStripGesture = useMemo(() => {
    const drag = Gesture.Pan()
      .activeOffsetX([-8, 8])
      .failOffsetY([-12, 12])
      .onStart((e) => {
        'worklet';
        const index = barIndexAtX(e.x - e.translationX, stripWidth, barCount);
        dragStartBar.value = index;
        lastDragBar.value = index;
        scheduleOnRN(updateDragPreview, index, index);
      })
      .onUpdate((e) => {
        'worklet';
        const index = barIndexAtX(e.x, stripWidth, barCount);
        if (index === lastDragBar.value) return;
        lastDragBar.value = index;
        scheduleOnRN(updateDragPreview, dragStartBar.value, index);
      })
      .onEnd((e) => {
        'worklet';
        const index = barIndexAtX(e.x, stripWidth, barCount);
        scheduleOnRN(finishDrag, dragStartBar.value, index);
      });
    const tap = Gesture.Tap().onEnd((e, success) => {
      'worklet';
      if (success)
        scheduleOnRN(handleBarTap, barIndexAtX(e.x, stripWidth, barCount));
    });
    return Gesture.Exclusive(drag, tap);
  }, [
    barCount,
    stripWidth,
    handleBarTap,
    updateDragPreview,
    finishDrag,
    dragStartBar,
    lastDragBar,
  ]);

  // Mini note-thumbnail per bar — mirrors the piano roll above. Pitch is
  // normalized against the clip's own min/max pitch so the shape stays
  // legible regardless of instrument range.
  const notesByBar = useMemo(() => {
    const perBar: { xFrac: number; yFrac: number }[][] = Array.from(
      { length: barCount },
      () => []
    );
    if (!notes.length) return perBar;
    let minPitch = Infinity;
    let maxPitch = -Infinity;
    for (const n of notes) {
      if (n.noteNumber < minPitch) minPitch = n.noteNumber;
      if (n.noteNumber > maxPitch) maxPitch = n.noteNumber;
    }
    const pitchSpan = Math.max(1, maxPitch - minPitch);
    for (const n of notes) {
      const bar = Math.floor(n.position / 4);
      if (bar < 0 || bar >= barCount) continue;
      const xFrac = (n.position - bar * 4) / 4;
      const yFrac = 1 - (n.noteNumber - minPitch) / pitchSpan;
      perBar[bar]?.push({
        xFrac: Math.min(0.92, Math.max(0, xFrac)),
        yFrac: Math.min(0.85, Math.max(0.15, yFrac)),
      });
    }
    return perBar;
  }, [notes, barCount]);

  const locatorLeftFrac = visibleBarRange
    ? Math.max(0, visibleBarRange.start) / barCount
    : 0;
  const locatorWidthFrac = visibleBarRange
    ? Math.max(
        0,
        Math.min(barCount, visibleBarRange.end) -
          Math.max(0, visibleBarRange.start)
      ) / barCount
    : 1;

  return (
    <View style={[styles.clipLengthBar, { backgroundColor: colors.mcBlack }]}>
      <Pressable
        onPress={onDecrease}
        disabled={!canRemove}
        style={[
          styles.clipLengthEndBtn,
          { backgroundColor: colors.mcBlack, opacity: canRemove ? 1 : 0.4 },
        ]}
        accessibilityLabel="Remove bar"
      >
        <Icon icon={Icons.minus} size={12} color={colors.mcWhite2} />
      </Pressable>

      <View style={styles.clipLengthMain}>
        {/* Bar segments: tap selects one bar; horizontal drag selects a range. */}
        <GestureDetector gesture={barStripGesture}>
          <View
            style={styles.clipLengthNumbers}
            onLayout={(event) => setStripWidth(event.nativeEvent.layout.width)}
          >
            {Array.from({ length: barCount }, (_, i) => {
              const isActive =
                i >= displayActiveBarStart &&
                i < displayActiveBarStart + displayActiveLength;
              return (
                <ClipLengthBarSegment
                  key={i}
                  barIndex={i + 1}
                  isActive={isActive}
                  isFocused={focusedBarIndex === i}
                  isLast={i === barCount - 1}
                  trackColor={trackColor}
                  dashes={notesByBar[i] ?? []}
                  onFocus={() => handleBarTap(i)}
                />
              );
            })}
          </View>
        </GestureDetector>

        {/* Locator — read-only, mirrors the visible piano-roll range */}
        <View style={styles.clipLengthLocatorTrack}>
          <View
            style={[
              styles.clipLengthLocatorFill,
              {
                left: `${locatorLeftFrac * 100}%`,
                width: `${locatorWidthFrac * 100}%`,
                backgroundColor: colors.mcWhite2,
              },
            ]}
          />
        </View>
      </View>

      <Pressable
        onPress={handlePlusPress}
        disabled={!canAdd}
        style={[
          styles.clipLengthEndBtn,
          { backgroundColor: colors.mcBlack, opacity: canAdd ? 1 : 0.4 },
        ]}
        accessibilityLabel="Add bar"
      >
        <Icon icon={Icons.plus} size={12} color={colors.mcWhite2} />
      </Pressable>
    </View>
  );
});

// ─── Zoom Scrubber ──────────────────────────────────────────────────────────
// A thin zoom slider above the clip length bar: 100% at the left, 300% at
// the right, current value shown as a percentage at the trailing end.
// Replaces the old zoom +/- and expand buttons that used to float on top of
// the grid (and so could sit right over a note a user was trying to reach).
// Deliberately does nothing else — no panning, no clip-length awareness.
// Panning is already well covered by the grid's own drag-to-pan and by the
// clip length bar's jump-to-bar, so a third, cramped way to do the same
// thing here was adding bugs, not capability.

const SCRUBBER_HEIGHT = 28;
const SCRUBBER_THUMB_SIZE = 20;
const SCRUBBER_MIN_ZOOM = 1;
const SCRUBBER_MAX_ZOOM = 3;

interface ZoomScrubberProps {
  zoom: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onZoomChange: (zoom: number) => void;
}

const ZoomScrubber = memo(function ZoomScrubber({
  zoom,
  isExpanded,
  onToggleExpand,
  onZoomChange,
}: ZoomScrubberProps) {
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const [displayZoom, setDisplayZoom] = useState(zoom);

  // The gesture reads onZoomChange through a ref rather than closing over it
  // directly, and is built once via useMemo — not recreated on every render.
  // Zoom updates live as you drag (it's view-only state, nothing undo-tracked,
  // so there's no reason to defer it to release), which means every drag tick
  // re-renders this component; rebuilding the gesture object on each of those
  // renders was exactly what broke the previous version's dragging mid-touch.
  const onZoomChangeRef = useRef(onZoomChange);
  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
  }, [onZoomChange]);
  const commitZoom = useCallback((z: number) => {
    onZoomChangeRef.current?.(z);
    setDisplayZoom(z);
  }, []);

  const liveZoom = useSharedValue(zoom);
  useEffect(() => {
    liveZoom.value = zoom;
    setDisplayZoom(zoom);
  }, [zoom, liveZoom]);

  const zoomGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onStart((e) => {
          'worklet';
          if (trackWidth <= 0) return;
          const fraction = Math.max(0, Math.min(1, e.x / trackWidth));
          const z =
            SCRUBBER_MIN_ZOOM +
            fraction * (SCRUBBER_MAX_ZOOM - SCRUBBER_MIN_ZOOM);
          liveZoom.value = z;
          scheduleOnRN(commitZoom, z);
        })
        .onUpdate((e) => {
          'worklet';
          if (trackWidth <= 0) return;
          const fraction = Math.max(0, Math.min(1, e.x / trackWidth));
          const z =
            SCRUBBER_MIN_ZOOM +
            fraction * (SCRUBBER_MAX_ZOOM - SCRUBBER_MIN_ZOOM);
          liveZoom.value = z;
          scheduleOnRN(commitZoom, z);
        }),
    [trackWidth, liveZoom, commitZoom]
  );

  const thumbStyle = useAnimatedStyle(() => {
    const fraction =
      (liveZoom.value - SCRUBBER_MIN_ZOOM) /
      (SCRUBBER_MAX_ZOOM - SCRUBBER_MIN_ZOOM);
    return { left: fraction * trackWidth - SCRUBBER_THUMB_SIZE / 2 };
  });
  const fillStyle = useAnimatedStyle(() => {
    const fraction =
      (liveZoom.value - SCRUBBER_MIN_ZOOM) /
      (SCRUBBER_MAX_ZOOM - SCRUBBER_MIN_ZOOM);
    return { width: fraction * trackWidth };
  });

  return (
    <View style={[styles.scrubberRow, { backgroundColor: colors.mcBlack }]}>
      <Pressable
        onPress={onToggleExpand}
        style={styles.scrubberExpandBtn}
        accessibilityLabel={
          isExpanded ? 'Collapse piano roll' : 'Expand piano roll'
        }
      >
        <Icon
          icon={isExpanded ? Icons.collapse : Icons.expand}
          size={12}
          color={colors.mcWhite2}
        />
      </Pressable>
      <GestureDetector gesture={zoomGesture}>
        <View
          style={styles.scrubberTrack}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        >
          <View
            style={[
              styles.scrubberTrackBg,
              { backgroundColor: colors.mcBlack3 },
            ]}
          />
          <Animated.View
            style={[
              styles.scrubberFill,
              { backgroundColor: colors.mcWhite2 },
              fillStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.scrubberThumb,
              { backgroundColor: colors.mcWhite2 },
              thumbStyle,
            ]}
          >
            <Icon icon={Icons.search} size={10} color={colors.mcBlack} />
          </Animated.View>
        </View>
      </GestureDetector>
      <Text
        variant="extraSmall10SemiBold"
        color={colors.mcWhite3}
        style={styles.scrubberZoomLabel}
      >
        {Math.round(displayZoom * 100)}%
      </Text>
    </View>
  );
});

// ─── ClipEditorView (Container) ─────────────────────────────────────────────

export interface ClipEditorViewProps {
  clip: Clip;
  instrumentType: InstrumentType;
  samples?: Sample[];
  isPlaying?: boolean;
  isRecording?: boolean;
  isMetronomeEnabled?: boolean;
  /** Returns the current playhead beat from the transport clock.
   *  Sampled when playback starts or the timing scale changes; frame-by-frame
   *  interpolation stays on the UI thread. */
  getBeatPosition?: () => number;
  canUndo?: boolean;
  canRedo?: boolean;
  callbacks?: ClipEditorCallbacks;
  /** Show DrumPadsView or PianoKeyboard in the bottom half (default: true). Hidden when expanded. */
  showPerformanceControls?: boolean;
  /** Callbacks for drum pad press/release (used when instrumentType === 'drum') */
  drumPadCallbacks?: DrumPadCallbacks;
  /** Callbacks for piano key press/release (used when instrumentType === 'melodic' | 'bass') */
  pianoKeyCallbacks?: PianoKeyCallbacks;
  /** Notes currently pressed externally (e.g. MIDI input), highlighted on pads/keyboard */
  externalPressedNotes?: Set<number>;
  /** Base MIDI note for melodic/bass tracks (from soundbank defaultOctave). Falls back to 48 (C3). */
  melodicMinPitch?: number;
  onBack?: () => void;
  onPlayPause?: () => void;
  onToggleRecord?: () => void;
  onToggleMetronome?: () => void;
  onClipLengthIncrease?: () => void;
  onClipLengthDecrease?: () => void;
  /** Change which bar-range within the clip actively plays back (0-indexed start, length in bars) */
  onSetActiveBarRange?: (start: number, length: number) => void;
  /** Duplicate the first bar when adding the second bar. */
  onDuplicateBar?: (barIndex: number) => void;
  onShowSettings?: () => void;
  /** Recording count-in remaining (3, 2, 1, null) */
  recordingCountIn?: number | null;
  /** Current tempo — passed to clip settings modal */
  tempo?: number;
  /** Whether to show note names on piano keyboard */
  showPianoNoteNames?: boolean;
  /** Whether dragging notes to move/resize snaps to the step grid. Placing a
   *  new note always snaps regardless — matches the melodic-sequencer reference. */
  snapToGrid?: boolean;
  onTempoChange?: (bpm: number) => void;
  onTogglePianoNoteNames?: () => void;
  onToggleSnapToGrid?: () => void;
  /** Drum clips only — toggles whether notes can be resized longer */
  onToggleLockNoteDuration?: () => void;
  /** Notes currently held during live recording (this clip only) — shown as
   * a growing "in progress" preview on the piano roll. */
  recordingNotes?: RecordingNotePreviewData[];
}

export const ClipEditorView = memo(function ClipEditorView({
  clip,
  instrumentType,
  samples,
  isPlaying,
  isRecording,
  isMetronomeEnabled,
  getBeatPosition,
  canUndo = false,
  canRedo = false,
  callbacks,
  showPerformanceControls = true,
  drumPadCallbacks,
  pianoKeyCallbacks,
  externalPressedNotes,
  melodicMinPitch = DEFAULT_MELODIC_MIN_PITCH,
  onBack,
  onPlayPause,
  onToggleRecord,
  onToggleMetronome,
  onClipLengthIncrease,
  onClipLengthDecrease,
  onSetActiveBarRange,
  onDuplicateBar,
  recordingCountIn,
  tempo = 120,
  showPianoNoteNames = false,
  snapToGrid = false,
  onTempoChange,
  onTogglePianoNoteNames,
  onToggleSnapToGrid,
  onToggleLockNoteDuration,
  recordingNotes,
}: ClipEditorViewProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedPitchIndex, setSelectedPitchIndex] = useState<number | null>(
    null
  );
  const [settingsVisible, setSettingsVisible] = useState(false);
  // Seeded for the actual initial zoom (1 bar visible at zoom=1 — the
  // grid always shows exactly 1/zoom bars regardless of screen width), not
  // the whole clip — otherwise the locator strip below shows full-width
  // and looks disconnected from the view until the first scroll or zoom.
  const [visibleBarRange, setVisibleBarRange] = useState<{
    start: number;
    end: number;
  }>({
    start: 0,
    end: Math.min(1, clip.lengthInBars),
  });
  const beatWidth = ((screenWidth - LABEL_COL_WIDTH) / 16) * zoom * 4;
  const trackColor = clip.colorHex;
  const samplesList = samples || [];

  const handleVisibleBeatRangeChange = useCallback(
    (startBeat: number, endBeat: number) => {
      // Fractional bars, not floor/ceil'd to whole ones — the ClipLengthBar
      // locator draws this as a proportional strip width, so rounding to whole
      // bars here would make it look frozen at "1 bar" for any zoom above 1x
      // (anything under 1 full bar always ceils to 1).
      setVisibleBarRange({ start: startBeat / 4, end: endBeat / 4 });
    },
    []
  );

  // Changing zoom changes beatWidth, so the same scroll-x pixel offset would
  // otherwise land on a different beat after the fact — anchor to whatever
  // beat currently sits at the left edge (from lastGridX, already tracked for
  // the grid↔panel scroll sync) and re-apply it once the new beatWidth lands
  // on the next render, so zooming doesn't yank the view to a different part
  // of the clip.
  const zoomAnchorBeatRef = useRef<number | null>(null);
  const handleZoomChange = useCallback(
    (newZoom: number) => {
      zoomAnchorBeatRef.current =
        beatWidth > 0 ? lastGridX.current / beatWidth : 0;
      setZoom(Math.max(1, Math.min(3, newZoom)));
    },
    [beatWidth]
  );
  useEffect(() => {
    if (zoomAnchorBeatRef.current == null) return;
    const anchorBeat = zoomAnchorBeatRef.current;
    zoomAnchorBeatRef.current = null;
    const x = anchorBeat * beatWidth;
    lastGridX.current = x;
    gridRef.current?.scrollToX(x, false);
  }, [zoom, beatWidth]);

  // Live velocity value while a NotePrecisionPanel velocity handle is being
  // dragged — bridged over to the piano roll grid below so that note's color
  // updates in real time instead of only once the drag releases (the drag
  // itself only commits to the undo-tracked store on release, same as every
  // other gesture in this editor).
  const [velocityPreview, setVelocityPreview] = useState<{
    noteIndex: number;
    velocity: number;
  } | null>(null);
  const handleVelocityPreview = useCallback(
    (noteIndex: number, velocity: number | null) => {
      setVelocityPreview(velocity == null ? null : { noteIndex, velocity });
    },
    []
  );

  // ── Piano roll ↔ NotePrecisionPanel scroll sync ──────────────────────────
  // Both share the same beat-to-pixel scale (stepWidth={beatWidth / 4}), so
  // their scroll-x offsets line up 1:1 — no beat conversion needed. Each
  // scroll handler mirrors its position onto the other view, guarded by the
  // last-synced position so mirroring a scroll doesn't immediately bounce
  // back and forth.
  const gridRef = useRef<SkiaPianoRollGridHandle>(null);
  const panelRef = useRef<NotePrecisionPanelHandle>(null);
  const lastGridX = useRef(0);
  const lastPanelX = useRef(0);
  const handleGridScrollX = useCallback((x: number) => {
    if (Math.abs(x - lastPanelX.current) < 0.5) return;
    lastGridX.current = x;
    panelRef.current?.scrollToX(x, false);
  }, []);
  const handlePanelScrollX = useCallback((x: number) => {
    if (Math.abs(x - lastGridX.current) < 0.5) return;
    lastPanelX.current = x;
    gridRef.current?.scrollToX(x, false);
  }, []);

  // Selecting a bar on the ClipLengthBar jumps the piano roll there. The
  // isolation effect below also handles range changes from tap and drag.
  const handleNavigateToBar = useCallback(
    (barIndex: number) => {
      const targetX = barIndex * 4 * beatWidth;
      lastGridX.current = targetX;
      gridRef.current?.scrollToX(targetX, true);
      panelRef.current?.scrollToX(targetX, true);
    },
    [beatWidth]
  );

  // ── Scroll the grid (and, via the sync above, the precision panel) to the
  // isolated bar whenever isolation changes ──────────────────────────────
  const isSingleBarLoop =
    clip.activeLengthInBars === 1 && clip.lengthInBars > 1;
  useEffect(() => {
    if (!isSingleBarLoop) return;
    const targetX = clip.activeBarStart * 4 * beatWidth;
    lastGridX.current = targetX;
    gridRef.current?.scrollToX(targetX, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-scroll when isolation itself changes, not on every beatWidth-affecting zoom tick
  }, [isSingleBarLoop, clip.activeBarStart]);

  // The precision panel only mounts once a pitch is selected, so it starts
  // scrolled to 0 even if the grid above has already scrolled elsewhere —
  // pull it into sync as soon as it appears.
  useEffect(() => {
    if (selectedPitchIndex == null) return;
    panelRef.current?.scrollToX(lastGridX.current, false);
  }, [selectedPitchIndex]);

  // ── Playhead transport clock (DAW-style frame-pull) ──────────────────────
  // Sample the transport clock on JS only when playback/timing changes. The
  // UI-thread frame callback interpolates pixel position between those seeds,
  // so JS scheduling cannot make the line stutter.
  // The grid spans the clip's full length, but playback loops within just
  // the active bar range — so the wrapped beat is offset back into the
  // full-clip coordinate space before converting to a pixel position.
  const clipBeats = clip.activeLengthInBars * 4;
  const activeStartBeat = clip.activeBarStart * 4;
  const playheadPosX = useSharedValue(0);
  const playheadBeatAtStart = useSharedValue(0);
  const playheadFrameStart = useSharedValue(-1);
  // Memoized so unrelated re-renders (e.g. a note edited mid-recording)
  // don't change this closure's identity — useFrameCallback re-registers
  // the callback with the native frame-callback registry every time its
  // function reference changes (see Reanimated's useFrameCallback: the
  // registration effect depends on `[callback, autostart]`), which would
  // otherwise churn the frame loop and risk a dropped/duplicated frame
  // right as playback and editing overlap.
  const playheadFrameCallback = useCallback(
    ({ timestamp }: { timestamp: number }) => {
      'worklet';
      if (playheadFrameStart.value < 0) {
        playheadFrameStart.value = timestamp;
      }

      const elapsedMs = timestamp - playheadFrameStart.value;
      const beat = playheadBeatAtStart.value + (elapsedMs * tempo) / 60000;
      const wrapped = clipBeats > 0 ? beat % clipBeats : 0;
      playheadPosX.value = (wrapped + activeStartBeat) * beatWidth;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- SharedValues are stable refs
    [tempo, clipBeats, activeStartBeat, beatWidth]
  );
  const playheadFrame = useFrameCallback(playheadFrameCallback, false);

  useEffect(() => {
    if (!isPlaying || !getBeatPosition) {
      playheadFrame.setActive(false);
      playheadFrameStart.value = -1;
      playheadPosX.value = 0;
      return;
    }

    // Seed once from the transport clock, then let the UI-thread frame
    // callback interpolate between frames without depending on JS rAF timing.
    playheadBeatAtStart.value = getBeatPosition();
    playheadFrameStart.value = -1;
    playheadFrame.setActive(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- SharedValues and frame handle are stable refs
  }, [
    isPlaying,
    getBeatPosition,
    clipBeats,
    activeStartBeat,
    beatWidth,
    tempo,
  ]);

  // Stable references for SkiaPianoRollGrid's callback props — inline arrow
  // functions here would recreate on every ClipEditorView render (e.g. a
  // toolbar-only state change like play/pause) and silently defeat that
  // component's memo(), forcing a full re-render — and, before the grid's
  // own gestures were memoized, a gesture-recognizer rebuild — for state
  // changes that have nothing to do with the grid.
  const handleNotePress = useCallback(
    (idx: number) => callbacks?.onNoteDelete?.(idx),
    [callbacks]
  );
  const handleNoteResize = useCallback(
    (idx: number, newDuration: number) =>
      callbacks?.onNoteResize?.(idx, newDuration),
    [callbacks]
  );
  const handleNoteMove = useCallback(
    (idx: number, newPos: number, newNote: number) =>
      callbacks?.onNoteMove?.(idx, newPos, newNote),
    [callbacks]
  );
  const handleGridTap = useCallback(
    (noteNumber: number, position: number) => {
      callbacks?.onNoteAdd?.({
        noteNumber,
        velocity: 100,
        position,
        duration: 0.25,
      });
    },
    [callbacks]
  );
  const handlePitchLabelTap = useCallback((pitch: number) => {
    setSelectedPitchIndex((current) => (current === pitch ? null : pitch));
  }, []);
  const handleToggleExpand = useCallback(() => {
    setIsExpanded((current) => !current);
  }, []);

  // iOS: PerformanceControlsView visible when config.isPerformanceControlsVisible && !isExpanded
  const shouldShowPerformanceControls =
    showPerformanceControls && !isExpanded && instrumentType !== 'audio';

  // iOS: velocity lane only shows when a pitch label is tapped (selectedPitchForEditing)
  const showVelocityLane = selectedPitchIndex != null && !isExpanded;
  const showCountIn = recordingCountIn != null;

  return (
    <View style={[styles.container, { backgroundColor: colors.mcBlack }]}>
      {/* Top section: toolbar + piano roll + clip length bar
       * Always flex:1. When bottom half renders (not expanded), they split 50/50.
       * When expanded, bottom is hidden → top gets 100%. */}
      <View style={styles.splitHalf}>
        {/* Toolbar */}
        <ClipEditorToolbar
          isPlaying={isPlaying}
          isRecording={isRecording}
          isMetronomeEnabled={isMetronomeEnabled}
          canUndo={canUndo}
          canRedo={canRedo}
          onBack={onBack || callbacks?.onClose}
          onPlayPause={onPlayPause}
          onRecord={onToggleRecord}
          onMetronome={onToggleMetronome}
          onUndo={callbacks?.onUndo}
          onRedo={callbacks?.onRedo}
          onSettings={() => setSettingsVisible(true)}
        />

        {/* Piano Roll (Skia GPU-rendered) + Playhead */}
        <WithHint hintID={HintIDs.pianoRoll} style={{ flex: 1 }}>
          <View style={{ flex: 1, position: 'relative' }}>
            <SkiaPianoRollGrid
              ref={gridRef}
              notes={clip.notes}
              samples={samplesList}
              instrumentType={instrumentType}
              trackColor={trackColor}
              lengthInBeats={clip.lengthInBars * 4}
              zoomLevel={zoom}
              isExpanded={isExpanded}
              selectedPitchIndex={selectedPitchIndex}
              melodicMinPitch={melodicMinPitch}
              onNotePress={handleNotePress}
              onNoteResize={handleNoteResize}
              onNoteMove={handleNoteMove}
              onGridTap={handleGridTap}
              onPitchLabelTap={handlePitchLabelTap}
              onToggleExpand={handleToggleExpand}
              onZoomChange={handleZoomChange}
              showControls={false}
              showNoteLabels={showPianoNoteNames}
              snapToGrid={snapToGrid}
              lockNoteDuration={clip.lockNoteDuration}
              recordingNotes={recordingNotes}
              isPlaying={isPlaying}
              playheadPosX={playheadPosX}
              onVisibleBeatRangeChange={handleVisibleBeatRangeChange}
              onScrollXChange={handleGridScrollX}
              velocityPreview={velocityPreview}
            />
          </View>
        </WithHint>

        {/* Zoom / pan scrubber — replaces the old floating zoom+expand
         * controls that used to sit on top of the grid. Not gated on
         * isExpanded (unlike ClipLengthBar below): the expand button has to
         * stay reachable in expanded mode too, or there'd be no way back. */}
        <ZoomScrubber
          zoom={zoom}
          isExpanded={isExpanded}
          onToggleExpand={handleToggleExpand}
          onZoomChange={handleZoomChange}
        />

        {/* Clip Length Bar — stays visible in expanded mode too, same as the
         * zoom scrubber above: there'd be no way to change the active range
         * or bar count while expanded otherwise. */}
        <ClipLengthBar
          lengthInBars={clip.lengthInBars}
          activeBarStart={clip.activeBarStart}
          activeLengthInBars={clip.activeLengthInBars}
          trackColor={trackColor}
          notes={clip.notes}
          visibleBarRange={visibleBarRange}
          onIncrease={onClipLengthIncrease}
          onDecrease={onClipLengthDecrease}
          onSetActiveBarRange={onSetActiveBarRange}
          onDuplicateBar={onDuplicateBar}
          onNavigateToBar={handleNavigateToBar}
        />
      </View>

      {/* Bottom half: either NotePrecisionPanel (velocity editing) or PerformanceControls (pads/piano)
       * iOS: when selectedPitchForEditing != nil → NotePrecisionPanel replaces performance controls
       *       when nil → PerformanceControlsView (drum→PadsView, melodic/bass→TeenagePianoView) */}
      {!isExpanded && (
        <View style={styles.splitHalf}>
          {showVelocityLane ? (
            <NotePrecisionPanel
              ref={panelRef}
              notes={clip.notes}
              pitchIndex={selectedPitchIndex!}
              pitchLabel={(() => {
                const isDrum = instrumentType === 'drum';
                if (isDrum)
                  return (
                    (samples || [])[selectedPitchIndex!]?.name ??
                    `Note ${selectedPitchIndex}`
                  );
                const basePitch = melodicMinPitch;
                return `${NOTE_NAMES[(basePitch + selectedPitchIndex!) % 12]}${Math.floor((basePitch + selectedPitchIndex!) / 12) + 1}`;
              })()}
              pitchMidiNumber={(() => {
                if (instrumentType === 'drum')
                  return (
                    (samples || [])[selectedPitchIndex!]?.noteNumber ??
                    selectedPitchIndex!
                  );
                return melodicMinPitch + selectedPitchIndex!;
              })()}
              activeLengthInBars={clip.lengthInBars}
              trackColor={trackColor}
              stepWidth={beatWidth / 4}
              onClose={() => setSelectedPitchIndex(null)}
              onVelocityChange={callbacks?.onVelocityChange}
              onVelocityPreview={handleVelocityPreview}
              onPositionChange={(idx, newPos) =>
                callbacks?.onNoteMove?.(
                  idx,
                  newPos,
                  clip.notes[idx]?.noteNumber ?? 0
                )
              }
              onDurationChange={(idx, newDur) =>
                callbacks?.onNoteResize?.(idx, newDur)
              }
              onScrollXChange={handlePanelScrollX}
            />
          ) : shouldShowPerformanceControls ? (
            instrumentType === 'drum' ? (
              <DrumPadsView
                samples={samplesList}
                onPadPress={drumPadCallbacks?.onPadPress}
                onPadRelease={drumPadCallbacks?.onPadRelease}
                externalPressedNotes={externalPressedNotes}
                highlightColor={trackColor}
              />
            ) : (
              <PianoKeyboard
                numberOfOctaves={2}
                showNoteNames={showPianoNoteNames}
                onNoteOn={
                  pianoKeyCallbacks?.onKeyPress
                    ? (noteIndex: number) =>
                        pianoKeyCallbacks.onKeyPress?.(
                          noteIndex + melodicMinPitch,
                          100
                        )
                    : undefined
                }
                onNoteOff={
                  pianoKeyCallbacks?.onKeyRelease
                    ? (noteIndex: number) =>
                        pianoKeyCallbacks.onKeyRelease?.(
                          noteIndex + melodicMinPitch
                        )
                    : undefined
                }
                externalPressedNotes={externalPressedNotes}
                highlightColor={trackColor}
              />
            )
          ) : null}
        </View>
      )}
      {/* Recording count-in overlay — matches iOS: big orange number in circle */}
      {showCountIn && (
        <View style={styles.countInOverlay} pointerEvents="none">
          <View style={styles.countInCircle}>
            <Text variant="h1" color={colors.mcOrange}>
              {recordingCountIn}
            </Text>
          </View>
        </View>
      )}

      {/* Clip Settings Modal */}
      <ClipSettingsModal
        visible={settingsVisible}
        tempo={tempo}
        isMetronomeEnabled={isMetronomeEnabled ?? false}
        showNoteLabels={showPianoNoteNames}
        snapToGrid={snapToGrid}
        showLockNoteDuration={instrumentType === 'drum'}
        lockNoteDuration={clip.lockNoteDuration ?? true}
        onClose={() => setSettingsVisible(false)}
        onTempoChange={onTempoChange}
        onToggleMetronome={onToggleMetronome}
        onToggleNoteLabels={onTogglePianoNoteNames}
        onToggleSnapToGrid={onToggleSnapToGrid}
        onToggleLockNoteDuration={onToggleLockNoteDuration}
      />
    </View>
  );
});

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  /** iOS: splitHeight = availableHeight * 0.5 — each half gets equal flex */
  splitHalf: { flex: 1 },
  countInOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  countInCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  /** Full content when performance controls are hidden */
  fullContent: { flex: 1 },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
    gap: makeSpacing(4),
  },
  toolbarSpacer: { flex: 1 },
  toolbarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: makeSpacing(4),
  },

  // Clip length bar — mcBlack bg, continuous bar-segment strip
  clipLengthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: BAR_HEIGHT + LOCATOR_HEIGHT + LOCATOR_GAP,
  },
  clipLengthEndBtn: {
    width: BAR_BTN_W,
    height: BAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clipLengthMain: { flex: 1, justifyContent: 'center' },
  clipLengthLocatorTrack: {
    height: LOCATOR_HEIGHT,
    marginTop: LOCATOR_GAP,
    position: 'relative',
  },
  clipLengthLocatorFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 0,
  },
  clipLengthNumbers: { flexDirection: 'row', height: BAR_HEIGHT },
  clipLengthSegment: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  clipLengthSegmentNum: {
    position: 'absolute',
    top: 2,
    left: 3,
  },
  clipLengthDash: {
    position: 'absolute',
    width: 4,
    height: 2,
    borderRadius: 1,
    marginLeft: -2,
    marginTop: -1,
  },

  // Zoom scrubber
  scrubberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: SCRUBBER_HEIGHT,
    paddingHorizontal: spacing.xxs,
    gap: spacing.xl,
  },
  scrubberExpandBtn: {
    width: SCRUBBER_HEIGHT,
    height: SCRUBBER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrubberTrack: {
    flex: 1,
    height: SCRUBBER_HEIGHT,
    justifyContent: 'center',
  },
  scrubberTrackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 1.5,
  },
  scrubberFill: {
    position: 'absolute',
    left: 0,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.6,
  },
  scrubberThumb: {
    position: 'absolute',
    width: SCRUBBER_THUMB_SIZE,
    height: SCRUBBER_THUMB_SIZE,
    borderRadius: SCRUBBER_THUMB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrubberZoomLabel: {
    minWidth: 34,
    textAlign: 'right',
  },
});

export { ClipEditorToolbar, ClipLengthBar };
