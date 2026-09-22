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
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useFrameCallback,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Text } from '../../../../components/Text';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { useTheme, hexToRgba } from '../../../../theme';
import { typography } from '../../../../theme/typography';
import { makeSpacing, spacing } from '../../../../theme/spacing';
import { ClipSettingsModal } from './ClipSettingsModal';
import { DrumPadsView } from '../DrumPads/DrumPadsView';
import { PianoKeyboard } from '../PianoKeyboard/PianoKeyboard';
import { SkiaPianoRollGrid } from '../../../../components/PianoRoll';
import { getMelodicPitchRange } from '../../../../components/PianoRoll/pianoRollPitchRange';
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
import {
  isEditorCapabilityAllowed,
  useResolvedEditorPolicy,
  type EditorPolicy,
  type PianoRollGuidance,
} from '../../stores/editorPolicy';

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
  canPlay?: boolean;
  hideTransport?: boolean;
  canRecord?: boolean;
  /** False when the policy withholds recording outright — hides the control. */
  showRecord?: boolean;
  canMetronome?: boolean;
  /** False when the policy withholds the metronome outright — hides the control. */
  showMetronome?: boolean;
  canOpenSettings?: boolean;
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
  canPlay = true,
  hideTransport = false,
  canRecord = true,
  showRecord = true,
  canMetronome = true,
  showMetronome = true,
  canOpenSettings = true,
}: ClipEditorToolbarProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.toolbar, { backgroundColor: colors.mcBlack2 }]}>
      <Pressable onPress={onBack} hitSlop={8} accessibilityLabel="Back">
        <Icon icon={Icons.back} size={22} color={colors.mcGray} />
      </Pressable>

      <View style={styles.toolbarSpacer} />

      <View style={styles.toolbarCenter}>
        {!hideTransport ? (
          <>
            <Pressable
              onPress={onPlayPause}
              disabled={canPlay ? undefined : true}
              hitSlop={8}
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              accessibilityState={canPlay ? undefined : { disabled: true }}
            >
              <Icon
                icon={isPlaying ? Icons.pause : Icons.play}
                size={22}
                color={colors.mcWhite}
              />
            </Pressable>
            {/* A capability the policy withholds outright takes its control
             * away rather than leaving a dead one in the toolbar. Controls that
             * are merely unavailable right now stay put and disable. */}
            {showRecord ? (
              <Pressable
                onPress={onRecord}
                disabled={canRecord ? undefined : true}
                hitSlop={8}
                accessibilityLabel="Record"
                accessibilityState={canRecord ? undefined : { disabled: true }}
              >
                <Icon
                  icon={Icons.record}
                  size={22}
                  color={isRecording ? colors.mcPink : colors.mcWhite}
                />
              </Pressable>
            ) : null}
            {showMetronome ? (
              <Pressable
                onPress={onMetronome}
                disabled={canMetronome ? undefined : true}
                hitSlop={8}
                accessibilityLabel="Metronome"
                accessibilityState={
                  canMetronome ? undefined : { disabled: true }
                }
              >
                <Icon
                  icon={
                    isMetronomeEnabled ? Icons.metronomeOn : Icons.metronomeOff
                  }
                  size={22}
                  color={colors.mcWhite}
                />
              </Pressable>
            ) : null}
          </>
        ) : null}
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

      <Pressable
        onPress={onSettings}
        disabled={canOpenSettings ? undefined : true}
        hitSlop={8}
        accessibilityLabel="Settings"
        accessibilityState={canOpenSettings ? undefined : { disabled: true }}
      >
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
  /** UI-runtime, 0-indexed, half-open visible bar range from the grid above. */
  visibleBarStart?: SharedValue<number>;
  visibleBarEnd?: SharedValue<number>;
  onSetActiveBarRange?: (start: number, length: number) => void;
  onDecrease?: () => void;
  onIncrease?: () => void;
  /** Duplicate the first bar when adding the second bar. */
  onDuplicateBar?: (barIndex: number) => void;
  /** Scroll the piano roll to the focused (0-indexed) bar */
  onNavigateToBar?: (barIndex: number) => void;
  editable?: boolean;
}

const BAR_HEIGHT = 28;
const BAR_BTN_W = 34;
const LOCATOR_HEIGHT = 2;
const LOCATOR_GAP = 0;

