/**
 * ContentBlockRenderer — Renders a ContentBlock by type.
 * Maps the discriminated union to the correct component.
 */
import React, { memo, useState } from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { Text } from '../../../../components/Text';
import { makeSpacing } from '../../../../theme/spacing';

// Import ContentBlock type inline to avoid cross-package dependency
type ContentBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'text'; text: string }
  | { type: 'image'; path: string; alt?: string }
  | { type: 'video'; path: string }
  | {
      type: 'audio';
      soundbank?: string;
      sampleIndex?: number;
      path?: string;
      label?: string;
      autoplay?: boolean;
    }
  | {
      type: 'pianoRoll';
      midiFile?: string;
      soundbank?: string;
      trackID?: number;
      validation?: string;
      minInteractions?: number;
      tempo?: number;
      metronomeEnabled?: boolean;
      hint?: string;
    }
  | {
      type: 'pianoKeys';
      soundbank?: string;
      trackID?: number;
      octaves?: number;
      highlightedNotes?: number[];
      highlightColor?: string;
      hint?: string;
      validation?: string;
      expectedChord?: { root: string; type: string };
      expectedNotes?: number[];
      minInteractions?: number;
      showNoteNames?: boolean;
    }
  | {
      type: 'drumPads';
      soundbank?: string;
      trackID?: number;
      highlightedPads?: number[];
      hint?: string;
      validation?: string;
      expectedNotes?: number[];
      minInteractions?: number;
    }
  | {
      type: 'callout';
      style: 'info' | 'tip' | 'warning';
      text: string;
      detailTitle?: string;
      detailBody?: string;
    };

export interface ContentBlockRendererProps {
  block: ContentBlock;
  basePath?: string;
}

// ── Heading ─────────────────────────────────────────────────────────────────

const HeadingBlock = memo(function HeadingBlock({
  level,
  text,
}: {
  level: number;
  text: string;
}) {
  const fontSize = level <= 1 ? 28 : level === 2 ? 22 : level === 3 ? 18 : 16;
  return <Text style={[styles.heading, { fontSize }]}>{text}</Text>;
});

// ── Text ────────────────────────────────────────────────────────────────────

const TextBlock = memo(function TextBlock({ text }: { text: string }) {
  return <Text style={styles.bodyText}>{text}</Text>;
});

// ── Image ───────────────────────────────────────────────────────────────────

const ImageBlock = memo(function ImageBlock({
  path,
  alt,
  basePath,
}: {
  path: string;
  alt?: string;
  basePath?: string;
}) {
  const uri = path.startsWith('http')
    ? path
    : basePath
      ? `${basePath}/${path}`
      : path;
  return (
    <Image
      source={{ uri }}
      style={styles.image}
      resizeMode="contain"
      accessibilityLabel={alt ?? 'Lesson image'}
    />
  );
});

// ── Video (placeholder) ─────────────────────────────────────────────────────

const VideoBlock = memo(function VideoBlock({ path }: { path: string }) {
  return (
    <View style={styles.videoPlaceholder} accessibilityLabel="Video">
      <Text style={styles.videoIcon}>▶</Text>
      <Text style={styles.videoLabel}>Video</Text>
    </View>
  );
});

// ── Audio ───────────────────────────────────────────────────────────────────

const AudioBlock = memo(function AudioBlock({ label }: { label?: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <Pressable
      onPress={() => setPlaying(!playing)}
      style={styles.audioBlock}
      accessibilityLabel={label ?? 'Audio sample'}
      accessibilityRole="button"
    >
      <Text style={styles.audioIcon}>{playing ? '⏸' : '▶'}</Text>
      <Text style={styles.audioLabel}>{label ?? 'Audio sample'}</Text>
    </Pressable>
  );
});

// ── Callout ─────────────────────────────────────────────────────────────────

const CALLOUT_COLORS = { info: '#2496FF', tip: '#00FF9E', warning: '#FF5C24' };
const CALLOUT_ICONS = { info: 'ℹ️', tip: '💡', warning: '⚠️' };

const CalloutBlock = memo(function CalloutBlock({
  style,
  text,
}: {
  style: 'info' | 'tip' | 'warning';
  text: string;
}) {
  return (
    <View style={[styles.callout, { borderLeftColor: CALLOUT_COLORS[style] }]}>
      <Text style={styles.calloutIcon}>{CALLOUT_ICONS[style]}</Text>
      <Text style={styles.calloutText}>{text}</Text>
    </View>
  );
});

// ── Interactive blocks ─────────────────────────────────────────────────────────

