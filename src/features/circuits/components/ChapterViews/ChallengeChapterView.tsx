/**
 * ChallengeChapterView — Quiz/challenge with multiple choice questions.
 */
import React, { memo, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text } from '../../../../components/Text';
import { makeSpacing } from '../../../../theme/spacing';

interface ChallengeQuestion {
  id: string;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface ChallengeChapterViewProps {
  title: string;
  questions: ChallengeQuestion[];
  onComplete: (score: number, total: number) => void;
}

export const ChallengeChapterView = memo(function ChallengeChapterView({
  title,
  questions,
  onComplete,
}: ChallengeChapterViewProps) {
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[qIndex];
  const isCorrect = selected === q?.correctAnswer;
  const isLast = qIndex >= questions.length - 1;

  if (finished) {
    return (
      <View style={styles.container}>
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>
            {score >= questions.length * 0.7 ? '🎉' : '💪'}
          </Text>
          <Text style={styles.resultTitle}>
            {score >= questions.length * 0.7
              ? 'Great job!'
              : 'Keep practicing!'}
          </Text>
          <Text style={styles.resultScore}>
            {score}/{questions.length} correct
          </Text>
          <Pressable
            onPress={() => onComplete(score, questions.length)}
            style={styles.primaryBtn}
            accessibilityLabel="Continue"
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!q) return null;

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
  };

  const handleSubmit = () => {
    if (!selected) return;
    setAnswered(true);
    if (selected === q.correctAnswer) setScore(score + 1);
  };

  const handleNext = () => {
    if (isLast) {
      const finalScore = score + (isCorrect ? 0 : 0); // score already updated
      setFinished(true);
    } else {
      setQIndex(qIndex + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.chapterType}>
          CHALLENGE • Question {qIndex + 1}/{questions.length}
        </Text>
        <Text style={styles.chapterTitle}>{title}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.question}>{q.question}</Text>

        {q.options.map((opt) => {
          const isSelected = opt === selected;
          const isAnswer = opt === q.correctAnswer;
          let bg = '#1A1C20';
          if (answered && isAnswer) bg = 'rgba(0,255,158,0.15)';
          else if (answered && isSelected && !isCorrect)
            bg = 'rgba(255,36,91,0.15)';
          else if (isSelected) bg = 'rgba(255,92,36,0.15)';

          return (
            <Pressable
              key={opt}
              onPress={() => handleSelect(opt)}
              style={[styles.option, { backgroundColor: bg }]}
              accessibilityLabel={opt}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[styles.optionText, isSelected && styles.optionSelected]}
              >
                {opt}
              </Text>
              {answered && isAnswer && <Text style={styles.checkmark}>✓</Text>}
              {answered && isSelected && !isCorrect && (
                <Text style={styles.crossmark}>✗</Text>
              )}
            </Pressable>
          );
        })}

        {answered && q.explanation && (
          <View style={styles.explanation}>
            <Text style={styles.explanationText}>{q.explanation}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.nav}>
        {!answered ? (
          <Pressable
            onPress={handleSubmit}
            style={[styles.primaryBtn, !selected && styles.btnDisabled]}
            disabled={!selected}
            accessibilityLabel="Submit answer"
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>Submit</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleNext}
            style={styles.primaryBtn}
            accessibilityLabel={isLast ? 'See results' : 'Next question'}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>
              {isLast ? 'See Results' : 'Next'}
            </Text>
          </Pressable>
        )}
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
  scroll: { flex: 1 },
  content: { padding: makeSpacing(4), gap: makeSpacing(3) },
  question: {
    color: '#F7F7F7',
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 26,
    marginBottom: makeSpacing(2),
  },
  option: {
    padding: makeSpacing(4),
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: { color: '#F7F7F7', fontSize: 16, flex: 1 },
  optionSelected: { fontWeight: '600' },
  checkmark: { color: '#00FF9E', fontSize: 18, fontWeight: '700' },
  crossmark: { color: '#FF245B', fontSize: 18, fontWeight: '700' },
  explanation: {
    padding: makeSpacing(3),
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
  },
  explanationText: {
    color: 'rgba(247,247,247,0.7)',
    fontSize: 14,
    lineHeight: 20,
  },
  nav: { padding: makeSpacing(4), paddingBottom: makeSpacing(8) },
  primaryBtn: {
    backgroundColor: '#FF5C24',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#F7F7F7', fontSize: 16, fontWeight: '600' },
  btnDisabled: { opacity: 0.4 },
  // Results
  resultCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: makeSpacing(6),
    gap: makeSpacing(4),
  },
  resultEmoji: { fontSize: 64 },
  resultTitle: { color: '#F7F7F7', fontSize: 28, fontWeight: '700' },
  resultScore: { color: 'rgba(247,247,247,0.6)', fontSize: 18 },
});
