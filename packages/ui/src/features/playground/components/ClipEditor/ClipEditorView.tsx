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
  View,
  ScrollView as RNScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {
  ScrollView,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Text } from '../../../../components/Text';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { useTheme, hexToRgba } from '../../../../theme';
import { makeSpacing, spacing } from '../../../../theme/spacing';
import { MidiNoteView } from './MidiNoteView';
import { ClipSettingsModal } from './ClipSettingsModal';
import { DrumPadsView } from '../DrumPads/DrumPadsView';
import { PianoKeyboard } from '../PianoKeyboard/PianoKeyboard';
import { SkiaPianoRollGrid } from '../../../../components/PianoRoll';
import type { RecordingNotePreviewData, SkiaPianoRollGridHandle } from '../../../../components/PianoRoll';
import { NotePrecisionPanel } from '../../../../components/NotePrecisionPanel';
import type { NotePrecisionPanelHandle } from '../../../../components/NotePrecisionPanel';
import { Modal } from '../../../../components/Modal';
import { Button } from '../../../../components/Button';
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

// ─── PianoRoll Grid ─────────────────────────────────────────────────────────

interface PianoRollGridProps {
  notes: ClipNote[];
  samples?: Sample[];
  instrumentType?: InstrumentType;
  trackColor: string;
  lengthInBeats: number;
  rowHeight?: number;
  zoomLevel?: number;
  playheadPosition?: number;
  isExpanded?: boolean;
  selectedPitchIndex?: number | null;
  /** Base MIDI note for melodic/bass pitch range (from soundbank defaultOctave). Falls back to 48 (C3). */
  melodicMinPitch?: number;
  onNotePress?: (index: number) => void;
  onNoteResize?: (index: number, newDuration: number) => void;
  onNoteMove?: (
    index: number,
    newPosition: number,
    newNoteNumber: number
  ) => void;
  onGridTap?: (noteNumber: number, position: number) => void;
  onPitchLabelTap?: (pitch: number) => void;
  onToggleExpand?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

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

/** Returns a human-readable note name like "C4" or "D#5" for a MIDI pitch value. */
const getNoteName = (pitch: number): string => {
  const noteName = NOTE_NAMES[pitch % 12];
  const octave = Math.floor(pitch / 12) + 1;
  return `${noteName}${octave}`;
};

// ─── Playhead ───────────────────────────────────────────────────────────────

/**
 * Playhead driven by the sequencer clock. One source of truth.
 *
 * Playhead driven by the transport clock (DAW-style frame-pull model).
 *
 * The parent runs a requestAnimationFrame loop that reads the transport
 * clock at display frame rate (~60fps) and writes the pixel position
 * directly to a SharedValue. No React props updated at 60fps, no
 * withTiming interpolation, no events from the audio engine.
 *
 * The playhead position IS the sequencer position — direct and accurate.
 */
const PlayheadLine = memo(function PlayheadLine({
  posX,
  color,
}: {
  /** Pixel X position driven by rAF loop reading the transport clock. */
  posX: Animated.SharedValue<number>;
  color: string;
}) {
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: posX.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: LABEL_COL_WIDTH,
          top: 0,
          bottom: 0,
          width: 2,
          backgroundColor: color,
          zIndex: 10,
        },
        animStyle,
      ]}
    />
  );
});

// ─── PianoRoll Grid ─────────────────────────────────────────────────────────

/** Width of the pitch label column in the piano roll grid */
const LABEL_COL_WIDTH = 60;

/** Default MIDI pitch range for melodic/bass tracks (2 octaves starting at C3 = MIDI 48).
 *  Can be overridden per-track via the `melodicMinPitch` prop on ClipEditorView. */
const DEFAULT_MELODIC_MIN_PITCH = 48;
const MELODIC_PITCH_COUNT = 24;

