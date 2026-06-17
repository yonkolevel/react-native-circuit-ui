/**
 * ExportAudioView — RN port of MidicircuitKit `ExportAudioView`.
 *
 * Settings → Export Audio navigates here (it always opens, even for an empty
 * playground). This view owns the export guard: it shows an explicit
 * ready/empty state and the actual "Export Audio" button is disabled until the
 * playground has MIDI notes or an audio-file reference — matching iOS.
 *
 * The UI package owns the view and its state affordance; the host app provides
 * the native bridge/share work via `onExport`.
 */
import { memo, useState } from 'react';
import {
  View,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { Text } from '../../../../components/Text';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { GradientCover } from '../../../../components/GradientCover';
import { useTheme } from '../../../../theme';
import { makeSpacing } from '../../../../theme/spacing';
import { useSongContext } from '../../stores/playgroundStore';
import { useShallow } from 'zustand/react/shallow';
import { hasExportableAudioContent } from '../../utils/hasExportableAudioContent';

export interface ExportAudioViewProps {
  /** Whether the export view is presented. */
  visible: boolean;
  /** Dismiss the export view. */
  onClose: () => void;
  /**
   * Primary action — the actual export/share work, wired by the host app to the
   * native bridge. May be async; the button shows a spinner while it runs.
   */
  onExport: () => void | Promise<void>;
  /** Playground name shown under the cover. */
  playgroundName?: string;
  /** Artist/author name shown under the title. */
  artistName?: string;
  /** Optional cover image URL. Falls back to a deterministic gradient cover. */
  coverImageUrl?: string;
  /** Stable id used to derive the gradient cover (defaults to the song id). */
  coverId?: string;
  /** testID for the close button (defaults to iOS identifier). */
  closeButtonTestID?: string;
  /** testID for the export button (defaults to iOS identifier). */
  exportButtonTestID?: string;
}

const READY_COPY = 'Ready to export';
const EMPTY_COPY = 'Nothing to export';
const DISABLED_REASON =
  'Disabled until the playground contains notes or audio';

export const ExportAudioView = memo(function ExportAudioView({
  visible,
  onClose,
  onExport,
  playgroundName,
  artistName = 'Artist',
  coverImageUrl,
  coverId,
  closeButtonTestID = 'closeButton',
  exportButtonTestID = 'exportAudioButton',
}: ExportAudioViewProps) {
  const { colors } = useTheme();

  const songId = useSongContext((s) => s.id);
  const tracks = useSongContext(useShallow((s) => s.tracks));
  const canExport = hasExportableAudioContent(tracks);

  const [isExporting, setIsExporting] = useState(false);

  const exportDisabled = !canExport || isExporting;
  const gradientId = coverId ?? songId ?? 'export-cover';
  const hasName = typeof playgroundName === 'string' && playgroundName.length > 0;

  const handleExport = async () => {
    if (exportDisabled) return;
    setIsExporting(true);
    try {
      await onExport();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={[styles.root, { backgroundColor: colors.mcBlack }]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
              testID={closeButtonTestID}
            >
              <Icon icon={Icons.close} size={24} color={colors.mcWhite3} />
            </Pressable>
          </View>

          <View style={styles.body}>
            {/* Cover */}
            <View style={styles.coverWrap}>
              {coverImageUrl ? (
                <Image
                  source={{ uri: coverImageUrl }}
                  style={styles.coverImage}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <GradientCover id={gradientId} width={280} height={280} />
              )}
            </View>

            {/* Title + artist */}
            <View style={styles.titleBlock}>
              {hasName && (
                <Text variant="h4" color={colors.mcWhite} center>
                  {playgroundName}
                </Text>
              )}
              <Text variant="label" color={colors.mcWhite3} center>
                {artistName}
              </Text>
            </View>

            <View
              style={[styles.divider, { backgroundColor: colors.mcWhite4 }]}
            />

            {/* Status + export control */}
            <View style={styles.controls}>
              <Text
                variant="small"
                color={colors.mcWhite3}
                center
                style={styles.statusText}
              >
                {canExport ? READY_COPY : EMPTY_COPY}
              </Text>

              <Pressable
                onPress={handleExport}
                disabled={exportDisabled}
                accessibilityRole="button"
                accessibilityLabel="Export Audio"
                accessibilityState={{ disabled: exportDisabled }}
                accessibilityValue={{
                  text: canExport ? 'Ready' : DISABLED_REASON,
                }}
                testID={exportButtonTestID}
                style={[
                  styles.exportButton,
                  { backgroundColor: colors.mcWhite },
                  ...(exportDisabled ? [styles.exportButtonDisabled] : []),
                ]}
              >
                {isExporting ? (
                  <ActivityIndicator color={colors.mcBlack} />
                ) : (
                  <>
                    <Icon
                      icon={Icons.audioTrack}
                      size={16}
                      color={colors.mcBlack}
                    />
                    <Text variant="label" color={colors.mcBlack}>
                      Export Audio
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
});

export default ExportAudioView;

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: makeSpacing(6),
    paddingTop: makeSpacing(5),
    paddingBottom: makeSpacing(8),
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: makeSpacing(6),
    paddingBottom: makeSpacing(10),
    gap: makeSpacing(6),
  },
  coverWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  coverImage: {
    width: 280,
    height: 280,
  },
  titleBlock: {
    gap: makeSpacing(2),
    paddingHorizontal: makeSpacing(8),
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginHorizontal: makeSpacing(8),
    opacity: 0.4,
  },
  controls: {
    alignSelf: 'stretch',
    gap: makeSpacing(4),
    paddingHorizontal: makeSpacing(6),
  },
  statusText: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: makeSpacing(3),
    borderRadius: 6,
    minHeight: 44,
  },
  exportButtonDisabled: {
    opacity: 0.4,
  },
});
