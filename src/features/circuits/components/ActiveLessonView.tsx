/**
 * ActiveLessonView — Matches ActiveLessonView.swift / ContentBlockView.swift
 *
 * Renders a lesson's chapter content blocks sequentially.
 * Content block types: text, image, video, pianoRoll, drumPads, question, etc.
 * Presentation only — block rendering is delegated via render props.
 */
import { memo } from 'react';
import { View, ScrollView, StyleSheet, Image } from 'react-native';
import { Text } from '../../../components/Text';
import { Button } from '../../../components/Button';
import { useTheme } from '../../../theme';
import { makeSpacing } from '../../../theme/spacing';
import type { ChapterDetails, ContentBlock } from '../types';

// ── Content Block Renderers ─────────────────────────────────────────────────

const TextBlock = memo(function TextBlock({ text }: { text: string }) {
  return <Text variant="body" style={styles.textBlock}>{text}</Text>;
});

const ImageBlock = memo(function ImageBlock({ imageUrl }: { imageUrl: string }) {
  return <Image source={{ uri: imageUrl }} style={styles.imageBlock} resizeMode="contain" />;
});

interface ContentBlockViewProps {
  block: ContentBlock;
  renderCustomBlock?: (block: ContentBlock) => React.ReactNode;
}

const ContentBlockView = memo(function ContentBlockView({ block, renderCustomBlock }: ContentBlockViewProps) {
  switch (block.type) {
    case 'text':
      return block.text ? <TextBlock text={block.text} /> : null;
    case 'image':
      return block.imageUrl ? <ImageBlock imageUrl={block.imageUrl} /> : null;
    default:
      // pianoRoll, drumPads, video, audio, question — delegate to render prop
      return <>{renderCustomBlock?.(block)}</>;
  }
});

// ── Active Lesson View ──────────────────────────────────────────────────────

export interface ActiveLessonViewProps {
  chapter: ChapterDetails;
  currentStepIndex: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onComplete?: () => void;
  /** Render prop for interactive blocks (pianoRoll, drumPads, video, question) */
  renderCustomBlock?: (block: ContentBlock) => React.ReactNode;
}

export const ActiveLessonView = memo(function ActiveLessonView({
  chapter, currentStepIndex, onNext, onPrevious, onComplete, renderCustomBlock,
}: ActiveLessonViewProps) {
  const { colors } = useTheme();
  const step = chapter.steps[currentStepIndex];
  const isLastStep = currentStepIndex >= chapter.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  if (!step) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.mcBlack2 }]}>
      {/* Step header */}
      <View style={styles.header}>
        <Text variant="small" uppercase color={colors.mcWhite3}>
          {chapter.type} • Step {currentStepIndex + 1}/{chapter.steps.length}
        </Text>
        <Text variant="h5">{step.title}</Text>
      </View>

      {/* Content blocks */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {step.contentBlocks.map(block => (
          <ContentBlockView key={block.id} block={block} renderCustomBlock={renderCustomBlock} />
        ))}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.nav}>
        {!isFirstStep && (
          <Button label="Previous" variant="outline" onPress={onPrevious} />
        )}
        <View style={styles.navSpacer} />
        <Button
          label={isLastStep ? 'Complete' : 'Next'}
          variant="primary"
          onPress={isLastStep ? onComplete : onNext}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: makeSpacing(4), gap: makeSpacing(2) },
  content: { flex: 1 },
  contentInner: { padding: makeSpacing(4), gap: makeSpacing(4) },
  textBlock: { lineHeight: 24 },
  imageBlock: { width: '100%', height: 200, borderRadius: 6 },
  nav: { flexDirection: 'row', padding: makeSpacing(4), gap: makeSpacing(3) },
  navSpacer: { flex: 1 },
});