const PianoRollGrid = memo(function PianoRollGrid({
  notes,
  samples,
  instrumentType = 'drum',
  trackColor,
  lengthInBeats,
  rowHeight = 34,
  zoomLevel = 1,
  isExpanded,
  selectedPitchIndex,
  melodicMinPitch,
  onNotePress,
  onNoteResize,
  onNoteMove,
  onGridTap,
  onPitchLabelTap,
  onToggleExpand,
  onZoomIn,
  onZoomOut,
}: PianoRollGridProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const isDrum = instrumentType === 'drum';

  // Effective base pitch for melodic/bass: use soundbank's defaultOctave when available
  const basePitch = isDrum ? 0 : (melodicMinPitch ?? DEFAULT_MELODIC_MIN_PITCH);

  // Calculate pitch range: drums use sample count, melodic/bass use fixed 2-octave range
  const totalPitches = isDrum
    ? (samples ?? []).length || 12 // Use exact sample count (no minimum)
    : MELODIC_PITCH_COUNT;

  // iOS: baseWidth = availableGridWidth / 16 (steps per bar)
  // At zoom 1.0, one bar fills the available width exactly.
  const availableGridWidth = screenWidth - LABEL_COL_WIDTH;
  const STEPS_PER_BAR = 16;
  const baseStepWidth = availableGridWidth / STEPS_PER_BAR;
  const stepWidth = baseStepWidth * zoomLevel;
  const BEAT_WIDTH = stepWidth * 4; // 4 steps per beat
  const gridHeight = totalPitches * rowHeight;

  // pitchToMidi: maps pitchIdx (0 = bottom/lowest) → MIDI note number
  // Drums: each index maps to the sample's noteNumber
  // Melodic/bass: linear from basePitch (soundbank defaultOctave)
  const pitchToMidi: number[] = isDrum
    ? Array.from(
        { length: totalPitches },
        (_, i) => (samples ?? [])[i]?.noteNumber ?? i
      )
    : Array.from({ length: totalPitches }, (_, i) => basePitch + i);

  /**
   * Get label for a pitch row.
   * - Drum: sample.name (human readable, e.g. "Kick", "Hi-Hat Closed")
   * - Melodic/Bass: note name (e.g. "C4", "D#5")
   */
  const getPitchLabel = (pitchIdx: number): string => {
    if (isDrum) {
      const sample = (samples ?? [])[pitchIdx];
      return sample?.name ?? `Note ${pitchIdx}`;
    }
    return getNoteName(basePitch + pitchIdx);
  };

  /**
   * Check if a pitch row contains any notes.
   * - Drum: map pitchIdx → sample.noteNumber, then search notes
   * - Melodic/Bass: pitchIdx maps directly to MIDI note number
   */
  /**
   * iOS: defaultRowColor = title.isNotEmpty ? color : color.opacity(0.6)
   * Pitch "has a name" if the label text is a real name (not a fallback).
   */
  const pitchHasName = (pitchIdx: number): boolean => {
    const label = getPitchLabel(pitchIdx);
    return !label.startsWith('Note ');
  };

  return (
    <View style={styles.pianoRollContainer}>
      {/* iOS layout: single vertical ScrollView wrapping HStack(labels, horizontalScrollGrid)
       * Labels and grid scroll vertically TOGETHER.
       * Grid also scrolls horizontally inside a nested horizontal ScrollView. */}
      <ScrollView style={styles.pianoRollContent}>
        <View style={styles.pianoRollRow}>
          {/* Fixed-width pitch labels column — scrolls vertically with grid */}
          <View style={[styles.pitchLabels, { width: LABEL_COL_WIDTH }]}>
            {Array.from({ length: totalPitches }, (_, i) => {
              const pitchIdx = totalPitches - 1 - i;
              const hasName = pitchHasName(pitchIdx);
              return (
                <Pressable
                  key={pitchIdx}
                  onPress={() => onPitchLabelTap?.(pitchIdx)}
                  style={[
                    styles.pitchLabel,
                    {
                      height: rowHeight,
                      backgroundColor:
                        selectedPitchIndex === pitchIdx
                          ? colors.mcOrange
                          : hasName
                            ? trackColor
                            : hexToRgba(trackColor, 0.6),
                    },
                  ]}
                >
                  <Text
                    variant="extraSmall"
                    color={colors.mcBlack}
                    numberOfLines={2}
                    style={styles.pitchLabelText}
                  >
                    {getPitchLabel(pitchIdx)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Grid — scrolls horizontally, fills remaining width */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.gridScroll}
          >
            <View
              style={{
                width: lengthInBeats * BEAT_WIDTH,
                height: gridHeight,
                position: 'relative',
              }}
            >
              {/* Grid rows — tappable to add notes */}
              {Array.from({ length: totalPitches }, (_, i) => {
                const pitchIdx = totalPitches - 1 - i;
                return (
                  <Pressable
                    key={`r${i}`}
                    onPress={(e) => {
                      if (!onGridTap) return;
                      // Compute which step was tapped from touch X
                      const tapX = e.nativeEvent.locationX;
                      const step = Math.floor(tapX / stepWidth);
                      const position = step * 0.25; // 16th note = 0.25 beats

                      // Map pitchIdx → MIDI note number
                      let noteNumber: number;
                      if (isDrum) {
                        const sample = (samples ?? [])[pitchIdx];
                        noteNumber = sample?.noteNumber ?? pitchIdx;
                      } else {
                        noteNumber = basePitch + pitchIdx;
                      }
                      onGridTap(noteNumber, position);
                    }}
                    style={{
                      position: 'absolute',
                      top: i * rowHeight,
                      left: 0,
                      right: 0,
                      height: rowHeight,
                      borderBottomWidth: 0.5,
                      borderBottomColor: colors.mcBlack4,
                      backgroundColor:
                        i % 2 === 0 ? colors.mcBlack : colors.mcBlack2,
                    }}
                  />
                );
              })}
              {/* Step lines — 16th note subdivisions matching iOS grid */}
              {Array.from({ length: lengthInBeats * 4 + 1 }, (_, i) => {
                const isBar = i % 16 === 0;
                const isBeat = i % 4 === 0;
                return (
                  <View
                    key={`s${i}`}
                    style={{
                      position: 'absolute',
                      left: i * stepWidth,
                      top: 0,
                      bottom: 0,
                      width: isBar ? 1.5 : isBeat ? 1 : 0.5,
                      backgroundColor: isBar
                        ? 'rgba(255,255,255,0.25)'
                        : isBeat
                          ? 'rgba(255,255,255,0.12)'
                          : 'rgba(255,255,255,0.04)',
                    }}
                  />
                );
              })}
              {/* Notes — gesture-driven MidiNoteView (native thread) */}
              {notes.map((note, idx) => {
                let pitchIdx: number;
                if (isDrum) {
                  const sampleIdx = (samples ?? []).findIndex(
                    (s) => s.noteNumber === note.noteNumber
                  );
                  pitchIdx = sampleIdx >= 0 ? sampleIdx : 0;
                } else {
                  pitchIdx = note.noteNumber - basePitch;
                }
                const rowIdx = totalPitches - 1 - pitchIdx;
                return (
                  <MidiNoteView
                    key={`${note.noteNumber}-${note.position}-${idx}`}
                    position={note.position}
                    duration={note.duration}
                    noteNumber={note.noteNumber}
                    rowIndex={rowIdx}
                    beatWidth={BEAT_WIDTH}
                    rowHeight={rowHeight}
                    stepWidth={stepWidth}
                    color={trackColor}
                    label={!isDrum ? getNoteName(note.noteNumber) : undefined}
                    noteIndex={idx}
                    onDelete={onNotePress}
                    onResize={onNoteResize}
                    onMove={onNoteMove}
                    totalPitches={totalPitches}
                    pitchToMidi={pitchToMidi}
                  />
                );
              })}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Zoom controls — iOS: individual buttons with black.opacity(0.6) bg, rounded, 36x36 */}
      <View style={styles.zoomControls}>
        <Pressable onPress={onToggleExpand} style={styles.zoomBtn}>
          <Icon
            icon={isExpanded ? Icons.collapse : Icons.expand}
            size={14}
            color={colors.mcWhite}
          />
        </Pressable>
        <Pressable onPress={onZoomIn} style={styles.zoomBtn}>
          <Icon icon={Icons.zoomIn} size={14} color={colors.mcWhite} />
        </Pressable>
        <View style={styles.zoomLabel}>
          <Text variant="extraSmall10" color={colors.mcWhite} center>
            {Math.round(zoomLevel * 100)}%
          </Text>
        </View>
        <Pressable onPress={onZoomOut} style={styles.zoomBtn}>
          <Icon icon={Icons.zoomOut} size={14} color={colors.mcWhite} />
        </Pressable>
      </View>
    </View>
  );
});

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
 * - Long-press a bar → isolates that bar (useful while playing)
 * - Active (in loop range): translucent mcOrange tint
 * - Focused: white outline; focus is independent from the loop range
 * - Inactive: mcBlack3 bg
 * - When a single bar is isolated, minus/plus become trash/duplicate acting
 *   on that one bar instead of the clip's total length
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
  /** Delete the given (0-indexed) bar — only offered while it's isolated */
  onDeleteBar?: (barIndex: number) => void;
  /** Duplicate the given (0-indexed) bar right after itself — only offered while it's isolated */
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
  onDeleteBar,
  onDuplicateBar,
  onNavigateToBar,
}: ClipLengthBarProps) {
  const { colors } = useTheme();
  const barCount = Math.max(1, lengthInBars);
  // A 1-bar clip's only bar is never "isolated" — it already is the whole
  // clip, so the +/- buttons stay as add/remove rather than duplicate/trash.
  const [stripWidth, setStripWidth] = useState(0);
  const [focusedBarIndex, setFocusedBarIndex] = useState<number | null>(null);
  const [dragPreview, setDragPreview] = useState<[number, number] | null>(null);
  const dragStartBar = useSharedValue(0);
  const lastDragBar = useSharedValue(-1);
  // Going from 1 to 2 bars is ambiguous — ask whether the new bar should be
  // empty or a copy of the only bar that exists so far.
  const [showAddBarPrompt, setShowAddBarPrompt] = useState(false);

  const displayActiveBarStart = dragPreview?.[0] ?? activeBarStart;
  const displayActiveLength = dragPreview?.[1] ?? activeLengthInBars;
  const isIsolated = displayActiveLength === 1 && barCount > 1;
  const canAdd = barCount < 16;
  const canRemove = barCount > 1;

  const handlePlusPress = useCallback(() => {
    if (isIsolated) {
      onDuplicateBar?.(displayActiveBarStart);
    } else if (barCount === 1) {
      setShowAddBarPrompt(true);
    } else {
      onIncrease?.();
    }
  }, [isIsolated, barCount, displayActiveBarStart, onDuplicateBar, onIncrease]);

  const handleBarTap = useCallback(
    (i: number) => {
      setFocusedBarIndex(i);
      onNavigateToBar?.(i);
    },
    [onNavigateToBar]
  );
  const handleBarLongPress = useCallback(
    (i: number) => {
      setFocusedBarIndex(i);
      onSetActiveBarRange?.(i, 1);
    },
    [onSetActiveBarRange]
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
    const longPress = Gesture.LongPress()
      .minDuration(500)
      .onStart((e) => {
        'worklet';
        scheduleOnRN(
          handleBarLongPress,
          barIndexAtX(e.x, stripWidth, barCount)
        );
      });
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
    return Gesture.Exclusive(longPress, drag, tap);
  }, [
    barCount,
    stripWidth,
    handleBarLongPress,
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
      {/* Minus button — becomes trash while a single bar is isolated */}
      <Pressable
        onPress={() =>
          isIsolated ? onDeleteBar?.(displayActiveBarStart) : onDecrease?.()
        }
        disabled={!canRemove}
        style={[
          styles.clipLengthEndBtn,
          { backgroundColor: colors.mcBlack, opacity: canRemove ? 1 : 0.4 },
        ]}
        accessibilityLabel={isIsolated ? 'Delete bar' : 'Remove bar'}
      >
        <Icon
          icon={isIsolated ? Icons.trash : Icons.minus}
          size={12}
          color={colors.mcWhite2}
        />
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

      {/* Plus button — becomes duplicate while a single bar is isolated */}
      <Pressable
        onPress={handlePlusPress}
        disabled={!canAdd}
        style={[
          styles.clipLengthEndBtn,
          { backgroundColor: colors.mcBlack, opacity: canAdd ? 1 : 0.4 },
        ]}
        accessibilityLabel={isIsolated ? 'Duplicate bar' : 'Add bar'}
      >
        <Icon
          icon={isIsolated ? Icons.duplicate : Icons.plus}
          size={12}
          color={colors.mcWhite2}
        />
      </Pressable>

      <Modal
        visible={showAddBarPrompt}
        title="Add Bar"
        onClose={() => setShowAddBarPrompt(false)}
      >
        <View style={{ gap: makeSpacing(2) }}>
          <Button
            variant="secondary"
            label="Empty Bar"
            fullWidth
            onPress={() => {
              setShowAddBarPrompt(false);
              onIncrease?.();
            }}
          />
          <Button
            variant="primary"
            label="Duplicate Bar 1"
            fullWidth
            onPress={() => {
              setShowAddBarPrompt(false);
              onDuplicateBar?.(0);
            }}
          />
        </View>
      </Modal>
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
          const z = SCRUBBER_MIN_ZOOM + fraction * (SCRUBBER_MAX_ZOOM - SCRUBBER_MIN_ZOOM);
          liveZoom.value = z;
          runOnJS(commitZoom)(z);
        })
        .onUpdate((e) => {
          'worklet';
          if (trackWidth <= 0) return;
          const fraction = Math.max(0, Math.min(1, e.x / trackWidth));
          const z = SCRUBBER_MIN_ZOOM + fraction * (SCRUBBER_MAX_ZOOM - SCRUBBER_MIN_ZOOM);
          liveZoom.value = z;
          runOnJS(commitZoom)(z);
        }),
    [trackWidth, liveZoom, commitZoom]
  );

  const thumbStyle = useAnimatedStyle(() => {
    const fraction =
      (liveZoom.value - SCRUBBER_MIN_ZOOM) / (SCRUBBER_MAX_ZOOM - SCRUBBER_MIN_ZOOM);
    return { left: fraction * trackWidth - SCRUBBER_THUMB_SIZE / 2 };
  });
  const fillStyle = useAnimatedStyle(() => {
    const fraction =
      (liveZoom.value - SCRUBBER_MIN_ZOOM) / (SCRUBBER_MAX_ZOOM - SCRUBBER_MIN_ZOOM);
    return { width: fraction * trackWidth };
  });

  return (
    <View style={[styles.scrubberRow, { backgroundColor: colors.mcBlack }]}>
      <Pressable
        onPress={onToggleExpand}
        style={styles.scrubberExpandBtn}
        accessibilityLabel={isExpanded ? 'Collapse piano roll' : 'Expand piano roll'}
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
            style={[styles.scrubberTrackBg, { backgroundColor: colors.mcBlack3 }]}
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
      <Text variant="extraSmall10SemiBold" color={colors.mcWhite3} style={styles.scrubberZoomLabel}>
        {Math.round(displayZoom * 100)}%
      </Text>
    </View>
  );
});