/** Return the inclusive bar range between two 0-based bar indices. */
export const rangeForBarDrag = (from: number, to: number): [number, number] => {
  'worklet';
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
  dashes: { xFrac: number; yFrac: number; wFrac: number }[];
  /** Takes the 0-indexed bar so the parent can pass one stable callback —
   * an inline `() => onFocus(i)` per segment would change identity on every
   * ClipLengthBar render and defeat this component's memo(). */
  onFocus?: (barIndex: number) => void;
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
      accessibilityState={
        onFocus
          ? { selected: isFocused }
          : { selected: isFocused, disabled: true }
      }
      onAccessibilityTap={() => onFocus?.(barIndex - 1)}
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
              width: `${d.wFrac * 100}%`,
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
  visibleBarStart,
  visibleBarEnd,
  onSetActiveBarRange,
  onDecrease,
  onIncrease,
  onDuplicateBar,
  onNavigateToBar,
  editable = true,
}: ClipLengthBarProps) {
  const { colors } = useTheme();
  const barCount = Math.max(1, lengthInBars);
  const [stripWidth, setStripWidth] = useState(0);
  const [focusedBarIndex, setFocusedBarIndex] = useState<number | null>(null);
  // The in-progress range highlight lives on the UI runtime: crossing a bar
  // boundary mid-drag moves an overlay instead of re-rendering every segment.
  // React only hears about the drag twice — once to hand the highlight over to
  // the overlay, once to commit the range.
  const [isRangeDragging, setIsRangeDragging] = useState(false);
  const previewStart = useSharedValue(0);
  const previewLength = useSharedValue(0);
  const dragStartBar = useSharedValue(0);
  const lastDragBar = useSharedValue(-1);
  const fallbackVisibleBarStart = useSharedValue(0);
  const fallbackVisibleBarEnd = useSharedValue(barCount);
  const locatorStart = visibleBarStart ?? fallbackVisibleBarStart;
  const locatorEnd = visibleBarEnd ?? fallbackVisibleBarEnd;
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
  const beginDrag = useCallback(() => setIsRangeDragging(true), []);
  const finishDrag = useCallback(
    (from: number, to: number) => {
      setFocusedBarIndex(to);
      setIsRangeDragging(false);
      const [start, length] = rangeForBarDrag(from, to);
      onSetActiveBarRange?.(start, length);
    },
    [onSetActiveBarRange]
  );
  const cancelDrag = useCallback(() => setIsRangeDragging(false), []);
  const barStripGesture = useMemo(() => {
    const drag = Gesture.Pan()
      .enabled(editable)
      .activeOffsetX([-8, 8])
      .failOffsetY([-12, 12])
      .onStart((e) => {
        'worklet';
        const index = barIndexAtX(e.x - e.translationX, stripWidth, barCount);
        dragStartBar.value = index;
        lastDragBar.value = index;
        previewStart.value = index;
        previewLength.value = 1;
        scheduleOnRN(beginDrag);
      })
      .onUpdate((e) => {
        'worklet';
        const index = barIndexAtX(e.x, stripWidth, barCount);
        if (index === lastDragBar.value) return;
        lastDragBar.value = index;
        const [start, length] = rangeForBarDrag(dragStartBar.value, index);
        previewStart.value = start;
        previewLength.value = length;
      })
      .onEnd((e) => {
        'worklet';
        const index = barIndexAtX(e.x, stripWidth, barCount);
        scheduleOnRN(finishDrag, dragStartBar.value, index);
      })
      .onFinalize((_e, success) => {
        'worklet';
        // Covers the cancelled gesture too, which never reaches onEnd.
        previewLength.value = 0;
        if (!success) scheduleOnRN(cancelDrag);
      });
    const tap = Gesture.Tap()
      .enabled(true)
      .onEnd((e, success) => {
        'worklet';
        if (success)
          scheduleOnRN(handleBarTap, barIndexAtX(e.x, stripWidth, barCount));
      });
    return Gesture.Exclusive(drag, tap);
  }, [
    barCount,
    stripWidth,
    editable,
    handleBarTap,
    beginDrag,
    finishDrag,
    cancelDrag,
    previewStart,
    previewLength,
    dragStartBar,
    lastDragBar,
  ]);

  // Mini note-thumbnail per bar — mirrors the piano roll above. Pitch is
  // normalized against the clip's own min/max pitch so the shape stays
  // legible regardless of instrument range.
  const notesByBar = useMemo(() => {
    const perBar: { xFrac: number; yFrac: number; wFrac: number }[][] = Array.from(
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
      const noteStartBeat = n.position;
      const noteEndBeat = n.position + n.duration;
      const startBar = Math.floor(noteStartBeat / 4);
      if (startBar >= barCount || noteEndBeat <= noteStartBeat) continue;
      const yFrac = Math.min(0.85, Math.max(0.15, 1 - (n.noteNumber - minPitch) / pitchSpan));
      // A note ending exactly on a bar boundary shouldn't spill an extra
      // (zero-width) dash into the bar it's touching but not sounding in.
      const lastBar = Math.min(barCount - 1, Math.ceil(noteEndBeat / 4) - 1);
      for (let bar = Math.max(0, startBar); bar <= lastBar; bar++) {
        const barStartBeat = bar * 4;
        // Only the note's own starting bar gets an inset x — every bar it
        // carries into after that is covered from the bar's left edge.
        const xFrac =
          bar === startBar ? Math.min(0.92, Math.max(0, (noteStartBeat - barStartBeat) / 4)) : 0;
        const segEndBeat = Math.min(noteEndBeat, barStartBeat + 4);
        const wFrac = Math.max(0, Math.min(1 - xFrac, (segEndBeat - barStartBeat) / 4 - xFrac));
        perBar[bar]?.push({ xFrac, yFrac, wFrac });
      }
    }
    return perBar;
  }, [notes, barCount]);

  const rangePreviewStyle = useAnimatedStyle(() => {
    const length = previewLength.value;
    return {
      opacity: length > 0 ? 1 : 0,
      transform: [
        { translateX: (previewStart.value / barCount) * stripWidth },
        { scaleX: length / barCount },
      ],
    };
  });

  const locatorStyle = useAnimatedStyle(() => {
    const start = Math.max(0, Math.min(barCount, locatorStart.value));
    const end = Math.max(start, Math.min(barCount, locatorEnd.value));
    return {
      transform: [
        { translateX: (start / barCount) * stripWidth },
        { scaleX: (end - start) / barCount },
      ],
    };
  });

  return (
    <View style={[styles.clipLengthBar, { backgroundColor: colors.mcBlack }]}>
      {/* A lesson that fixes the clip length takes these controls away rather
       * than leaving two dead buttons framing the bar. `canRemove` is a
       * moment-to-moment limit (one bar left), so that one still dims. */}
      {editable ? (
        <Pressable
          onPress={onDecrease}
          disabled={!canRemove}
          style={[
            styles.clipLengthEndBtn,
            { backgroundColor: colors.mcBlack, opacity: canRemove ? 1 : 0.4 },
          ]}
          accessibilityLabel="Remove bar"
          accessibilityState={!canRemove ? { disabled: true } : undefined}
        >
          <Icon icon={Icons.minus} size={12} color={colors.mcWhite2} />
        </Pressable>
      ) : null}

      <View style={styles.clipLengthMain}>
        {/* Bar segments: tap selects one bar; horizontal drag selects a range. */}
        <GestureDetector gesture={barStripGesture}>
          <View
            style={styles.clipLengthNumbers}
            onLayout={(event) => setStripWidth(event.nativeEvent.layout.width)}
          >
            {Array.from({ length: barCount }, (_, i) => {
              const isActive =
                !isRangeDragging &&
                i >= activeBarStart &&
                i < activeBarStart + activeLengthInBars;
              return (
                <ClipLengthBarSegment
                  key={i}
                  barIndex={i + 1}
                  isActive={isActive}
                  isFocused={focusedBarIndex === i}
                  isLast={i === barCount - 1}
                  trackColor={trackColor}
                  dashes={notesByBar[i] ?? []}
                  onFocus={handleBarTap}
                />
              );
            })}
            {/* In-progress range highlight — same tint the segments use, drawn
             * from shared values so a drag never re-renders them. */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.clipLengthRangePreview,
                { backgroundColor: hexToRgba(trackColor, 0.35) },
                rangePreviewStyle,
              ]}
            />
          </View>
        </GestureDetector>

        {/* Locator — read-only, mirrors the visible piano-roll range */}
        <View style={styles.clipLengthLocatorTrack}>
          <Animated.View
            style={[
              styles.clipLengthLocatorFill,
              { backgroundColor: colors.mcWhite2 },
              locatorStyle,
            ]}
          />
        </View>
      </View>

      {editable ? (
        <Pressable
          onPress={handlePlusPress}
          disabled={!canAdd}
          style={[
            styles.clipLengthEndBtn,
            { backgroundColor: colors.mcBlack, opacity: canAdd ? 1 : 0.4 },
          ]}
          accessibilityLabel="Add bar"
          accessibilityState={!canAdd ? { disabled: true } : undefined}
        >
          <Icon icon={Icons.plus} size={12} color={colors.mcWhite2} />
        </Pressable>
      ) : null}
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

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface ZoomScrubberProps {
  zoom: number;
  isExpanded: boolean;
  /** False when the bottom half has nothing to collapse into, so the toggle
   * would be a control that visibly does nothing. */
  canToggleExpand: boolean;
  onToggleExpand: () => void;
  onZoomChange: (zoom: number) => void;
  /** Live zoom relative to the committed `zoom`, written on the UI runtime
   * while the handle is dragged. The piano roll and precision panel scale
   * themselves by it so the grid tracks the handle continuously — matching
   * the native editor — and adopt the real geometry when the drag commits. */
  zoomPreview: SharedValue<number>;
}

const ZoomScrubber = memo(function ZoomScrubber({
  zoomPreview,
  zoom,
  isExpanded,
  canToggleExpand,
  onToggleExpand,
  onZoomChange,
}: ZoomScrubberProps) {
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const [displayZoom, setDisplayZoom] = useState(zoom);

  // The gesture reads onZoomChange through a ref rather than closing over it
  // directly, and is built once via useMemo — not recreated on every render.
  // The thumb stays on the UI thread during the drag; React/grid state only
  // commits once on release.
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
          zoomPreview.value = z / zoom;
        })
        .onUpdate((e) => {
          'worklet';
          if (trackWidth <= 0) return;
          const fraction = Math.max(0, Math.min(1, e.x / trackWidth));
          const z =
            SCRUBBER_MIN_ZOOM +
            fraction * (SCRUBBER_MAX_ZOOM - SCRUBBER_MIN_ZOOM);
          liveZoom.value = z;
          zoomPreview.value = z / zoom;
        })
        .onEnd((e) => {
          'worklet';
          if (trackWidth <= 0) return;
          const fraction = Math.max(0, Math.min(1, e.x / trackWidth));
          const z =
            SCRUBBER_MIN_ZOOM +
            fraction * (SCRUBBER_MAX_ZOOM - SCRUBBER_MIN_ZOOM);
          scheduleOnRN(commitZoom, z);
        })
        .onFinalize((_e, success) => {
          'worklet';
          if (!success) liveZoom.value = zoom;
          // The committed zoom lands on the next React commit and replaces
          // the scaled preview with real geometry.
          zoomPreview.value = 1;
        }),
    [trackWidth, liveZoom, commitZoom, zoom, zoomPreview]
  );

  const zoomLabelProps = useAnimatedProps(() => ({
    text: `${Math.round(liveZoom.value * 100)}%`,
    defaultValue: `${Math.round(liveZoom.value * 100)}%`,
  }));

  const thumbStyle = useAnimatedStyle(() => {
    const fraction =
      (liveZoom.value - SCRUBBER_MIN_ZOOM) /
      (SCRUBBER_MAX_ZOOM - SCRUBBER_MIN_ZOOM);
    return {
      transform: [
        { translateX: fraction * trackWidth - SCRUBBER_THUMB_SIZE / 2 },
      ],
    };
  });
  const fillStyle = useAnimatedStyle(() => {
    const fraction =
      (liveZoom.value - SCRUBBER_MIN_ZOOM) /
      (SCRUBBER_MAX_ZOOM - SCRUBBER_MIN_ZOOM);
    return { width: fraction * trackWidth };
  });

  return (
    <View style={[styles.scrubberRow, { backgroundColor: colors.mcBlack }]}>
      {canToggleExpand ? (
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
      ) : (
        <View style={styles.scrubberExpandBtn} />
      )}
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
      {/* Percentage readout — an AnimatedTextInput so the number follows the
       * handle on the UI runtime instead of re-rendering per frame. */}
      <AnimatedTextInput
        animatedProps={zoomLabelProps}
        editable={false}
        pointerEvents="none"
        accessibilityLabel="Zoom level"
        // The live text comes from the UI runtime, which assistive tech can't
        // observe — expose the committed value for it explicitly.
        accessibilityValue={{ text: `${Math.round(displayZoom * 100)}%` }}
        defaultValue={`${Math.round(displayZoom * 100)}%`}
        style={[
          typography.extraSmall10SemiBold,
          styles.scrubberZoomLabel,
          { color: colors.mcWhite3 },
        ]}
      />
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
  /** Drum tracks only — launch the sampler to create and replace the current kit. */
  onSampleKit?: () => void;
  sampleKitButtonTestID?: string;
  /** Recording count-in remaining (3, 2, 1, null) */
  recordingCountIn?: number | null;
  /** Current tempo — passed to clip settings modal */
  tempo?: number;
  /** Whether to show note names on piano keyboard */
  showPianoNoteNames?: boolean;
  /** Whether placing or repitching a note sounds it. Defaults on. */
  auditionOnPlace?: boolean;
  /** Whether dragging notes to move/resize snaps to the step grid. Placing a
   *  new note always snaps regardless — matches the melodic-sequencer reference. */
  snapToGrid?: boolean;
  onTempoChange?: (bpm: number) => void;
  onTogglePianoNoteNames?: () => void;
  onToggleAuditionOnPlace?: () => void;
  onToggleSnapToGrid?: () => void;
  /** Drum clips only — toggles whether notes can be resized longer */
  onToggleLockNoteDuration?: () => void;
  /** Notes currently held during live recording (this clip only) — shown as
   * a growing "in progress" preview on the piano roll. */
  recordingNotes?: RecordingNotePreviewData[];
  editorPolicy?: EditorPolicy;
  guidance?: PianoRollGuidance;
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
  melodicMinPitch: keyboardMinPitch = DEFAULT_MELODIC_MIN_PITCH,
  onBack,
  onPlayPause,
  onToggleRecord,
  onToggleMetronome,
  onClipLengthIncrease,
  onClipLengthDecrease,
  onSetActiveBarRange,
  onDuplicateBar,
  onSampleKit,
  sampleKitButtonTestID,
  recordingCountIn,
  tempo = 120,
  showPianoNoteNames = false,
  auditionOnPlace = true,
  snapToGrid = false,
  onTempoChange,
  onTogglePianoNoteNames,
  onToggleAuditionOnPlace,
  onToggleSnapToGrid,
  onToggleLockNoteDuration,
  recordingNotes,
  editorPolicy,
  guidance,
}: ClipEditorViewProps) {
  const { colors } = useTheme();
  const policy = useResolvedEditorPolicy(editorPolicy);
  const canPlay = isEditorCapabilityAllowed(policy, 'transport');
  const canRecord = isEditorCapabilityAllowed(policy, 'recording');
  const canMetronome = isEditorCapabilityAllowed(policy, 'metronome');
  const canEditNotes = isEditorCapabilityAllowed(policy, 'notes');
  const canEditPrecision = isEditorCapabilityAllowed(policy, 'precision');
  const canEditVelocity = isEditorCapabilityAllowed(policy, 'velocity');
  const canQuantize = isEditorCapabilityAllowed(policy, 'quantize');
  const canEditClips = isEditorCapabilityAllowed(policy, 'clips');
  const canLiveRecord = isEditorCapabilityAllowed(policy, 'liveRecording');
  const canUndoRedo = isEditorCapabilityAllowed(policy, 'undoRedo');
  const canTempo = isEditorCapabilityAllowed(policy, 'tempo');
  const canSound = isEditorCapabilityAllowed(policy, 'sound');
  const { width: screenWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number>();
  const [isExpandedByUser, setIsExpandedByUser] = useState(false);
  const [zoom, setZoom] = useState(1);
  // Selection is a MIDI pitch, not a shifting row index. Reframing the grid
  // must not retarget precision edits. Drum selection remains a sample index.
  const [selectedPitch, setSelectedPitch] = useState<{
    clipID: Clip['id'];
    instrumentType: InstrumentType;
    value: number;
  } | null>(null);
  const selectedValue =
    selectedPitch?.instrumentType === instrumentType &&
    selectedPitch.clipID === clip.id
      ? selectedPitch.value
      : null;
  const melodicRange = useMemo(
    () =>
      instrumentType === 'drum'
        ? null
        : getMelodicPitchRange(
            keyboardMinPitch,
            clip.notes,
            guidance,
            selectedValue ?? undefined
          ),
    [instrumentType, keyboardMinPitch, clip.notes, guidance, selectedValue]
  );
  const melodicMinPitch = melodicRange?.minPitch ?? keyboardMinPitch;
  const selectedRow =
    selectedValue == null
      ? null
      : instrumentType === 'drum'
        ? selectedValue
        : selectedValue - melodicMinPitch;
  const selectedPitchIndex =
    selectedRow != null &&
    selectedRow >= 0 &&
    selectedRow < (melodicRange?.pitchCount ?? (samples?.length || 12))
      ? selectedRow
      : null;
  const [settingsVisible, setSettingsVisible] = useState(false);
  // The locator reads these values directly on the UI runtime while the
  // native ScrollView animates; scrolling never renders ClipEditorView.
  const visibleBarStart = useSharedValue(0);
  const visibleBarEnd = useSharedValue(Math.min(1, clip.lengthInBars));
  // Live zoom while the scrubber handle is dragged, as a ratio of the
  // committed zoom. 1 means "no preview, geometry is real".
  const zoomPreview = useSharedValue(1);
  // Single horizontal scroll source for the grid and the precision panel.
  // Whichever one the finger is on writes it; the other mirrors it with
  // Reanimated's scrollTo, so neither crosses to the RN runtime per frame.
  const sharedScrollX = useSharedValue(0);
  // 0 = the grid owns the scroll, 1 = the precision panel does.
  const scrollOwner = useSharedValue(0);
  const beatWidth =
    (Math.max(1, (containerWidth ?? screenWidth) - LABEL_COL_WIDTH) / 16) *
    zoom *
    4;
  const trackColor = clip.colorHex;
  const samplesList = samples || [];

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

  // Shared directly by both Skia surfaces: no React render or RN-runtime
  // round trip while a velocity handle follows the finger.
  const velocityPreviewNoteIndex = useSharedValue(-1);
  const velocityPreviewValue = useSharedValue(0);

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

  // Keep callback props stable across scroll/toolbar renders. The latest app
  // adapter and clip notes live behind refs; gestures only rebuild after real
  // geometry or note changes.
  const callbacksRef = useRef(callbacks);
  const pianoKeyCallbacksRef = useRef(pianoKeyCallbacks);
  const clipNotesRef = useRef(clip.notes);
  // Read through a ref so toggling the setting never rebuilds the memoised
  // grid gesture handlers.
  const auditionOnPlaceRef = useRef(auditionOnPlace);
  useEffect(() => {
    callbacksRef.current = callbacks;
    pianoKeyCallbacksRef.current = pianoKeyCallbacks;
    clipNotesRef.current = clip.notes;
    auditionOnPlaceRef.current = auditionOnPlace;
  }, [callbacks, pianoKeyCallbacks, clip.notes, auditionOnPlace]);
  const handleNotePress = useCallback(
    (idx: number) => {
      if (canEditNotes) callbacksRef.current?.onNoteDelete?.(idx);
    },
    [canEditNotes]
  );
  const handleNoteResize = useCallback(
    (idx: number, newDuration: number) => {
      if (canEditNotes) callbacksRef.current?.onNoteResize?.(idx, newDuration);
    },
    [canEditNotes]
  );
  const handleNoteMove = useCallback(
    (idx: number, newPos: number, newNote: number) => {
      if (!canEditNotes) return;
      const previousNote = clipNotesRef.current[idx]?.noteNumber;
      const accepted = callbacksRef.current?.onNoteMove?.(idx, newPos, newNote);
      if (
        accepted !== false &&
        previousNote !== newNote &&
        auditionOnPlaceRef.current
      ) {
        callbacksRef.current?.onAuditionNote?.(newNote);
      }
    },
    [canEditNotes]
  );
  const handleGridTap = useCallback(
    (noteNumber: number, position: number) => {
      if (!canEditNotes) return;
      const accepted = callbacksRef.current?.onNoteAdd?.({
        noteNumber,
        velocity: 100,
        position,
        duration: 0.25,
      });
      if (accepted !== false && auditionOnPlaceRef.current) {
        callbacksRef.current?.onAuditionNote?.(noteNumber);
      }
    },
    [canEditNotes]
  );
  const handleVelocityChange = useCallback(
    (idx: number, velocity: number) => {
      if (canEditPrecision && canEditVelocity)
        callbacksRef.current?.onVelocityChange?.(idx, velocity);
    },
    [canEditPrecision, canEditVelocity]
  );
  const handlePrecisionPositionChange = useCallback(
    (idx: number, newPosition: number) => {
      if (!canEditPrecision || !canEditNotes) return;
      callbacksRef.current?.onNoteMove?.(
        idx,
        newPosition,
        clipNotesRef.current[idx]?.noteNumber ?? 0
      );
    },
    [canEditPrecision, canEditNotes]
  );
  const handlePrecisionDurationChange = useCallback(
    (idx: number, newDuration: number) => {
      if (canEditPrecision && canEditNotes)
        callbacksRef.current?.onNoteResize?.(idx, newDuration);
    },
    [canEditPrecision, canEditNotes]
  );
  const handleClosePrecision = useCallback(() => {
    setSelectedPitch(null);
  }, []);
  const handlePitchLabelTap = useCallback(
    (pitch: number) => {
      const value = instrumentType === 'drum' ? pitch : pitch + melodicMinPitch;
      setSelectedPitch((current) =>
        current?.clipID === clip.id &&
        current.instrumentType === instrumentType &&
        current.value === value
          ? null
          : { clipID: clip.id, instrumentType, value }
      );
    },
    [clip.id, instrumentType, melodicMinPitch]
  );
  const handleToggleExpand = useCallback(() => {
    setIsExpandedByUser((current) => !current);
  }, []);
  // Fitting the piano roll is visual only; don't transpose the existing
  // performance keyboard or change the caller's pressed-key mapping.
  const handlePianoNoteOn = useCallback(
    (noteIndex: number) =>
      pianoKeyCallbacksRef.current?.onKeyPress?.(
        noteIndex + keyboardMinPitch,
        100
      ),
    [keyboardMinPitch]
  );
  const handlePianoNoteOff = useCallback(
    (noteIndex: number) =>
      pianoKeyCallbacksRef.current?.onKeyRelease?.(
        noteIndex + keyboardMinPitch
      ),
    [keyboardMinPitch]
  );

  // The bottom half hosts either the performance controls or the velocity lane.
  // Pads and keys go inert when the policy withholds `liveRecording`, so a
  // lesson that only wants piano-roll editing would otherwise surrender half
  // the editor to a grid nobody can touch. When neither occupant is available
  // the roll takes the full height instead.
  const performanceControlsAvailable =
    showPerformanceControls && canLiveRecord && instrumentType !== 'audio';
  const bottomHalfHasContent =
    performanceControlsAvailable || selectedPitchIndex != null;
  const isExpanded = isExpandedByUser || !bottomHalfHasContent;

  // iOS: PerformanceControlsView visible when config.isPerformanceControlsVisible && !isExpanded
  const shouldShowPerformanceControls =
    performanceControlsAvailable && !isExpanded;

  // iOS: velocity lane only shows when a pitch label is tapped (selectedPitchForEditing)
  const showVelocityLane = selectedPitchIndex != null && !isExpanded;
  const showCountIn = recordingCountIn != null;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.mcBlack }]}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      {/* Top section: toolbar + piano roll + clip length bar
       * Always flex:1. When bottom half renders (not expanded), they split 50/50.
       * When expanded, bottom is hidden → top gets 100%. */}
      <View style={styles.splitHalf}>
        {/* Toolbar */}
        <ClipEditorToolbar
          isPlaying={isPlaying}
          isRecording={isRecording}
          isMetronomeEnabled={isMetronomeEnabled}
          canUndo={canUndo && canUndoRedo}
          canRedo={canRedo && canUndoRedo}
          onBack={onBack || callbacks?.onClose}
          onPlayPause={canPlay ? onPlayPause : undefined}
          onRecord={canRecord ? onToggleRecord : undefined}
          onMetronome={canMetronome ? onToggleMetronome : undefined}
          onUndo={canUndoRedo ? callbacks?.onUndo : undefined}
          onRedo={canUndoRedo ? callbacks?.onRedo : undefined}
          onSettings={() => setSettingsVisible(true)}
          canPlay={canPlay}
          hideTransport={policy.hideTransport}
          canRecord={canRecord}
          showRecord={policy.capabilities?.recording !== false}
          canMetronome={canMetronome}
          showMetronome={policy.capabilities?.metronome !== false}
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
              melodicPitchCount={melodicRange?.pitchCount}
              editable={canEditNotes}
              guidance={guidance}
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
              lockNoteDuration={
                instrumentType === 'drum' && (clip.lockNoteDuration ?? true)
              }
              recordingNotes={recordingNotes}
              isPlaying={isPlaying}
              playheadPosX={playheadPosX}
              visibleBarStart={visibleBarStart}
              visibleBarEnd={visibleBarEnd}
              scrollX={sharedScrollX}
              scrollOwner={scrollOwner}
              zoomPreview={zoomPreview}
              onScrollXChange={handleGridScrollX}
              velocityPreviewNoteIndex={
                showVelocityLane ? velocityPreviewNoteIndex : undefined
              }
              velocityPreviewValue={
                showVelocityLane ? velocityPreviewValue : undefined
              }
            />
          </View>
        </WithHint>

        {/* Zoom / pan scrubber — replaces the old floating zoom+expand
         * controls that used to sit on top of the grid. Not gated on
         * isExpanded (unlike ClipLengthBar below): the expand button has to
         * stay reachable in expanded mode too, or there'd be no way back. */}
        <ZoomScrubber
          zoom={zoom}
          zoomPreview={zoomPreview}
          isExpanded={isExpanded}
          canToggleExpand={bottomHalfHasContent}
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
          visibleBarStart={visibleBarStart}
          visibleBarEnd={visibleBarEnd}
          editable={canEditClips}
          onIncrease={canEditClips ? onClipLengthIncrease : undefined}
          onDecrease={canEditClips ? onClipLengthDecrease : undefined}
          onSetActiveBarRange={canEditClips ? onSetActiveBarRange : undefined}
          onDuplicateBar={canEditClips ? onDuplicateBar : undefined}
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
              snapToGrid={snapToGrid}
              lockNoteDuration={
                instrumentType === 'drum' && (clip.lockNoteDuration ?? true)
              }
              onClose={handleClosePrecision}
              editable={canEditPrecision && canEditNotes}
              velocityEditable={canEditPrecision && canEditVelocity}
              onVelocityChange={handleVelocityChange}
              velocityPreviewNoteIndex={velocityPreviewNoteIndex}
              velocityPreviewValue={velocityPreviewValue}
              onPositionChange={handlePrecisionPositionChange}
              onDurationChange={handlePrecisionDurationChange}
              scrollX={sharedScrollX}
              scrollOwner={scrollOwner}
              zoomPreview={zoomPreview}
              onScrollXChange={handlePanelScrollX}
            />
          ) : shouldShowPerformanceControls ? (
            instrumentType === 'drum' ? (
              <DrumPadsView
                samples={samplesList}
                disabled={canLiveRecord ? undefined : true}
                editorPolicy={policy}
                onPadPress={drumPadCallbacks?.onPadPress}
                onPadRelease={drumPadCallbacks?.onPadRelease}
                externalPressedNotes={externalPressedNotes}
                highlightColor={trackColor}
              />
            ) : (
              <PianoKeyboard
                numberOfOctaves={2}
                showNoteNames={showPianoNoteNames}
                disabled={canLiveRecord ? undefined : true}
                editorPolicy={policy}
                onNoteOn={handlePianoNoteOn}
                onNoteOff={handlePianoNoteOff}
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
        onTempoChange={canTempo ? onTempoChange : undefined}
        onToggleMetronome={canMetronome ? onToggleMetronome : undefined}
        onToggleNoteLabels={onTogglePianoNoteNames}
        auditionOnPlace={auditionOnPlace}
        onToggleAuditionOnPlace={onToggleAuditionOnPlace}
        onToggleSnapToGrid={canQuantize ? onToggleSnapToGrid : undefined}
        onToggleLockNoteDuration={
          canEditNotes ? onToggleLockNoteDuration : undefined
        }
        onSampleKit={
          instrumentType === 'drum' && canSound ? onSampleKit : undefined
        }
        canTempo={canTempo}
        canMetronome={canMetronome}
        canEditNotes={canEditNotes}
        canQuantize={canQuantize}
        canSound={canSound}
        sampleKitButtonTestID={sampleKitButtonTestID}
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
    ...StyleSheet.flatten(StyleSheet.absoluteFill),
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
    left: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    transformOrigin: 'left center',
  },
  clipLengthNumbers: { flexDirection: 'row', height: BAR_HEIGHT },
  clipLengthRangePreview: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    transformOrigin: 'left center',
  },
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
    minWidth: 4,
    height: 2,
    borderRadius: 1,
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
    left: 0,
    width: SCRUBBER_THUMB_SIZE,
    height: SCRUBBER_THUMB_SIZE,
    borderRadius: SCRUBBER_THUMB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrubberZoomLabel: {
    minWidth: 34,
    textAlign: 'right',
    // A TextInput's default line box is taller than this row and would clip
    // the digits — pin it to the row height and drop the platform padding.
    height: BAR_HEIGHT,
    paddingVertical: 0,
    paddingHorizontal: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export { ClipEditorToolbar, ClipLengthBar };
