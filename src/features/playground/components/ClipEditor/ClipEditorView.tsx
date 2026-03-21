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
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from '../../../../components/Text';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { useTheme } from '../../../../theme';
import { makeSpacing } from '../../../../theme/spacing';
import type { Clip, ClipNote, InstrumentType, ClipEditorCallbacks, Sample } from '../../types';

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
  isPlaying, isRecording, isMetronomeEnabled, canUndo = true, canRedo = true,
  onBack, onPlayPause, onRecord, onMetronome, onUndo, onRedo, onSettings,
}: ClipEditorToolbarProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.toolbar, { backgroundColor: colors.mcBlack2 }]}>
      <Pressable onPress={onBack} hitSlop={8} accessibilityLabel="Back">
        <Icon icon={Icons.back} size={20} color={colors.mcGray} />
      </Pressable>

      <View style={styles.toolbarSpacer} />

      <View style={styles.toolbarCenter}>
        <Pressable onPress={onPlayPause} hitSlop={8} accessibilityLabel={isPlaying ? 'Pause' : 'Play'}>
          <Icon icon={isPlaying ? Icons.pause : Icons.play} size={20} color={colors.mcWhite} />
        </Pressable>
        <Pressable onPress={onRecord} hitSlop={8} accessibilityLabel="Record">
          <Icon icon={Icons.record} size={20} color={isRecording ? '#FF0000' : colors.mcWhite} />
        </Pressable>
        <Pressable onPress={onMetronome} hitSlop={8} accessibilityLabel="Metronome">
          <Icon icon={isMetronomeEnabled ? Icons.metronomeOn : Icons.metronomeOff} size={20} color={colors.mcWhite} />
        </Pressable>
        <Pressable onPress={onUndo} hitSlop={8} disabled={!canUndo} accessibilityLabel="Undo">
          <Icon icon={Icons.undo} size={20} color={canUndo ? colors.mcWhite : colors.mcGray} />
        </Pressable>
        <Pressable onPress={onRedo} hitSlop={8} disabled={!canRedo} accessibilityLabel="Redo">
          <Icon icon={Icons.redo} size={20} color={canRedo ? colors.mcWhite : colors.mcGray} />
        </Pressable>
      </View>

      <View style={styles.toolbarSpacer} />

      <Pressable onPress={onSettings} hitSlop={8} accessibilityLabel="Settings">
        <Icon icon={Icons.settings} size={20} color={colors.mcWhite} />
      </Pressable>
    </View>
  );
});

// ─── PianoRoll Grid ─────────────────────────────────────────────────────────

