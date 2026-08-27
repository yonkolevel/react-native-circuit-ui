import { memo, useEffect, useRef, type RefObject } from 'react';
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  findNodeHandle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Button } from '../Button';
import { ProgressBar } from '../ProgressBar';
import { Icon, Icons, type IconDef } from '../SFSymbol';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { hexToRgba } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export type MissionMode = 'Learn' | 'Practice' | 'Recall' | 'Creative';
export type MissionFeedbackTone = 'neutral' | 'failure' | 'success' | 'runtime';
export type MissionRailFocusTarget = 'details' | 'feedback' | 'primary';

export interface MissionProgress {
  current: number;
  total: number;
  label?: string;
}

export interface MissionRailAction {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  a11yId?: string;
}

export interface MissionRailFeedback {
  message: string;
  tone: MissionFeedbackTone;
  announce?: boolean;
}

export interface MissionRailProps {
  mode: MissionMode;
  title: string;
  instructions: string;
  progress?: MissionProgress;
  feedback?: MissionRailFeedback;
  helpMessage?: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  primaryAction?: MissionRailAction;
  secondaryAction?: MissionRailAction;
  contextAction?: MissionRailAction;
  onExit?: () => void;
  disabled?: boolean;
  readOnly?: boolean;
  placement?: 'bottom' | 'side';
  safeAreaBottom?: number;
  focusTarget?: MissionRailFocusTarget;
  focusVersion?: number;
  a11yId?: string;
  progressA11yId?: string;
  detailsA11yId?: string;
  feedbackA11yId?: string;
  exitA11yId?: string;
  style?: StyleProp<ViewStyle>;
}

function focusElement(ref: RefObject<View | null>): void {
  const element = ref.current;
  if (!element) return;
  if (Platform.OS === 'web') {
    (element as unknown as { focus?: () => void }).focus?.();
    return;
  }
  const handle = findNodeHandle(element);
  if (handle != null) AccessibilityInfo.setAccessibilityFocus(handle);
}

