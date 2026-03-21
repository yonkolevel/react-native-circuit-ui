/**
 * CircuitUI Component Exports
 *
 * Organized by atomic design level:
 * - Atoms: Text, Button, Input, Avatar, ProgressBar, LevelIndicator, ToolbarButton, ScoreIndicator, HintBubble, DurationLabel, ConnectedInstrument, DeviceLabel, PreviewLabel, PreviewDot
 * - Molecules: CircuitCard, LearningPathCard, Banner, Modal, SegmentedProgressBar, PlaceholderView, InfoSheet
 * - Compounds: CircularProgress, GradientCover, CircularLoadingView
 */

// ── Atoms ───────────────────────────────────────────────────────────────────
export { Text } from './Text';
export type { TextProps } from './Text';

export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Input } from './Input';
export type { InputProps, InputState } from './Input';

export { Avatar } from './Avatar';
export type { AvatarProps } from './Avatar';

export { ProgressBar } from './ProgressBar';
export type { ProgressBarProps } from './ProgressBar';

export { LevelIndicator, LevelIcon } from './LevelIndicator';
export type { LevelIndicatorProps, LevelIconProps, Level } from './LevelIndicator';

export { ToolbarButton } from './ToolbarButton';
export type { ToolbarButtonProps, ToolbarButtonType } from './ToolbarButton';

export { ScoreIndicator } from './ScoreIndicator';
export type { ScoreIndicatorProps } from './ScoreIndicator';

export { HintBubble } from './HintBubble';
export type { HintBubbleProps } from './HintBubble';

export { DurationLabel } from './DurationLabel';
export type { DurationLabelProps } from './DurationLabel';

export { ConnectedInstrument } from './ConnectedInstrument';
export type { ConnectedInstrumentProps } from './ConnectedInstrument';

export { PreviewLabel, PreviewDot } from './PreviewLabel';
export type { PreviewLabelProps, PreviewDotProps } from './PreviewLabel';

export { DeviceLabel } from './DeviceLabel';
export type { DeviceLabelProps } from './DeviceLabel';

// ── Molecules ───────────────────────────────────────────────────────────────
export { CircuitCard } from './CircuitCard';
export type { CircuitCardProps, CircuitCardVariant, CircuitCardSize } from './CircuitCard';

export { LearningPathCard } from './LearningPathCard';
export type { LearningPathCardProps, LearningPathDetails, CardSize } from './LearningPathCard';

export { Banner } from './Banner';
export type { BannerProps } from './Banner';

export { Modal } from './Modal';
export type { ModalProps } from './Modal';

export { SegmentedProgressBar } from './SegmentedProgressBar';
export type { SegmentedProgressBarProps } from './SegmentedProgressBar';

export { PlaceholderView } from './PlaceholderView';
export type { PlaceholderViewProps, PlaceholderType, PlaceholderButton } from './PlaceholderView';

export { InfoSheet } from './InfoSheet';
export type { InfoSheetProps } from './InfoSheet';

// ── Compounds ───────────────────────────────────────────────────────────────
export { CircularProgress } from './CircularProgress';
export type { CircularProgressProps, CircularProgressSize } from './CircularProgress';

export { GradientCover, gradientColorsForId } from './GradientCover';
export type { GradientCoverProps } from './GradientCover';

export { CircularLoadingView } from './CircularLoadingView';
export type { CircularLoadingViewProps } from './CircularLoadingView';

// ── Additional SharedViews ──────────────────────────────────────────────────
export { ScreenContainer } from './ScreenContainer';
export type { ScreenContainerProps } from './ScreenContainer';

export { LoadingView } from './LoadingView';
export type { LoadingViewProps } from './LoadingView';

export { MenuLabel } from './MenuLabel';
export type { MenuLabelProps } from './MenuLabel';

export { PopAnimation } from './PopAnimation';
export type { PopAnimationProps } from './PopAnimation';

export { SFSymbol, Icon, Icons } from './SFSymbol';
export type { SFSymbolProps, SFSymbolWeight, IconProps, IconDef, IconName } from './SFSymbol';

export { MultiTouchOverlay } from './MultiTouchOverlay';
export type { MultiTouchOverlayProps } from './MultiTouchOverlay';