interface PianoRollGridProps {
  notes: ClipNote[];
  samples?: Sample[];
  trackColor: string;
  lengthInBeats: number;
  rowHeight?: number;
  zoomLevel?: number;
  playheadPosition?: number;
  isExpanded?: boolean;
  onNotePress?: (index: number) => void;
  onPitchLabelTap?: (pitch: number) => void;
  onToggleExpand?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

const PianoRollGrid = memo(function PianoRollGrid({
  notes, samples, trackColor, lengthInBeats,
  rowHeight = 34, zoomLevel = 1, playheadPosition = 0,
  isExpanded, onNotePress, onPitchLabelTap,
  onToggleExpand, onZoomIn, onZoomOut,
}: PianoRollGridProps) {
  const { colors } = useTheme();

  // Calculate pitch range from soundbank
  const totalPitches = Math.max((samples ?? []).length, 12);
  const BEAT_WIDTH = 40 * zoomLevel;
  const LABEL_WIDTH = 120;
  const gridHeight = totalPitches * rowHeight;

  // Get sample name for a pitch index
  const getPitchLabel = (pitchIdx: number): string => {
    const sample = (samples ?? [])[pitchIdx];
    return sample?.fileName?.replace('.wav', '').replace('.aif', '') ?? `Note ${pitchIdx}`;
  };

  // Check if pitch has notes
  const pitchHasNotes = (pitchIdx: number): boolean => {
    const noteNum = (samples ?? [])[pitchIdx]?.noteNumber ?? pitchIdx;
    return notes.some(n => n.noteNumber === noteNum);
  };

  return (
    <View style={styles.pianoRollContainer}>
      {/* Main content: labels + grid */}
      <View style={styles.pianoRollContent}>
        {/* Pitch labels column */}
        <ScrollView style={[styles.pitchLabels, { width: LABEL_WIDTH }]}>
          {Array.from({ length: totalPitches }, (_, i) => {
            const pitchIdx = totalPitches - 1 - i;
            const hasNotes = pitchHasNotes(pitchIdx);
            return (
              <Pressable
                key={pitchIdx}
                onPress={() => onPitchLabelTap?.(pitchIdx)}
                style={[
                  styles.pitchLabel,
                  { height: rowHeight, backgroundColor: hasNotes ? trackColor : `${trackColor}40` },
                ]}
              >
                <Text variant="extraSmall" color={colors.mcBlack} numberOfLines={2} style={styles.pitchLabelText}>
                  {getPitchLabel(pitchIdx)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Grid + notes */}
        <ScrollView horizontal>
          <ScrollView>
            <View style={{ width: lengthInBeats * BEAT_WIDTH, height: gridHeight, position: 'relative' }}>
              {/* Grid rows */}
              {Array.from({ length: totalPitches }, (_, i) => (
                <View key={`r${i}`} style={{
                  position: 'absolute', top: i * rowHeight, left: 0, right: 0, height: rowHeight,
                  borderBottomWidth: 0.5, borderBottomColor: colors.mcBlack4,
                  backgroundColor: i % 2 === 0 ? colors.mcBlack : colors.mcBlack2,
                }} />
              ))}
              {/* Beat lines */}
              {Array.from({ length: lengthInBeats + 1 }, (_, i) => (
                <View key={`b${i}`} style={{
                  position: 'absolute', left: i * BEAT_WIDTH, top: 0, bottom: 0,
                  width: i % 4 === 0 ? 1 : 0.5,
                  backgroundColor: i % 4 === 0 ? colors.mcWhite4 : colors.mcBlack4,
                }} />
              ))}
              {/* Notes */}
              {notes.map((note, idx) => {
                const sampleIdx = (samples ?? []).findIndex(s => s.noteNumber === note.noteNumber);
                const pitchIdx = sampleIdx >= 0 ? sampleIdx : 0;
                const y = (totalPitches - 1 - pitchIdx) * rowHeight;
                return (
                  <Pressable key={idx} onPress={() => onNotePress?.(idx)} style={{
                    position: 'absolute', left: note.position * BEAT_WIDTH, top: y + 1,
                    width: Math.max(note.duration * BEAT_WIDTH - 2, 4), height: rowHeight - 2,
                    backgroundColor: trackColor, borderRadius: 2,
                    justifyContent: 'center', alignItems: 'center',
                  }}>
                    {/* Dark center line (matches SwiftUI) */}
                    <View style={{ width: 1, height: '60%', backgroundColor: 'rgba(0,0,0,0.3)' }} />
                  </Pressable>
                );
              })}
              {/* Playhead */}
              <View style={{
                position: 'absolute', left: playheadPosition * BEAT_WIDTH, top: 0, bottom: 0,
                width: 2, backgroundColor: colors.mcWhite, zIndex: 10,
              }} />
            </View>
          </ScrollView>
        </ScrollView>
      </View>

      {/* Zoom controls — floating right */}
      <View style={styles.zoomControls}>
        <Pressable onPress={onToggleExpand} style={styles.zoomBtn}>
          <Icon icon={isExpanded ? Icons.collapse : Icons.expand} size={16} color={colors.mcWhite} />
        </Pressable>
        <Pressable onPress={onZoomIn} style={styles.zoomBtn}>
          <Icon icon={Icons.zoomIn} size={16} color={colors.mcWhite} />
        </Pressable>
        <Text variant="extraSmall" color={colors.mcWhite} center>{Math.round(zoomLevel * 100)}%</Text>
        <Pressable onPress={onZoomOut} style={styles.zoomBtn}>
          <Icon icon={Icons.zoomOut} size={16} color={colors.mcWhite} />
        </Pressable>
      </View>
    </View>
  );
});

// ─── Clip Length Bar ─────────────────────────────────────────────────────────
// Orange bar: "— | 1  2  3  4 | +"

interface ClipLengthBarProps {
  lengthInBars: number;
  onDecrease?: () => void;
  onIncrease?: () => void;
}

const ClipLengthBar = memo(function ClipLengthBar({ lengthInBars, onDecrease, onIncrease }: ClipLengthBarProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.clipLengthBar, { backgroundColor: colors.mcOrange }]}>
      <Pressable onPress={onDecrease} style={styles.clipLengthBtn} accessibilityLabel="Decrease bars">
        <Icon icon={Icons.minus} size={14} color={colors.mcBlack} />
      </Pressable>
      <View style={styles.clipLengthNumbers}>
        {Array.from({ length: lengthInBars }, (_, i) => (
          <Text key={i} variant="small" color={colors.mcBlack} bold center style={styles.clipLengthNum}>
            {i + 1}
          </Text>
        ))}
      </View>
      <Pressable onPress={onIncrease} style={styles.clipLengthBtn} accessibilityLabel="Increase bars">
        <Icon icon={Icons.plus} size={14} color={colors.mcBlack} />
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
  notes, trackColor, selectedNoteName, activeLengthInBars = 1, onClose, onVelocityChange,
}: VelocityLaneProps) {
  const { colors } = useTheme();
  const BAR_HEIGHT = 200;
  const Y_LABELS = [127, 95, 64, 32];
  const totalBeats = activeLengthInBars * 4;

  return (
    <View style={[styles.velocityLane, { backgroundColor: colors.mcBlack }]}>
      {/* Header — selected note name + close X */}
      <View style={styles.velocityHeader}>
        <Text variant="label" bold>{selectedNoteName || 'Velocity'}</Text>
        {onClose && (
          <Pressable onPress={onClose} hitSlop={8} style={styles.velCloseBtn} accessibilityLabel="Close velocity">
            <Icon icon={Icons.close} size={18} color={colors.mcWhite3} />
          </Pressable>
        )}
      </View>

      {/* Beat markers: 1.1, 1.2, 1.3, 1.4 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.velContent}>
          <View style={styles.velBeatMarkers}>
            <View style={{ width: 50 }} />
            {Array.from({ length: totalBeats }, (_, i) => (
              <Text key={i} variant="extraSmall" color={colors.mcWhite3} center style={styles.velBeatLabel}>
                {Math.floor(i / 4) + 1}.{(i % 4) + 1}
              </Text>
            ))}
          </View>

          {/* NOTES row — colored blocks matching piano roll */}
          <View style={styles.velNotesRow}>
            <Text variant="extraSmall" color={colors.mcWhite3} style={styles.velLabel}>NOTES</Text>
            <View style={styles.velNoteBlocksRow}>
              {notes.map((_note, i) => (
                <View key={i} style={[styles.velNoteBlock, { backgroundColor: trackColor }]}>
                  <View style={{ width: 1, height: '60%', backgroundColor: 'rgba(0,0,0,0.3)' }} />
                </View>
              ))}
            </View>
          </View>

          {/* Velocity bars — values ON TOP in orange, bars below */}
          <View style={styles.velBarsArea}>
            <View style={styles.velYAxisCol}>
              <Text variant="extraSmall" color={colors.mcWhite3}>VEL</Text>
              {Y_LABELS.map(v => (
                <Text key={v} variant="extraSmall" color={colors.mcWhite3} style={styles.velYLabel}>{v}</Text>
              ))}
            </View>
            <View style={[styles.velBarsRow, { height: BAR_HEIGHT }]}>
              {notes.map((_n, i) => {
                const vel = notes[i]!.velocity;
                const barH = (vel / 127) * BAR_HEIGHT;
                return (
                  <Pressable key={i} onPress={() => onVelocityChange?.(i, vel)} style={styles.velBarCol}>
                    {/* Value label ON TOP of bar */}
                    <Text variant="extraSmall" color={colors.mcOrange} bold style={styles.velValueLabel}>
                      {vel}
                    </Text>
                    {/* Bar stem */}
                    <View style={[styles.velBar, { height: barH, backgroundColor: trackColor }]} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
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
  onBack?: () => void;
}

export const ClipEditorView = memo(function ClipEditorView({
  clip, instrumentType: _instrumentType, samples, isPlaying, isRecording, isMetronomeEnabled,
  playheadPosition = 0, callbacks, onBack,
}: ClipEditorViewProps) {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const trackColor = clip.colorHex;
  const samplesList = samples || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.mcBlack }]}>
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
        trackColor={trackColor}
        lengthInBeats={clip.activeLengthInBars * 4}
        playheadPosition={playheadPosition}
        zoomLevel={zoom}
        isExpanded={isExpanded}
        onNotePress={(idx) => callbacks?.onNoteDelete?.(idx)}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        onZoomIn={() => setZoom(Math.min(zoom + 0.25, 3))}
        onZoomOut={() => setZoom(Math.max(zoom - 0.25, 0.5))}
      />

      {/* Clip Length Bar */}
      {!isExpanded && (
        <ClipLengthBar lengthInBars={clip.activeLengthInBars} />
      )}

      {/* Velocity Lane */}
      {!isExpanded && clip.notes.length > 0 && (
        <VelocityLane
          notes={clip.notes}
          trackColor={trackColor}
          onVelocityChange={callbacks?.onVelocityChange}
        />
      )}
    </View>
  );
});

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Toolbar
  toolbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8,
    gap: makeSpacing(4),
  },
  toolbarSpacer: { flex: 1 },
  toolbarCenter: { flexDirection: 'row', alignItems: 'center', gap: makeSpacing(4) },

  // Piano Roll
  pianoRollContainer: { flex: 1, position: 'relative' },
  pianoRollContent: { flex: 1, flexDirection: 'row' },
  pitchLabels: { borderRightWidth: 1, borderRightColor: '#313336' },
  pitchLabel: { justifyContent: 'center', paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.2)' },
  pitchLabelText: { fontSize: 7 },

  // Zoom controls
  zoomControls: {
    position: 'absolute', right: 8, top: 8,
    backgroundColor: 'rgba(49,51,54,0.9)', borderRadius: 8,
    padding: 6, gap: 4, alignItems: 'center',
  },
  zoomBtn: { padding: 6 },

  // Clip length bar
  clipLengthBar: {
    flexDirection: 'row', alignItems: 'center', height: 32,
  },
  clipLengthBtn: { paddingHorizontal: 12, height: '100%', justifyContent: 'center' },
  clipLengthNumbers: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  clipLengthNum: { flex: 1 },

  // Velocity lane
  velocityLane: { borderTopWidth: 1, borderTopColor: '#313336' },
  velocityHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  velCloseBtn: { padding: 4 },
  velContent: {},
  velBeatMarkers: { flexDirection: 'row', paddingBottom: 4 },
  velBeatLabel: { width: 28, marginHorizontal: 1 },
  velNotesRow: { flexDirection: 'row', alignItems: 'center', height: 32, paddingBottom: 4 },
  velLabel: { width: 50, paddingLeft: 4 },
  velNoteBlocksRow: { flexDirection: 'row', gap: 2 },
  velNoteBlock: { width: 28, height: 24, borderRadius: 2, justifyContent: 'center', alignItems: 'center' },
  velBarsArea: { flexDirection: 'row' },
  velYAxisCol: { width: 50, justifyContent: 'space-between', paddingLeft: 4, paddingVertical: 4 },
  velYLabel: {},
  velBarsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  velBarCol: { alignItems: 'center', justifyContent: 'flex-end', width: 28 },
  velValueLabel: { marginBottom: 2 },
  velBar: { width: 24, borderRadius: 1 },
});

export { ClipEditorToolbar, PianoRollGrid, ClipLengthBar, VelocityLane };