export const MissionRail = memo(function MissionRail({
  mode,
  title,
  instructions,
  progress,
  feedback,
  helpMessage,
  expanded,
  onExpandedChange,
  primaryAction,
  secondaryAction,
  contextAction,
  onExit,
  disabled = false,
  readOnly = false,
  placement = 'bottom',
  safeAreaBottom = 0,
  focusTarget,
  focusVersion = 0,
  a11yId = 'mission-rail',
  progressA11yId = `${a11yId}-progress`,
  detailsA11yId = `${a11yId}-details`,
  feedbackA11yId = `${a11yId}-feedback`,
  exitA11yId = `${a11yId}-exit`,
  style,
}: MissionRailProps) {
  const { colors } = useTheme();
  const detailsRef = useRef<View>(null);
  const feedbackRef = useRef<View>(null);
  const primaryRef = useRef<View>(null);
  const bodyScrollRef = useRef<ScrollView>(null);
  const isExpanded = expanded || placement === 'side';
  const previousExpanded = useRef(isExpanded);
  const accent = {
    Learn: colors.mcOrange,
    Practice: colors.mcBlue,
    Recall: colors.mcPurple,
    Creative: colors.mcGreen,
  }[mode];
  const progressValue = progress
    ? (progress.current / Math.max(1, progress.total)) * 100
    : 0;
  const feedbackIsAlert =
    feedback?.announce === true &&
    (feedback.tone === 'failure' || feedback.tone === 'runtime');
  const liveRegion = feedbackIsAlert
    ? 'assertive'
    : feedback?.announce
      ? 'polite'
      : 'none';
  // One tone reads as one colour plus one platform glyph. The glyph carries the
  // state when colour alone is too quiet (small text, dark surface, colour
  // vision deficiency) — SF Symbols on iOS, Material on Android, Lucide on web.
  const feedbackTones: Record<
    MissionFeedbackTone,
    { color: string; icon: IconDef }
  > = {
    neutral: { color: colors.mcWhite3, icon: Icons.infoCircle },
    failure: { color: colors.mcPink, icon: Icons.warning },
    success: { color: colors.mcGreen, icon: Icons.checkmark },
    runtime: { color: colors.mcOrange, icon: Icons.warning },
  };
  const feedbackTone = feedbackTones[feedback?.tone ?? 'neutral'];
  const feedbackColor = feedbackTone.color;

  useEffect(() => {
    if (previousExpanded.current !== isExpanded) {
      previousExpanded.current = isExpanded;
      focusElement(detailsRef);
      return;
    }
    if (focusTarget === 'feedback' && isExpanded) focusElement(feedbackRef);
    else if (focusTarget === 'details') focusElement(detailsRef);
    else if (focusTarget === 'primary') focusElement(primaryRef);
  }, [focusTarget, focusVersion, isExpanded]);

  const action = primaryAction ? (
    <Button
      buttonRef={primaryRef}
      label={primaryAction.label}
      accessibilityLabel={
        primaryAction.accessibilityLabel ?? primaryAction.label
      }
      onPress={primaryAction.onPress}
      disabled={disabled || primaryAction.disabled}
      loading={primaryAction.loading}
      a11yId={primaryAction.a11yId}
      fullWidth
    />
  ) : null;

  const modeAndProgress = (
    <View
      style={styles.modeRow}
      accessible
      accessibilityLabel={`${mode} mission${readOnly ? ', read only' : ''}`}
      accessibilityState={{
        expanded: isExpanded,
        disabled: disabled || undefined,
      }}
    >
      <Text variant="small" color={accent} uppercase numberOfLines={1}>
        {mode}
      </Text>
      {progress ? (
        <Text
          variant="small"
          color={colors.mcWhite3}
          numberOfLines={1}
          accessible={false}
        >
          {progress.label ?? `${progress.current} of ${progress.total}`}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        // The deck owns its safe-area strip, so it paints the panel surface
        // rather than letting the editor's black show through beneath it.
        { backgroundColor: colors.mcBlack2, paddingBottom: safeAreaBottom },
        placement === 'side' && styles.sideContainer,
        style,
      ]}
      testID={a11yId}
    >
      <View
        style={[
          styles.panel,
          { backgroundColor: colors.mcBlack2, borderColor: colors.mcBlack4 },
          placement === 'side' ? styles.sidePanel : styles.bottomPanel,
          isExpanded && styles.expandedPanel,
        ]}
      >
        {progress ? (
          <ProgressBar
            value={progressValue}
            tintColor={accent}
            height={3}
            animated={false}
            style={styles.progressRule}
            accessibilityLabel={progress.label ?? 'Mission progress'}
            a11yId={progressA11yId}
          />
        ) : (
          <View style={[styles.accentRule, { backgroundColor: accent }]} />
        )}

        {/* Compact feedback stays audible without forcing the details body open. */}
        <View
          pointerEvents="none"
          accessibilityRole={
            !isExpanded && feedbackIsAlert ? 'alert' : undefined
          }
          accessibilityLiveRegion={!isExpanded ? liveRegion : 'none'}
          accessibilityLabel={!isExpanded ? feedback?.message : undefined}
          testID={!isExpanded && feedback ? feedbackA11yId : undefined}
          style={styles.liveRegion}
        >
          <Text variant="small">
            {!isExpanded ? (feedback?.message ?? '') : ''}
          </Text>
        </View>

        {isExpanded ? (
          <>
            <Pressable
              ref={detailsRef}
              onPress={
                placement === 'side' ? undefined : () => onExpandedChange(false)
              }
              disabled={placement === 'side'}
              accessibilityLabel={
                placement === 'side'
                  ? `${mode} mission details`
                  : 'Hide mission details'
              }
              accessibilityRole={placement === 'side' ? undefined : 'button'}
              accessibilityState={{ expanded: true }}
              testID={detailsA11yId}
              style={(interaction) => [
                styles.expandedHeader,
                Platform.OS === 'web' &&
                (interaction as typeof interaction & { focused?: boolean })
                  .focused
                  ? { boxShadow: `0 0 0 2px ${accent}` }
                  : undefined,
              ]}
            >
              <View style={styles.expandedTitle}>
                {modeAndProgress}
                <Text variant="quote" color={colors.mcWhite} numberOfLines={2}>
                  {title}
                </Text>
              </View>
              {placement !== 'side' ? (
                <View style={styles.disclosure} accessible={false}>
                  <Text variant="small" color={colors.mcWhite3} uppercase>
                    Hide
                  </Text>
                  <Icon
                    icon={Icons.chevronDown}
                    size={16}
                    color={colors.mcWhite3}
                  />
                </View>
              ) : null}
            </Pressable>

            <ScrollView
              ref={bodyScrollRef}
              style={styles.bodyScroll}
              contentContainerStyle={styles.bodyContent}
              nestedScrollEnabled
              onContentSizeChange={() => {
                if (helpMessage || contextAction) {
                  bodyScrollRef.current?.scrollToEnd({ animated: false });
                }
              }}
            >
              <Text variant="body" color={colors.mcWhite2}>
                {instructions}
              </Text>

              {feedback ? (
                <View
                  ref={feedbackRef}
                  collapsable={false}
                  accessibilityRole={feedbackIsAlert ? 'alert' : undefined}
                  accessibilityLiveRegion={liveRegion}
                  accessibilityLabel={feedback.message}
                  testID={feedbackA11yId}
                  style={[
                    styles.feedback,
                    {
                      borderColor: hexToRgba(feedbackColor, 0.4),
                      backgroundColor: hexToRgba(feedbackColor, 0.12),
                    },
                  ]}
                >
                  <Icon
                    icon={feedbackTone.icon}
                    size={18}
                    color={feedbackColor}
                    style={styles.feedbackIcon}
                  />
                  <Text
                    variant="body"
                    color={colors.mcWhite}
                    style={styles.feedbackText}
                  >
                    {feedback.message}
                  </Text>
                </View>
              ) : null}

              {secondaryAction ? (
                <Button
                  label={secondaryAction.label}
                  accessibilityLabel={
                    secondaryAction.accessibilityLabel ?? secondaryAction.label
                  }
                  variant="normal"
                  onPress={secondaryAction.onPress}
                  disabled={disabled || secondaryAction.disabled}
                  loading={secondaryAction.loading}
                  a11yId={secondaryAction.a11yId}
                  fullWidth
                />
              ) : null}

              {helpMessage || contextAction ? (
                <View
                  style={[
                    styles.help,
                    {
                      backgroundColor: colors.mcBlack3,
                      borderColor: colors.mcBlack4,
                    },
                  ]}
                >
                  {helpMessage ? (
                    <Text variant="small" color={colors.mcWhite2}>
                      {helpMessage}
                    </Text>
                  ) : null}
                  {contextAction ? (
                    <Button
                      label={contextAction.label}
                      accessibilityLabel={
                        contextAction.accessibilityLabel ?? contextAction.label
                      }
                      variant="normal"
                      onPress={contextAction.onPress}
                      disabled={disabled || contextAction.disabled}
                      loading={contextAction.loading}
                      a11yId={contextAction.a11yId}
                      fullWidth
                    />
                  ) : null}
                </View>
              ) : null}
            </ScrollView>

            <View
              style={[
                styles.expandedFooter,
                { borderTopColor: colors.mcBlack4 },
              ]}
            >
              {onExit ? (
                <View style={styles.quitSlot}>
                  <Button
                    label="Quit"
                    accessibilityLabel="Exit lesson"
                    variant="normal"
                    onPress={onExit}
                    disabled={disabled}
                    a11yId={exitA11yId}
                    fullWidth
                  />
                </View>
              ) : null}
              <View style={onExit ? styles.primarySlot : styles.primaryFull}>
                {action}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.compactDeck}>
            <Pressable
              ref={detailsRef}
              onPress={() => onExpandedChange(true)}
              accessibilityLabel={`${mode} mission: ${title}`}
              accessibilityHint="Shows explanation, feedback, help, and exit"
              accessibilityRole="button"
              accessibilityState={{ expanded: false }}
              testID={detailsA11yId}
              style={(interaction) => [
                styles.compactCopy,
                Platform.OS === 'web' &&
                (interaction as typeof interaction & { focused?: boolean })
                  .focused
                  ? { boxShadow: `0 0 0 2px ${accent}` }
                  : undefined,
              ]}
            >
              {/* Meta and disclosure sit on their own line so the task title
                  owns the full width instead of truncating at 320pt. */}
              <View style={styles.metaRow} accessible={false}>
                <Text
                  variant="small"
                  color={accent}
                  uppercase
                  numberOfLines={1}
                >
                  {mode}
                </Text>
                {progress ? (
                  <Text
                    variant="small"
                    color={colors.mcWhite3}
                    numberOfLines={1}
                    style={styles.metaProgress}
                    accessible={false}
                  >
                    {progress.label ??
                      `${progress.current} of ${progress.total}`}
                  </Text>
                ) : (
                  <View style={styles.metaProgress} />
                )}
                <Icon icon={Icons.chevronUp} size={16} color={accent} />
              </View>
              <Text
                variant="label"
                color={colors.mcWhite}
                numberOfLines={2}
                accessible={false}
              >
                {title}
              </Text>
              {feedback ? (
                <View style={styles.compactStatus} accessible={false}>
                  <Icon
                    icon={feedbackTone.icon}
                    size={14}
                    color={feedbackColor}
                    style={styles.compactStatusIcon}
                  />
                  <Text
                    variant="small"
                    color={feedbackColor}
                    numberOfLines={2}
                    style={styles.compactStatusText}
                  >
                    {feedback.message}
                  </Text>
                </View>
              ) : (
                <Text variant="small" color={colors.mcWhite2} numberOfLines={2}>
                  {instructions}
                </Text>
              )}
            </Pressable>
            {action}
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexShrink: 0,
    overflow: 'hidden',
  },
  // The deck docks to the edge it belongs to. A floating rounded card left
  // black gutters around it and clipped the progress rule into rounded corners;
  // flush edges let that rule read as the deck's own top boundary.
  panel: { flexShrink: 1, minHeight: 0 },
  bottomPanel: { borderTopWidth: StyleSheet.hairlineWidth },
  sideContainer: { height: '100%' },
  sidePanel: { flex: 1, borderLeftWidth: StyleSheet.hairlineWidth },
  expandedPanel: { flex: 1, minHeight: 0 },
  // ProgressBar rounds its own ends by default; squared off here so the rule
  // reads as the deck's top boundary rather than a pill floating on the edge.
  progressRule: { borderRadius: 0 },
  accentRule: { height: 3, width: '100%' },
  liveRegion: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01,
    overflow: 'hidden',
  },

  // ─── Vertical rhythm ──────────────────────────────────────────────────────
  // Four steps off the 4pt grid, used consistently:
  //   spacing.xs  (4)  — label to its value
  //   spacing.sm  (8)  — within one group
  //   spacing.md  (12) — between stacked blocks
  //   spacing.lg  (16) — edge gutter and section separation

  modeRow: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  compactDeck: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  compactCopy: {
    minWidth: 0,
    justifyContent: 'center',
    minHeight: 48,
    gap: spacing.xs,
  },
  metaRow: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaProgress: { flex: 1, minWidth: 0, textAlign: 'right' },
  compactStatus: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  compactStatusIcon: { marginTop: 2 },
  compactStatusText: { flex: 1, minWidth: 0 },
  expandedHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  expandedTitle: { flex: 1, minWidth: 0, gap: spacing.xs },
  bodyScroll: { flex: 1, minHeight: 0 },
  bodyContent: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  feedback: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
  },
  feedbackIcon: { marginTop: 1 },
  feedbackText: { flex: 1, minWidth: 0 },
  disclosure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  help: {
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
  },
  expandedFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  quitSlot: { flex: 3 },
  primarySlot: { flex: 7 },
  primaryFull: { flex: 1 },
});
