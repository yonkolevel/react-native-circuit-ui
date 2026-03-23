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
import { memo, useState } from 'react';
import {
  View,
  ScrollView as RNScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Text } from '../../../../components/Text';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { useTheme, hexToRgba } from '../../../../theme';
import { makeSpacing } from '../../../../theme/spacing';
import { MidiNoteView } from './MidiNoteView';
import { DrumPadsView } from '../DrumPads/DrumPadsView';
import { PianoKeyboard } from '../PianoKeyboard/PianoKeyboard';
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

/** Default MIDI pitch range for melodic/bass tracks (2 octaves starting at C3 = MIDI 48). */
const MELODIC_MIN_PITCH = 48;
const MELODIC_PITCH_COUNT = 24;

const PianoRollGrid = memo(function PianoRollGrid({
  notes,
  samples,
  instrumentType = 'drum',
  trackColor,
  lengthInBeats,
  rowHeight = 34,
  zoomLevel = 1,
  playheadPosition = 0,
  isExpanded,
  selectedPitchIndex,
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

  // Calculate pitch range: drums use sample count, melodic/bass use fixed 2-octave range
  const totalPitches = isDrum
    ? Math.max((samples ?? []).length, 12)
    : MELODIC_PITCH_COUNT;

  // iOS: baseWidth = availableGridWidth / 16 (steps per bar)
  // At zoom 1.0, one bar fills the available width exactly.
  const LABEL_WIDTH = 60;
  const availableGridWidth = screenWidth - LABEL_WIDTH;
  const STEPS_PER_BAR = 16;
  const baseStepWidth = availableGridWidth / STEPS_PER_BAR;
  const stepWidth = baseStepWidth * zoomLevel;
  const BEAT_WIDTH = stepWidth * 4; // 4 steps per beat
  const gridHeight = totalPitches * rowHeight;

  // pitchToMidi: maps pitchIdx (0 = bottom/lowest) → MIDI note number
  // Drums: each index maps to the sample's noteNumber
  // Melodic/bass: linear from MELODIC_MIN_PITCH
  const pitchToMidi: number[] = isDrum
    ? Array.from({ length: totalPitches }, (_, i) => (samples ?? [])[i]?.noteNumber ?? i)
    : Array.from({ length: totalPitches }, (_, i) => MELODIC_MIN_PITCH + i);

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
    return getNoteName(MELODIC_MIN_PITCH + pitchIdx);
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
          <View style={[styles.pitchLabels, { width: LABEL_WIDTH }]}>
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
                        noteNumber = MELODIC_MIN_PITCH + pitchIdx;
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
                  pitchIdx = note.noteNumber - MELODIC_MIN_PITCH;
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
              {/* Playhead */}
              <View
                style={{
                  position: 'absolute',
                  left: playheadPosition * BEAT_WIDTH,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  backgroundColor: colors.mcWhite,
                  zIndex: 10,
                }}
              />
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
 * ClipLengthBar — Matches iOS ClipLengthBar exactly.
 *
 * iOS layout: HStack(spacing:0) { minus | ForEach bars { barButton } | plus }
 * - Minus/Plus: mcOrange icon on mcBlack bg, 34x34
 * - Active bars: mcOrange bg, mcBlack text (mcExtraSmallSemiBold)
 * - Inactive bars: mcBlack3 bg, mcWhite3 text
 * - Current playing bar: mcOrange2 bg with bottom accent line
 * - Height: 34
 */
interface ClipLengthBarProps {
  lengthInBars: number;
  activeLengthInBars: number;
  currentBarIndex?: number;
  onSetActiveLength?: (barIndex: number) => void;
  onDecrease?: () => void;
  onIncrease?: () => void;
}

const BAR_HEIGHT = 34;
const BAR_BTN_W = 34;

const ClipLengthBar = memo(function ClipLengthBar({
  lengthInBars,
  activeLengthInBars,
  currentBarIndex,
  onSetActiveLength,
  onDecrease,
  onIncrease,
}: ClipLengthBarProps) {
  const { colors } = useTheme();
  const barCount = Math.max(1, lengthInBars);
  const activeCount = Math.min(Math.max(1, activeLengthInBars), barCount);
  const canAdd = barCount < 16;
  const canRemove = barCount > 1;

  return (
    <View style={[styles.clipLengthBar, { backgroundColor: colors.mcBlack }]}>
      {/* Minus button */}
      <Pressable
        onPress={onDecrease}
        disabled={!canRemove}
        style={[
          styles.clipLengthEndBtn,
          { backgroundColor: colors.mcBlack, opacity: canRemove ? 1 : 0.4 },
        ]}
        accessibilityLabel="Remove bar"
      >
        <Icon icon={Icons.minus} size={12} color={colors.mcOrange} />
      </Pressable>

      {/* Bar buttons */}
      <View style={styles.clipLengthNumbers}>
        {Array.from({ length: barCount }, (_, i) => {
          const barIndex = i + 1;
          const isActive = barIndex <= activeCount;
          const isCurrent = currentBarIndex === barIndex;
          return (
            <Pressable
              key={barIndex}
              onPress={() => onSetActiveLength?.(barIndex)}
              style={[
                styles.clipLengthNum,
                {
                  backgroundColor: isCurrent
                    ? colors.mcOrange2
                    : isActive
                      ? colors.mcOrange
                      : colors.mcBlack3,
                },
              ]}
            >
              <Text
                variant="extraSmall10SemiBold"
                color={isActive ? colors.mcBlack : colors.mcWhite3}
                center
              >
                {barIndex}
              </Text>
              {isCurrent && (
                <View
                  style={[
                    styles.clipLengthAccent,
                    { backgroundColor: colors.mcOrange5 },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Plus button */}
      <Pressable
        onPress={onIncrease}
        disabled={!canAdd}
        style={[
          styles.clipLengthEndBtn,
          { backgroundColor: colors.mcBlack, opacity: canAdd ? 1 : 0.4 },
        ]}
        accessibilityLabel="Add bar"
      >
        <Icon icon={Icons.plus} size={12} color={colors.mcOrange} />
      </Pressable>
    </View>
  );
});

// ─── Velocity Lane ──────────────────────────────────────────────────────────
// Matches SwiftUI VelocityLaneView: stem+handle pattern, VEL label column,
// velocity values ON TOP of bars in orange, beat markers above notes row

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
              {notes.map((_n, i) => {
                const vel = notes[i]!.velocity;
                const barH = (vel / 127) * BAR_HEIGHT;
                return (
                  <Pressable
                    key={i}
                    onPress={() => onVelocityChange?.(i, vel)}
                    style={styles.velBarCol}
                  >
                    {/* Value label ON TOP of bar */}
                    <Text
                      variant="extraSmall"
                      color={colors.mcOrange}
                      bold
                      style={styles.velValueLabel}
                    >
                      {vel}
                    </Text>
                    {/* Bar stem */}
                    <View
                      style={[
                        styles.velBar,
                        { height: barH, backgroundColor: trackColor },
                      ]}
                    />
                  </Pressable>
                );
              })}
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
  playheadPosition?: number;
  callbacks?: ClipEditorCallbacks;
  /** Show DrumPadsView or PianoKeyboard in the bottom half (default: true). Hidden when expanded. */
  showPerformanceControls?: boolean;
  /** Callbacks for drum pad press/release (used when instrumentType === 'drum') */
  drumPadCallbacks?: DrumPadCallbacks;
  /** Callbacks for piano key press/release (used when instrumentType === 'melodic' | 'bass') */
  pianoKeyCallbacks?: PianoKeyCallbacks;
  /** Notes currently pressed externally (e.g. MIDI input), highlighted on pads/keyboard */
  externalPressedNotes?: Set<number>;
  onBack?: () => void;
}

export const ClipEditorView = memo(function ClipEditorView({
  clip,
  instrumentType,
  samples,
  isPlaying,
  isRecording,
  isMetronomeEnabled,
  playheadPosition = 0,
  callbacks,
  showPerformanceControls = true,
  drumPadCallbacks,
  pianoKeyCallbacks,
  externalPressedNotes,
  onBack,
}: ClipEditorViewProps) {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedPitchIndex, setSelectedPitchIndex] = useState<number | null>(
    null
  );
  const trackColor = clip.colorHex;
  const samplesList = samples || [];

  // iOS: PerformanceControlsView visible when config.isPerformanceControlsVisible && !isExpanded
  const shouldShowPerformanceControls =
    showPerformanceControls && !isExpanded && instrumentType !== 'audio';

  // iOS: velocity lane only shows when a pitch label is tapped (selectedPitchForEditing)
  const showVelocityLane = selectedPitchIndex != null && !isExpanded;

  return (
    <View style={[styles.container, { backgroundColor: colors.mcBlack }]}>
      {/* Top half: toolbar + piano roll + clip length bar
       * iOS uses splitHeight = availableHeight * 0.5 for each half */}
      <View
        style={
          shouldShowPerformanceControls ? styles.splitHalf : styles.fullContent
        }
      >
        {/* Toolbar */}
        <ClipEditorToolbar
          isPlaying={isPlaying}
          isRecording={isRecording}
          isMetronomeEnabled={isMetronomeEnabled}
          onBack={onBack || callbacks?.onClose}
          onPlayPause={() => {}}
          onRecord={() => {}}
          onMetronome={() => {}}
          onUndo={callbacks?.onUndo}
          onRedo={callbacks?.onRedo}
          onSettings={() => {}}
        />

        {/* Piano Roll */}
        <PianoRollGrid
          notes={clip.notes}
          samples={samplesList}
          instrumentType={instrumentType}
          trackColor={trackColor}
          lengthInBeats={clip.activeLengthInBars * 4}
          playheadPosition={playheadPosition}
          zoomLevel={zoom}
          isExpanded={isExpanded}
          selectedPitchIndex={selectedPitchIndex}
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
              duration: 0.25, // 16th note default
            });
          }}
          onPitchLabelTap={(pitch) => {
            // Toggle velocity lane for this pitch (matching iOS selectedPitchForEditing)
            setSelectedPitchIndex(selectedPitchIndex === pitch ? null : pitch);
          }}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
          onZoomIn={() => setZoom(Math.min(zoom + 0.25, 3))}
          onZoomOut={() => setZoom(Math.max(zoom - 0.25, 0.5))}
        />

        {/* Clip Length Bar */}
        {!isExpanded && (
          <ClipLengthBar
            lengthInBars={clip.lengthInBars}
            activeLengthInBars={clip.activeLengthInBars}
          />
        )}
      </View>

      {/* Bottom half: either NotePrecisionPanel (velocity editing) or PerformanceControls (pads/piano)
       * iOS: when selectedPitchForEditing != nil → NotePrecisionPanel replaces performance controls
       *       when nil → PerformanceControlsView (drum→PadsView, melodic/bass→TeenagePianoView) */}
      {!isExpanded && (
        <View style={styles.splitHalf}>
          {showVelocityLane && clip.notes.length > 0 ? (
            <VelocityLane
              notes={clip.notes}
              trackColor={trackColor}
              onClose={() => setSelectedPitchIndex(null)}
              onVelocityChange={callbacks?.onVelocityChange}
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
                onNoteOn={
                  pianoKeyCallbacks?.onKeyPress
                    ? (noteIndex: number) =>
                        pianoKeyCallbacks.onKeyPress?.(
                          noteIndex + MELODIC_MIN_PITCH,
                          100
                        )
                    : undefined
                }
                onNoteOff={
                  pianoKeyCallbacks?.onKeyRelease
                    ? (noteIndex: number) =>
                        pianoKeyCallbacks.onKeyRelease?.(
                          noteIndex + MELODIC_MIN_PITCH
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
    </View>
  );
});

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  /** iOS: splitHeight = availableHeight * 0.5 — each half gets equal flex */
  splitHalf: { flex: 1 },
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

  // Clip length bar — iOS: height 34, mcBlack bg, individual bar buttons
  clipLengthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: BAR_HEIGHT,
  },
  clipLengthEndBtn: {
    width: BAR_BTN_W,
    height: BAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clipLengthNumbers: { flex: 1, flexDirection: 'row', height: BAR_HEIGHT },
  clipLengthNum: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  clipLengthAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
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