// ─── Velocity Lane ──────────────────────────────────────────────────────────
// Matches SwiftUI VelocityLaneView: stem+handle pattern, VEL label column,
// velocity values ON TOP of bars in orange, beat markers above notes row

// ─── Velocity Bar (drag-to-edit) ────────────────────────────────────────────

const VelocityBar = memo(function VelocityBar({
  index,
  velocity,
  barHeight,
  trackColor,
  onChange,
}: {
  index: number;
  velocity: number;
  barHeight: number;
  trackColor: string;
  onChange?: (index: number, velocity: number) => void;
}) {
  const { colors } = useTheme();
  const dragVel = useSharedValue(velocity);
  const isDragging = useSharedValue(false);

  const commitVelocity = useCallback(
    (vel: number) => {
      onChange?.(index, vel);
    },
    [index, onChange]
  );

  const drag = Gesture.Pan()
    .onStart(() => {
      'worklet';
      isDragging.value = true;
      dragVel.value = velocity;
    })
    .onUpdate((e) => {
      'worklet';
      // Drag up = increase, drag down = decrease
      const delta = -e.translationY * (127 / barHeight);
      dragVel.value = Math.round(Math.max(1, Math.min(127, velocity + delta)));
    })
    .onEnd(() => {
      'worklet';
      isDragging.value = false;
      runOnJS(commitVelocity)(dragVel.value);
    });

  const barStyle = useAnimatedStyle(() => ({
    height: ((isDragging.value ? dragVel.value : velocity) / 127) * barHeight,
  }));

  const displayVel = velocity;

  return (
    <GestureDetector gesture={drag}>
      <View style={styles.velBarCol}>
        <Text
          variant="extraSmall"
          color={colors.mcOrange}
          bold
          style={styles.velValueLabel}
        >
          {displayVel}
        </Text>
        <Animated.View
          style={[styles.velBar, { backgroundColor: trackColor }, barStyle]}
        />
      </View>
    </GestureDetector>
  );
});

