/**
 * LearnChapterView — Renders a learn chapter step by step.
 * Each step has content blocks rendered via ContentBlockRenderer.
 */
import React, { memo, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text } from '../../../../components/Text';
import { makeSpacing } from '../../../../theme/spacing';
import { ContentBlockRenderer } from '../ContentBlocks';

interface BundleStep {
  id: string;
  content: Array<{ type: string; [key: string]: any }>;
  playground?: string;
}

interface BundleChapter {
  id: string;
  type: string;
  title: string;
  steps?: BundleStep[];
}

export interface LearnChapterViewProps {
  chapter: BundleChapter;
  basePath: string;
  onComplete: () => void;
}

export const LearnChapterView = memo(function LearnChapterView({
  chapter,
  basePath,
  onComplete,
}: LearnChapterViewProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = chapter.steps ?? [];
  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex >= steps.length - 1;

  if (!step) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.chapterType}>
          {chapter.type.toUpperCase()} • Step {stepIndex + 1}/{steps.length}
        </Text>
        <Text style={styles.chapterTitle}>{chapter.title}</Text>
      </View>

      {/* Progress dots */}
      <View style={styles.dots}>
        {steps.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === stepIndex && styles.dotActive,
              i < stepIndex && styles.dotDone,
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {step.content.map((block, i) => (
          <ContentBlockRenderer
            key={`${step.id}-${i}`}
            block={block as any}
            basePath={basePath}
          />
        ))}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.nav}>
        {!isFirst && (
          <Pressable
            onPress={() => setStepIndex(stepIndex - 1)}
            style={styles.secondaryBtn}
            accessibilityLabel="Previous step"
            accessibilityRole="button"
          >
            <Text style={styles.secondaryBtnText}>Previous</Text>
          </Pressable>
        )}
        <View style={styles.spacer} />
        <Pressable
          onPress={() => (isLast ? onComplete() : setStepIndex(stepIndex + 1))}
          style={styles.primaryBtn}
          accessibilityLabel={isLast ? 'Complete chapter' : 'Next step'}
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnText}>
            {isLast ? 'Complete' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: makeSpacing(4), gap: 4 },
  chapterType: {
    color: 'rgba(247,247,247,0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  chapterTitle: { color: '#F7F7F7', fontSize: 22, fontWeight: '600' },
  dots: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: makeSpacing(4),
    marginBottom: makeSpacing(2),
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2A2C30' },
  dotActive: { backgroundColor: '#FF5C24', width: 20 },
  dotDone: { backgroundColor: '#00FF9E' },
  scroll: { flex: 1 },
  content: { padding: makeSpacing(4), gap: makeSpacing(4) },
  nav: {
    flexDirection: 'row',
    padding: makeSpacing(4),
    paddingBottom: makeSpacing(8),
  },
  spacer: { flex: 1 },
  primaryBtn: {
    backgroundColor: '#FF5C24',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 6,
  },
  primaryBtnText: { color: '#F7F7F7', fontSize: 16, fontWeight: '600' },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: 'rgba(247,247,247,0.3)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 6,
  },
  secondaryBtnText: { color: '#F7F7F7', fontSize: 16, fontWeight: '500' },
});
