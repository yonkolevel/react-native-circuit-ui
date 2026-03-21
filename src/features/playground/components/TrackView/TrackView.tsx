/**
 * TrackView — Matches SwiftUI MIDITrackView / ClipView
 *
 * From screenshot:
 * - Track label: FULL HEIGHT colored strip (~100px wide) with icon + name
 * - Clips: full-color rectangles with MIDI note preview (dark notes on colored bg)
 * - No gap between label and clips — flush
 * - EmptyClipView: bordered rectangle with "+" icon
 */
import { memo } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from '../../../../components/Text';
import { useTheme } from '../../../../theme';
import { Icon, Icons } from '../../../../components/SFSymbol';
import type { TrackState, ClipState, MIDINoteData, InstrumentType } from '../../types';
import { INSTRUMENT_COLORS } from '../../types';

// ── Icon mapping ────────────────────────────────────────────────────────────

const TRACK_ICON_DEFS = {
  drum: Icons.drumTrack,
  melodic: Icons.melodicTrack,
  bass: Icons.bassTrack,
  audio: Icons.audioTrack,
} as const;

const TRACK_LABELS: Record<InstrumentType, string> = {
  drum: 'Drums',
  melodic: 'Melodic',
  bass: 'Bass',
  audio: 'Audio',
};

// ── ClipMIDIPreview ─────────────────────────────────────────────────────────

interface ClipMIDIPreviewProps {
  notes: MIDINoteData[];
  width: number;
  height: number;
}

const ClipMIDIPreview = memo(function ClipMIDIPreview({ notes, width, height }: ClipMIDIPreviewProps) {
  if (notes.length === 0) return null;
  const minNote = Math.min(...notes.map(n => n.noteNumber));
  const maxNote = Math.max(...notes.map(n => n.noteNumber));
  const pitchRange = Math.max(maxNote - minNote, 1);
  const maxBeat = Math.max(...notes.map(n => n.startBeat + n.duration), 4);

  return (
    <View style={{ width, height, position: 'relative' }}>
      {notes.map((note, i) => {
        const x = (note.startBeat / maxBeat) * width;
        const w = Math.max((note.duration / maxBeat) * width * 0.9, 2);
        const noteH = Math.max(height / pitchRange, 3);
        const y = height - ((note.noteNumber - minNote) / pitchRange) * (height - noteH) - noteH;
        return (
          <View key={i} style={{
            position: 'absolute', left: x, top: y,
            width: w, height: noteH * 0.9,
            backgroundColor: 'rgba(26, 28, 32, 0.4)',
            borderRadius: 2,
          }} />
        );
      })}
    </View>
  );
});

// ── ClipCell ────────────────────────────────────────────────────────────────

interface ClipCellProps {
  clip: ClipState;
  trackColor: string;
  onPress?: () => void;
}

const ClipCell = memo(function ClipCell({ clip, trackColor, onPress }: ClipCellProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.clipCell,
        { backgroundColor: trackColor, opacity: pressed ? 0.85 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Clip ${clip.id}`}
    >
      <ClipMIDIPreview notes={clip.midiNoteData} width={142} height={72} />
    </Pressable>
  );
});

// ── TrackView ───────────────────────────────────────────────────────────────

export interface TrackViewProps {
  track: TrackState;
  isSelected?: boolean;
  onClipPress?: (clipId: number) => void;
  onTrackPress?: (trackId: number) => void;
  onAddClip?: (trackId: number) => void;
}

export const TrackView = memo(function TrackView({
  track, isSelected, onClipPress, onTrackPress,
}: TrackViewProps) {
  const { colors } = useTheme();
  const trackColor = INSTRUMENT_COLORS[track.type] || colors.mcWhite;
  const trackIcon = TRACK_ICON_DEFS[track.type];

  return (
    <View style={[styles.trackRow, isSelected && { borderColor: colors.mcWhite3, borderWidth: 1 }]}>
      {/* Full-height colored label strip */}
      <Pressable
        onPress={() => onTrackPress?.(track.id)}
        style={[styles.label, { backgroundColor: trackColor }]}
        accessibilityRole="button"
        accessibilityLabel={`${TRACK_LABELS[track.type]} track`}
      >
        <Icon icon={trackIcon} size={24} color={colors.mcBlack} />
        <Text variant="extraSmall" color={colors.mcBlack} bold center numberOfLines={1}>
          {TRACK_LABELS[track.type]}
        </Text>
      </Pressable>

      {/* Clips — horizontal scroll, flush with label */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clipsRow}>
        {track.clips.filter(c => c.isInCurrentSection).map(clip => (
          <ClipCell
            key={clip.id}
            clip={clip}
            trackColor={trackColor}
            onPress={() => onClipPress?.(clip.id)}
          />
        ))}
        {/* Always show at least section-worth of clip slots */}
        {track.clips.filter(c => c.isInCurrentSection).length === 0 && (
          <View style={[styles.emptyClipSlot, { borderColor: trackColor }]}>
            <Icon icon={Icons.plus} size={16} color={trackColor} />
          </View>
        )}
      </ScrollView>
    </View>
  );
});

// ── AddTrackRow ─────────────────────────────────────────────────────────────

export interface AddTrackRowProps {
  onPress?: () => void;
}

export const AddTrackRow = memo(function AddTrackRow({ onPress }: AddTrackRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.addTrackRow}
      accessibilityRole="button" accessibilityLabel="Add track">
      <Icon icon={Icons.plus} size={16} color={colors.mcWhite3} />
      <Text variant="small" color={colors.mcWhite3}>Add track</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  trackRow: {
    flexDirection: 'row',
    minHeight: 80,
  },
  label: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  clipsRow: { flexDirection: 'row', gap: 2 },
  clipCell: {
    width: 150, height: 80,
    borderRadius: 6, padding: 4,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyClipSlot: {
    width: 150, height: 80,
    borderWidth: 1, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },
  addTrackRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12, paddingLeft: 28,
  },
});

export { ClipCell, ClipMIDIPreview };
