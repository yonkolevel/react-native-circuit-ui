/**
 * MyCircuitsView — Matches MyCircuitsView.swift
 *
 * ScrollView with: recommended circuit, in-progress circuits, learning paths.
 * Loading → error (PlaceholderView) → content states.
 */
import { memo } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '../../../components/Text';
import { useTheme } from '../../../theme';
import { makeSpacing } from '../../../theme/spacing';
import type { MyCircuitsState, CircuitDetails, LearningPathDetails } from '../types';

export interface MyCircuitsViewProps {
  state: MyCircuitsState;
  onRetry?: () => void;
  onCircuitPress?: (circuit: CircuitDetails) => void;
  onLearningPathPress?: (path: LearningPathDetails) => void;
  /** Render prop for circuit cards */
  renderCircuitCard?: (circuit: CircuitDetails) => React.ReactNode;
  /** Render prop for learning path cards */
  renderLearningPathCard?: (path: LearningPathDetails) => React.ReactNode;
}

export const MyCircuitsView = memo(function MyCircuitsView({
  state, renderCircuitCard, renderLearningPathCard,
}: MyCircuitsViewProps) {
  const { colors } = useTheme();

  if (state.status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.mcWhite} />
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.centered}>
        <Text variant="body" color={colors.mcWhite2}>Unable to load content</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Recommended */}
      {state.recommended && (
        <View style={styles.section}>
          <Text variant="h4" color={colors.mcWhite}>Continue learning</Text>
          {renderCircuitCard?.(state.recommended)}
        </View>
      )}

      {/* In Progress */}
      {state.inProgress.length > 0 && (
        <View style={styles.section}>
          <Text variant="h4" color={colors.mcWhite}>In progress</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {state.inProgress.map(c => (
              <View key={c.id}>{renderCircuitCard?.(c)}</View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Learning Paths */}
      {state.learningPaths.length > 0 && (
        <View style={styles.section}>
          <Text variant="h4" color={colors.mcWhite}>Learning Paths</Text>
          {state.learningPaths.map(lp => (
            <View key={lp.id}>{renderLearningPathCard?.(lp)}</View>
          ))}
        </View>
      )}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: makeSpacing(4), gap: makeSpacing(5) },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { gap: makeSpacing(3) },
  horizontalList: { gap: makeSpacing(3) },
});
