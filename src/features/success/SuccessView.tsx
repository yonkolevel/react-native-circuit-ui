/**
 * SuccessView — Displays success/completion modal with progress ring.
 *
 * MDC-251: Shows circular progress ring with percentage,
 * "Try Again" and "Finish" buttons.
 *
 * Usage:
 *   <SuccessView
 *     progress={0.75}
 *     onTryAgain={() => handleRetry()}
 *     onFinish={() => handleFinish()}
 *   />
 */
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SuccessViewProps {
  /** Progress value between 0 and 1 */
  progress: number;
  /** Called when user taps "Try Again" */
  onTryAgain: () => void;
  /** Called when user taps "Finish" */
  onFinish: () => void;
  /** Optional: override title text */
  title?: string;
}

export function SuccessView({
  progress,
  onTryAgain,
  onFinish,
  title = 'Great job!',
}: SuccessViewProps) {
  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const percentage = Math.round(clampedProgress * 100);

  return (
    <View style={styles.container}>
      {/* Progress Ring */}
      <View style={styles.ringContainer}>
        <View style={styles.ringOuter}>
          <View style={styles.ringInner}>
            <Text style={styles.percentageText}>{percentage}%</Text>
          </View>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onTryAgain}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Try Again</Text>
        </TouchableOpacity>

        <View style={styles.buttonSpacer} />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onFinish}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Finish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 24,
  },
  ringContainer: {
    marginBottom: 32,
  },
  ringOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#FF5C24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#1A1C20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    color: '#F7F7F7',
    fontSize: 32,
    fontWeight: '700',
  },
  title: {
    color: '#F7F7F7',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 32,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonSpacer: {
    width: 16,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F7F7F7',
  },
  secondaryButtonText: {
    color: '#F7F7F7',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#FF5C24',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 6,
  },
  primaryButtonText: {
    color: '#F7F7F7',
    fontSize: 16,
    fontWeight: '600',
  },
});