/**
 * PianoRollBlock — Read-only piano roll visualization with play/pause controls.
 * Phase 1: Visual grid + controls (MDC-301)
 * Phase 2: Audio playback (MDC-302)
 * Phase 3: Interaction validation (separate task)
 */
const PianoRollBlock = memo(function PianoRollBlock({
  hint,
}: {
  hint?: string;
}) {
  return (
    <View style={styles.interactiveBlock}>
      <Text style={styles.interactiveIcon}>🎹</Text>
      <Text style={styles.interactiveLabel}>Piano Roll</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
});

/** PianoKeysBlock — Piano keyboard for note input (MDC-299) */
const PianoKeysBlock = memo(function PianoKeysBlock({
  hint,
  highlightedNotes,
}: {
  hint?: string;
  highlightedNotes?: number[];
}) {
  return (
    <View style={styles.interactiveBlock}>
      <Text style={styles.interactiveIcon}>🎹</Text>
      <Text style={styles.interactiveLabel}>Piano Keyboard</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
      {highlightedNotes && (
        <Text style={styles.hint}>
          Highlighted: {highlightedNotes.join(', ')}
        </Text>
      )}
    </View>
  );
});

/** DrumPadsBlock — 4×4 drum pad grid (MDC-300) */
const DrumPadsBlock = memo(function DrumPadsBlock({
  hint,
  highlightedPads,
}: {
  hint?: string;
  highlightedPads?: number[];
}) {
  return (
    <View style={styles.interactiveBlock}>
      <Text style={styles.interactiveIcon}>🥁</Text>
      <Text style={styles.interactiveLabel}>Drum Pads</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
      {highlightedPads && (
        <Text style={styles.hint}>
          Highlighted pads: {highlightedPads.join(', ')}
        </Text>
      )}
    </View>
  );
});

// ── Main Renderer ───────────────────────────────────────────────────────────

export const ContentBlockRenderer = memo(function ContentBlockRenderer({
  block,
  basePath,
}: ContentBlockRendererProps) {
  switch (block.type) {
    case 'heading':
      return <HeadingBlock level={block.level} text={block.text} />;
    case 'text':
      return <TextBlock text={block.text} />;
    case 'image':
      return (
        <ImageBlock path={block.path} alt={block.alt} basePath={basePath} />
      );
    case 'video':
      return <VideoBlock path={block.path} />;
    case 'audio':
      return <AudioBlock label={block.label} />;
    case 'callout':
      return <CalloutBlock style={block.style} text={block.text} />;
    case 'pianoRoll':
      return <PianoRollBlock hint={block.hint} />;
    case 'pianoKeys':
      return (
        <PianoKeysBlock
          hint={block.hint}
          highlightedNotes={block.highlightedNotes}
        />
      );
    case 'drumPads':
      return (
        <DrumPadsBlock
          hint={block.hint}
          highlightedPads={block.highlightedPads}
        />
      );
    default:
      return null;
  }
});

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  heading: {
    color: '#F7F7F7',
    fontWeight: '600',
    marginBottom: makeSpacing(2),
  },
  bodyText: { color: 'rgba(247,247,247,0.8)', fontSize: 16, lineHeight: 24 },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 6,
    backgroundColor: '#1A1C20',
  },
  videoPlaceholder: {
    height: 180,
    borderRadius: 6,
    backgroundColor: '#1A1C20',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  videoIcon: { color: '#FF5C24', fontSize: 32 },
  videoLabel: { color: 'rgba(247,247,247,0.5)', fontSize: 12 },
  audioBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: makeSpacing(3),
    borderRadius: 6,
    backgroundColor: '#1A1C20',
  },
  audioIcon: { fontSize: 20 },
  audioLabel: { color: '#F7F7F7', fontSize: 14 },
  callout: {
    padding: makeSpacing(3),
    borderLeftWidth: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    gap: 10,
  },
  calloutIcon: { fontSize: 16 },
  calloutText: {
    color: 'rgba(247,247,247,0.8)',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  interactiveBlock: {
    padding: makeSpacing(4),
    borderRadius: 6,
    backgroundColor: '#1A1C20',
    alignItems: 'center',
    gap: 8,
    minHeight: 120,
    justifyContent: 'center',
  },
  interactiveIcon: { fontSize: 32 },
  interactiveLabel: { color: '#F7F7F7', fontSize: 14, fontWeight: '600' },
  hint: { color: 'rgba(247,247,247,0.5)', fontSize: 12, textAlign: 'center' },
});

export default ContentBlockRenderer;
