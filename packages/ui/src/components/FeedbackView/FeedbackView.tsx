/**
 * FeedbackView — React Native port of MidicircuitKit's SwiftUI FeedbackView.
 *
 * Emoji multi-select ("pick as many as you like") + a free-text field, with a
 * Send Feedback action. Presentational only: the host app decides how feedback
 * is delivered (compose an email, etc.) via the `onSend` callback. Shared by
 * iOS and Android so both platforms stay at parity.
 */
import { memo, useState } from 'react';
import { View, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native';
import { Text } from '../Text';
import { Button } from '../Button';
import { Icon, Icons } from '../SFSymbol';
import { useTheme } from '../../theme';
import { makeSpacing } from '../../theme/spacing';

/** Same emoji set as the native FeedbackView, same order. */
export const FEEDBACK_EMOJIS = [
  '🥵', '😒', '🤨', '😎', '🤩', '🤘', '🎉', '🤯', '🔥', '🚀', '💡',
] as const;

export interface FeedbackViewProps {
  /** Called when the user taps Send Feedback. */
  onSend: (emojis: string[], feedback: string) => void;
  /** Called when the user dismisses the view (close button). */
  onClose?: () => void;
  /**
   * Optional "email us directly" escape hatch so users can always reach us
   * regardless of the form.
   */
  onEmailDirectly?: () => void;
  a11yId?: string;
}

export const FeedbackView = memo(function FeedbackView({
  onSend,
  onClose,
  onEmailDirectly,
  a11yId,
}: FeedbackViewProps) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');

  const toggleEmoji = (emoji: string) =>
    setSelected((prev) =>
      prev.includes(emoji) ? prev.filter((e) => e !== emoji) : [...prev, emoji],
    );

  // Allow sending once there's at least an emoji or some text.
  const canSend = selected.length > 0 || feedback.trim().length > 0;

  return (
    <View style={styles.container} accessibilityLabel="Send feedback" testID={a11yId}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="body" color={colors.mcWhite} style={styles.headerTitle}>
          How do you feel about Midicircuit?
        </Text>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Icon icon={Icons.close} size={24} color={colors.mcWhite3} />
        </Pressable>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Emoji multi-select */}
        <Text variant="small" color={colors.mcWhite3} style={styles.sectionHint}>
          Pick as many as you like
        </Text>
        <View style={styles.emojiGrid}>
          {FEEDBACK_EMOJIS.map((emoji) => {
            const isSelected = selected.includes(emoji);
            return (
              <Pressable
                key={emoji}
                onPress={() => toggleEmoji(emoji)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${emoji}${isSelected ? ', selected' : ''}`}
                style={[
                  styles.emojiCell,
                  isSelected && { backgroundColor: colors.mcWhite4 },
                ]}
              >
                <Text variant="h3" color={colors.mcWhite}>{emoji}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Free text */}
        <View style={styles.textHeader}>
          <Text variant="body" color={colors.mcWhite}>Anything we could do better?</Text>
          <Text variant="small" color={colors.mcWhite3}>Every bit of feedback helps!</Text>
        </View>
        <TextInput
          value={feedback}
          onChangeText={setFeedback}
          multiline
          autoCorrect={false}
          textAlignVertical="top"
          placeholder="Tell us anything…"
          placeholderTextColor={colors.mcWhite4}
          style={[styles.textInput, { color: colors.mcWhite, borderColor: colors.mcWhite4 }]}
          accessibilityLabel="Feedback message"
        />
      </ScrollView>

      {/* Actions */}
      <Button
        variant="primary"
        label="Send Feedback"
        fullWidth
        disabled={!canSend}
        onPress={() => onSend(selected, feedback.trim())}
        a11yId={a11yId ? `${a11yId}-send` : undefined}
        style={styles.sendButton}
      />
      {onEmailDirectly && (
        <Pressable onPress={onEmailDirectly} hitSlop={8} style={styles.emailDirectly} accessibilityRole="button">
          <Text variant="small" color={colors.mcWhite3}>Prefer to email us directly?</Text>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { padding: makeSpacing(4), gap: makeSpacing(3) },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: makeSpacing(2),
  },
  headerTitle: { flex: 1 },
  sectionHint: { marginBottom: makeSpacing(2) },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: makeSpacing(2),
    marginBottom: makeSpacing(3),
  },
  emojiCell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textHeader: { marginBottom: makeSpacing(2) },
  textInput: {
    height: 140,
    borderWidth: 1,
    borderRadius: 6,
    padding: makeSpacing(3),
    fontSize: 16,
  },
  sendButton: { marginTop: makeSpacing(2) },
  emailDirectly: { alignItems: 'center', paddingVertical: makeSpacing(1) },
});