// ─── Velocity Lane ──────────────────────────────────────────────────────────

interface VelocityLaneProps {
  notes: ClipNote[];
  trackColor: string;
  selectedNoteName?: string;
  activeLengthInBars?: number;
  onClose?: () => void;
  onVelocityChange?: (index: number, velocity: number) => void;
}

const VelocityLane = memo(function VelocityLane({
  notes,
  trackColor,
  selectedNoteName,
  activeLengthInBars = 1,
  onClose,
  onVelocityChange,
}: VelocityLaneProps) {
  const { colors } = useTheme();
  const BAR_HEIGHT = 200;
  const Y_LABELS = [127, 95, 64, 32];
  const totalBeats = activeLengthInBars * 4;

  return (
    <View
      style={[
        styles.velocityLane,
        { backgroundColor: colors.mcBlack, borderTopColor: colors.mcBlack4 },
      ]}
    >
      {/* Header — selected note name + close X */}
      <View style={styles.velocityHeader}>
        <Text variant="label" bold>
          {selectedNoteName || 'Velocity'}
        </Text>
        {onClose && (
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={styles.velCloseBtn}
            accessibilityLabel="Close velocity"
          >
            <Icon icon={Icons.close} size={18} color={colors.mcWhite3} />
          </Pressable>
        )}
      </View>

      {/* Beat markers: 1.1, 1.2, 1.3, 1.4 */}
      <RNScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.velContent}>
          <View style={styles.velBeatMarkers}>
            <View style={{ width: 50 }} />
            {Array.from({ length: totalBeats }, (_, i) => (
              <Text
                key={i}
                variant="extraSmall"
                color={colors.mcWhite3}
                center
                style={styles.velBeatLabel}
              >
                {Math.floor(i / 4) + 1}.{(i % 4) + 1}
              </Text>
            ))}
          </View>

          {/* NOTES row — colored blocks matching piano roll */}
          <View style={styles.velNotesRow}>
            <Text
              variant="extraSmall"
              color={colors.mcWhite3}
              style={styles.velLabel}
            >
              NOTES
            </Text>
            <View style={styles.velNoteBlocksRow}>
              {notes.map((_note, i) => (
                <View
                  key={i}
                  style={[styles.velNoteBlock, { backgroundColor: trackColor }]}
                >
                  <View
                    style={{
                      width: 1,
                      height: '60%',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                    }}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Velocity bars — values ON TOP in orange, bars below */}
          <View style={styles.velBarsArea}>
            <View style={styles.velYAxisCol}>
              <Text variant="extraSmall" color={colors.mcWhite3}>
                VEL
              </Text>
              {Y_LABELS.map((v) => (
                <Text
                  key={v}
                  variant="extraSmall"
                  color={colors.mcWhite3}
                  style={styles.velYLabel}
                >
                  {v}
                </Text>
              ))}
            </View>
            <View style={[styles.velBarsRow, { height: BAR_HEIGHT }]}>
              {notes.map((_n, i) => (
                <VelocityBar
                  key={i}
                  index={i}
                  velocity={notes[i]!.velocity}
                  barHeight={BAR_HEIGHT}
                  trackColor={trackColor}
                  onChange={onVelocityChange}
                />
              ))}
            </View>
          </View>
        </View>
      </RNScrollView>
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
  /** Returns current playhead beat position from the transport clock.
   *  Called at ~60fps by internal rAF loop during playback.
   *  Replaces the old beatPosition event-driven prop with DAW-style frame-pull. */
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
  /** Delete the given (0-indexed) bar */
  onDeleteBar?: (barIndex: number) => void;
  /** Duplicate the given (0-indexed) bar right after itself */
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
  onDeleteBar,
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
  const [visibleBarRange, setVisibleBarRange] = useState<{ start: number; end: number }>({
    start: 0,
    end: Math.min(1, clip.lengthInBars),
  });
  const beatWidth = ((screenWidth - LABEL_COL_WIDTH) / 16) * zoom * 4;
  const trackColor = clip.colorHex;
  const samplesList = samples || [];

  const handleVisibleBeatRangeChange = useCallback((startBeat: number, endBeat: number) => {
    // Fractional bars, not floor/ceil'd to whole ones — the ClipLengthBar
    // locator draws this as a proportional strip width, so rounding to whole
    // bars here would make it look frozen at "1 bar" for any zoom above 1x
    // (anything under 1 full bar always ceils to 1).
    setVisibleBarRange({ start: startBeat / 4, end: endBeat / 4 });
  }, []);

  // Changing zoom changes beatWidth, so the same scroll-x pixel offset would
  // otherwise land on a different beat after the fact — anchor to whatever
  // beat currently sits at the left edge (from lastGridX, already tracked for
  // the grid↔panel scroll sync) and re-apply it once the new beatWidth lands
  // on the next render, so zooming doesn't yank the view to a different part
  // of the clip.
  const zoomAnchorBeatRef = useRef<number | null>(null);
  const handleZoomChange = useCallback(
    (newZoom: number) => {
      zoomAnchorBeatRef.current = beatWidth > 0 ? lastGridX.current / beatWidth : 0;
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
  const isIsolated = clip.activeLengthInBars === 1 && clip.lengthInBars > 1;
  useEffect(() => {
    if (!isIsolated) return;
    const targetX = clip.activeBarStart * 4 * beatWidth;
    lastGridX.current = targetX;
    gridRef.current?.scrollToX(targetX, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-scroll when isolation itself changes, not on every beatWidth-affecting zoom tick
  }, [isIsolated, clip.activeBarStart]);

  // The precision panel only mounts once a pitch is selected, so it starts
  // scrolled to 0 even if the grid above has already scrolled elsewhere —
  // pull it into sync as soon as it appears.
  useEffect(() => {
    if (selectedPitchIndex == null) return;
    panelRef.current?.scrollToX(lastGridX.current, false);
  }, [selectedPitchIndex]);

  // ── Playhead transport clock (DAW-style frame-pull) ──────────────────────
  // The playhead reads the transport clock at display frame rate via rAF,
  // writing the pixel position directly to a SharedValue. No React props
  // at 60fps, no withTiming interpolation, no audio engine events.
  // The grid spans the clip's full length, but playback loops within just
  // the active bar range — so the wrapped beat is offset back into the
  // full-clip coordinate space before converting to a pixel position.
  const clipBeats = clip.activeLengthInBars * 4;
  const activeStartBeat = clip.activeBarStart * 4;
  const playheadPosX = useSharedValue(0);

  useEffect(() => {
    if (!isPlaying || !getBeatPosition) {
      playheadPosX.value = 0;
      return;
    }

    let rafId: number;
    const tick = () => {
      const beat = getBeatPosition();
      const wrapped = clipBeats > 0 ? beat % clipBeats : 0;
      playheadPosX.value = (wrapped + activeStartBeat) * beatWidth;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- playheadPosX is a stable SharedValue ref
  }, [isPlaying, getBeatPosition, clipBeats, activeStartBeat, beatWidth]);

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
              onNotePress={(idx) => callbacks?.onNoteDelete?.(idx)}
              onNoteResize={(idx, newDuration) =>
                callbacks?.onNoteResize?.(idx, newDuration)
              }
              onNoteMove={(idx, newPos, newNote) =>
                callbacks?.onNoteMove?.(idx, newPos, newNote)
              }
              onGridTap={(noteNumber, position) => {
                callbacks?.onNoteAdd?.({
                  noteNumber,
                  velocity: 100,
                  position,
                  duration: 0.25,
                });
              }}
              onPitchLabelTap={(pitch) => {
                setSelectedPitchIndex(
                  selectedPitchIndex === pitch ? null : pitch
                );
              }}
              onToggleExpand={() => setIsExpanded(!isExpanded)}
              onZoomChange={handleZoomChange}
              showControls={false}
              showNoteLabels={showPianoNoteNames}
              snapToGrid={snapToGrid}
              lockNoteDuration={clip.lockNoteDuration}
              recordingNotes={recordingNotes}
              playheadPosX={playheadPosX}
              onVisibleBeatRangeChange={handleVisibleBeatRangeChange}
              onScrollXChange={handleGridScrollX}
              velocityPreview={velocityPreview}
            />
            <PlayheadLine posX={playheadPosX} color={colors.mcWhite} />
          </View>
        </WithHint>

        {/* Zoom / pan scrubber — replaces the old floating zoom+expand
         * controls that used to sit on top of the grid. Not gated on
         * isExpanded (unlike ClipLengthBar below): the expand button has to
         * stay reachable in expanded mode too, or there'd be no way back. */}
        <ZoomScrubber
          zoom={zoom}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
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
          onDeleteBar={onDeleteBar}
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

  // Piano Roll
  pianoRollContainer: { flex: 1, position: 'relative' },
  // iOS: single vertical ScrollView
  pianoRollContent: { flex: 1 },
  // iOS: HStack(alignment: .bottom, spacing: 0) { labels, horizontalGrid }
  pianoRollRow: { flexDirection: 'row' },
  pitchLabels: {},
  gridScroll: { flex: 1 },
  // iOS: padding(2), centered text, border(Color.black, width: 0.5)
  pitchLabel: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.5)',
  },
  pitchLabelText: {
    fontSize: 10, // iOS: .mcExtraSmall10
    textAlign: 'center' as const,
  },

  // Zoom controls — iOS: individual rounded buttons, black.opacity(0.6) bg
  zoomControls: {
    position: 'absolute',
    right: 8,
    top: 8,
    gap: 6,
    alignItems: 'center',
  },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomLabel: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
  },

  // Clip length bar — mcBlack bg, continuous bar-segment strip
  clipLengthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: BAR_HEIGHT + LOCATOR_HEIGHT + LOCATOR_GAP,
    marginBottom: spacing.sm,
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
    margin: spacing.xs,
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

  // Velocity lane
  velocityLane: { flex: 1, borderTopWidth: 1 },
  velocityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  velCloseBtn: { padding: 4 },
  velContent: {},
  velBeatMarkers: { flexDirection: 'row', paddingBottom: 4 },
  velBeatLabel: { width: 28, marginHorizontal: 1 },
  velNotesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingBottom: 4,
  },
  velLabel: { width: 50, paddingLeft: 4 },
  velNoteBlocksRow: { flexDirection: 'row', gap: 2 },
  velNoteBlock: {
    width: 28,
    height: 24,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  velBarsArea: { flexDirection: 'row' },
  velYAxisCol: {
    width: 50,
    justifyContent: 'space-between',
    paddingLeft: 4,
    paddingVertical: 4,
  },
  velYLabel: {},
  velBarsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  velBarCol: { alignItems: 'center', justifyContent: 'flex-end', width: 28 },
  velValueLabel: { marginBottom: 2 },
  velBar: { width: 24, borderRadius: 1 },
});

export { ClipEditorToolbar, PianoRollGrid, ClipLengthBar, VelocityLane };
