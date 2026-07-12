/**
 * SongView — Main DAW container
 *
 * All state and actions from useSongContext() — zero song/callback/mixer props.
 * Only receives `onBack` (navigation lives outside the store).
 *
 * Layout matching iOS exactly:
 * - Fixed track labels column (80px wide, left side)
 * - Horizontally scrollable section headers + clips (right side)
 */
import { Fragment, memo, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from '../../../../components/Text';
import { Icon, Icons } from '../../../../components/SFSymbol';
import { WithHint, HintIDs } from '../../../../components/Hint';
import { useTheme } from '../../../../theme';
import { SongToolbar } from './SongToolbar';
import { SongMixerTabBar } from './SongMixerTabBar';
import { MixerView } from '../Mixer';
import { SongSettings } from '../Settings';
import { ExportAudioView } from '../ExportAudio';
import { useSongContext, useSongActions } from '../../stores/playgroundStore';
import { useShallow } from 'zustand/react/shallow';
import type { Clip, InstrumentType } from '../../types';
import { INSTRUMENT_COLORS } from '../../types';

const TRACK_ICONS: Record<string, any> = {
  drum: Icons.drumTrack,
  melodic: Icons.melodicTrack,
  bass: Icons.bassTrack,
  audio: Icons.audioTrack,
};
const TRACK_LABELS: Record<string, string> = {
  drum: 'Drums',
  melodic: 'Melodic',
  bass: 'Bass',
  audio: 'Audio',
};
export const GRID = {
  CELL_W: 80,
  CELL_H: 60,
  SECTION_H: 50,
  GAP: 4,
} as const;

const { CELL_W, CELL_H, SECTION_H, GAP } = GRID;

type SongMenuTarget =
  | { kind: 'track'; trackId: number; title: string }
  | { kind: 'confirmTrackDelete'; trackId: number; title: string }
  | { kind: 'clip'; trackId: number; clipId: number }
  | { kind: 'section'; sectionId: number; name: string }
  | { kind: 'renameSection'; sectionId: number };

const webContextMenu = (open: () => void) =>
  Platform.OS === 'web'
    ? ({
        onContextMenu: (event: any) => {
          event.preventDefault?.();
          open();
        },
      } as any)
    : {};

// ── Clip Cell ───────────────────────────────────────────────────────────────

const CLIP_PAD = 2;
const ClipCell = memo(function ClipCell({
  clip,
  color,
  instrumentType,
  sampleCount,
  defaultOctave,
  onPress,
  onLongPress,
  testID,
}: {
  clip?: Clip;
  color: string;
  instrumentType?: InstrumentType;
  sampleCount?: number;
  defaultOctave?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  testID?: string;
}) {
  if (!clip) {
    return (
      <Pressable
        onPress={onPress}
        style={[s.emptyCell, { borderColor: color }]}
      >
        <Icon icon={Icons.plus} size={17} color={color} />
      </Pressable>
    );
  }

  const notes = clip.notes;
  const beatsInClip = Math.max(1, clip.activeLengthInBars) * 4;
  const stepsPerBeat = 4;
  const totalSteps = beatsInClip * stepsPerBeat;
  const totalPad = 4 + CLIP_PAD;
  const w = CELL_W - totalPad * 2;
  const h = CELL_H - totalPad * 2;
  const stepWidth = w / totalSteps;

  const isDrum = instrumentType === 'drum';
  const pitchCount = Math.max(1, sampleCount ?? (isDrum ? 12 : 24));
  const noteNumbers = notes.map((n) => n.noteNumber);
  const effectiveBase =
    defaultOctave && defaultOctave > 0
      ? defaultOctave
      : noteNumbers.length > 0
        ? Math.min(...noteNumbers)
        : 0;
  const rawNoteHeight = h / pitchCount;
  const noteHeight = Math.max(rawNoteHeight, 3);
  const minNoteWidth = Math.max(stepWidth * 0.9, 2);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      testID={testID}
      accessibilityLabel="Edit clip"
      accessibilityRole="button"
      {...webContextMenu(onLongPress ?? (() => {}))}
      style={[s.cell, { backgroundColor: color, borderRadius: 6 }]}
    >
      <View style={[s.cellContent, { padding: CLIP_PAD }]}>
        {notes.slice(0, 30).map((note, i) => {
          if (note.position >= beatsInClip) return null;
          const stepPos = note.position * stepsPerBeat;
          const x = Math.max(0, Math.min(stepPos * stepWidth, w));
          const noteIdx = Math.max(
            0,
            Math.min(note.noteNumber - effectiveBase, pitchCount - 1)
          );
          const yOffset = noteIdx * rawNoteHeight;
          const durW = note.duration * stepsPerBeat * stepWidth;
          const remainW =
            Math.max(0, beatsInClip - note.position) * stepsPerBeat * stepWidth;
          const noteW = Math.min(Math.max(minNoteWidth, durW), remainW);
          const top = h - yOffset - noteHeight;

          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: Math.max(0, top),
                width: noteW,
                height: noteHeight * 0.9,
                backgroundColor: 'rgba(26,28,32,0.4)',
                borderRadius: 2,
              }}
            />
          );
        })}
      </View>
    </Pressable>
  );
});

// ── SongView ────────────────────────────────────────────────────────────────

export interface SongViewProps {
  /** Navigation back — lives outside the song store */
  onBack?: () => void;
  /**
   * The actual export-audio action — wired from PlaygroundScreen to the native
   * StorageBridge/share flow. Invoked by the primary button inside the export
   * view (not the Settings row), matching iOS. May be async.
   */
  onExportAudio?: () => void | Promise<void>;
  /** Export bundle — still invoked directly from the Settings row. */
  onExportBundle?: () => void;
  /** Share the current beat as a remixable link. Omit when unavailable. */
  onShareBeat?: () => void | Promise<void>;
  /** Playground name shown in the export view. */
  playgroundName?: string;
  /** Artist/author name shown in the export view. */
  artistName?: string;
  /** Optional cover image URL for the export view. */
  coverImageUrl?: string;
  style?: StyleProp<ViewStyle>;
}

export const SongView = memo(function SongView({
  onBack,
  onExportAudio,
  onExportBundle,
  onShareBeat,
  playgroundName,
  artistName,
  coverImageUrl,
  style,
}: SongViewProps) {
  const { colors } = useTheme();
  const [exportVisible, setExportVisible] = useState(false);
  const [menuTarget, setMenuTarget] = useState<SongMenuTarget | null>(null);
  const [sectionName, setSectionName] = useState('');

  // State — fine-grained selectors
  const currentTab = useSongContext((s) => s.currentTab);
  const tracks = useSongContext(useShallow((s) => s.tracks));
  const sections = useSongContext(useShallow((s) => s.sections));
  const currentSectionId = useSongContext((s) => s.currentSectionId);

  // Actions — stable refs, no subscription
  const {
    openClipEditor,
    createClip,
    setCurrentSection,
    addSection,
    showAddTrackMenu,
    removeTrack,
    duplicateClip,
    removeClip,
    renameSection,
    duplicateSection,
    removeSection,
  } = useSongActions();

  const showTab = currentTab === 'song' || currentTab === 'mixer';

  return (
    <View style={[s.root, { backgroundColor: colors.mcBlack }, style]}>
      <SongToolbar onBack={onBack} />

      <View style={s.body}>
        {currentTab === 'song' && (
          <View style={s.grid}>
            {/* Fixed labels column */}
            <View style={s.labelsCol}>
              <View style={s.labelsSpacer} />
              {tracks.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() =>
                    setMenuTarget({
                      kind: 'track',
                      trackId: t.id,
                      title: t.title,
                    })
                  }
                  onLongPress={() =>
                    setMenuTarget({
                      kind: 'track',
                      trackId: t.id,
                      title: t.title,
                    })
                  }
                  testID={`track-label-${t.id}`}
                  accessibilityLabel={`${t.title} track options`}
                  accessibilityRole="button"
                  {...webContextMenu(() =>
                    setMenuTarget({
                      kind: 'track',
                      trackId: t.id,
                      title: t.title,
                    })
                  )}
                  style={[
                    s.label,
                    {
                      backgroundColor:
                        (INSTRUMENT_COLORS[t.type] || '#fff') + 'CC',
                    },
                  ]}
                >
                  <Icon
                    icon={TRACK_ICONS[t.type] || Icons.drumTrack}
                    size={20}
                    color={colors.mcBlack}
                  />
                  <Text
                    variant="extraSmall10"
                    color={colors.mcBlack}
                    style={s.labelTxt}
                  >
                    {TRACK_LABELS[t.type] || t.title}
                  </Text>
                </Pressable>
              ))}
              <Pressable onPress={showAddTrackMenu} style={s.addTrack}>
                <Icon icon={Icons.plus} size={12} color={colors.mcBlack5} />
                <Text variant="small" color={colors.mcBlack5}>
                  Add track
                </Text>
              </Pressable>
            </View>

            {/* Scrollable sections + clips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.clipsScroll}
            >
              <View>
                <View style={s.sections}>
                  {sections.map((sec, index) => {
                    const isActive = sec.id === currentSectionId;
                    const openSectionMenu = () =>
                      setMenuTarget({
                        kind: 'section',
                        sectionId: sec.id,
                        name: sec.name || `Section ${index + 1}`,
                      });
                    return (
                      <View key={sec.id} style={s.secTabContainer}>
                        <Pressable
                          onPress={() => setCurrentSection(sec.id)}
                          onLongPress={openSectionMenu}
                          testID={`section-${sec.id}`}
                          {...webContextMenu(openSectionMenu)}
                          style={[
                            s.secTab,
                            {
                              backgroundColor: isActive
                                ? colors.mcWhite
                                : colors.mcWhite3,
                            },
                          ]}
                          accessibilityLabel={`Section ${sec.name || index + 1}`}
                          accessibilityRole="button"
                        >
                          <Text
                            variant="small"
                            color={colors.mcBlack}
                            center
                            numberOfLines={1}
                          >
                            {sec.name || `${index + 1}`}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={openSectionMenu}
                          style={s.itemMenuButton}
                          hitSlop={10}
                          accessibilityLabel={`Options for ${sec.name || `Section ${index + 1}`}`}
                          accessibilityRole="button"
                          testID={`section-menu-${sec.id}`}
                        >
                          <Icon
                            icon={Icons.more}
                            size={14}
                            color={colors.mcBlack}
                          />
                        </Pressable>
                      </View>
                    );
                  })}
                  <Pressable
                    onPress={addSection}
                    style={[s.addSecBtn, { borderColor: colors.black5 }]}
                  >
                    <Icon icon={Icons.plus} size={16} color={colors.mcBlack5} />
                  </Pressable>
                </View>
                <View style={s.clipRows}>
                  {tracks.map((t, trackIndex) => (
                    <View key={t.id} style={s.clipRow}>
                      {sections.map((sec, sectionIndex) => {
                        const clip = t.clips.find(
                          (c) => c.sectionID === sec.id
                        );
                        const openClipMenu = clip
                          ? () =>
                              setMenuTarget({
                                kind: 'clip',
                                trackId: t.id,
                                clipId: clip.id,
                              })
                          : undefined;
                        const cell = (
                          <View style={s.clipCellContainer}>
                            <ClipCell
                              clip={clip}
                              color={INSTRUMENT_COLORS[t.type] || '#fff'}
                              instrumentType={t.type}
                              sampleCount={t.soundBank?.samples?.length}
                              defaultOctave={t.soundBank?.defaultOctave}
                              testID={
                                clip ? `clip-${t.id}-${clip.id}` : undefined
                              }
                              onLongPress={openClipMenu}
                              onPress={() => {
                                if (clip) {
                                  openClipEditor(t.id, clip.id);
                                } else {
                                  // Create clip then immediately open editor
                                  // Compute new ID using same logic as songStore.createClip
                                  const allClipIds = tracks.flatMap((tr) =>
                                    tr.clips.map((c) => c.id)
                                  );
                                  const newClipId =
                                    allClipIds.length > 0
                                      ? Math.max(...allClipIds) + 1
                                      : 0;
                                  createClip(t.id, sec.id);
                                  openClipEditor(t.id, newClipId);
                                }
                              }}
                            />
                            {clip && openClipMenu && (
                              <Pressable
                                onPress={openClipMenu}
                                style={s.itemMenuButton}
                                hitSlop={10}
                                accessibilityLabel="Clip options"
                                accessibilityRole="button"
                                testID={`clip-menu-${t.id}-${clip.id}`}
                              >
                                <Icon
                                  icon={Icons.more}
                                  size={14}
                                  color={colors.mcBlack}
                                />
                              </Pressable>
                            )}
                          </View>
                        );

                        return trackIndex === 0 && sectionIndex === 0 ? (
                          <WithHint key={sec.id} hintID={HintIDs.firstClipView}>
                            {cell}
                          </WithHint>
                        ) : (
                          <Fragment key={sec.id}>{cell}</Fragment>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        )}
        {currentTab === 'mixer' && <MixerView />}
        {currentTab === 'settings' && (
          <SongSettings
            onExportAudio={() => setExportVisible(true)}
            onExportBundle={onExportBundle}
            onShareBeat={onShareBeat}
          />
        )}
      </View>

      {showTab && <SongMixerTabBar />}

      <Modal
        visible={menuTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuTarget(null)}
      >
        <View style={s.menuLayer}>
          <Pressable
            style={s.menuBackdrop}
            onPress={() => setMenuTarget(null)}
            accessible={false}
            testID="close-song-context-menu"
          />
          <View
            style={s.menuCard}
            accessibilityViewIsModal
            testID="song-context-menu"
          >
            {menuTarget?.kind === 'track' &&
              (tracks.length > 1 ? (
                <Pressable
                  style={s.menuAction}
                  onPress={() =>
                    setMenuTarget({
                      kind: 'confirmTrackDelete',
                      trackId: menuTarget.trackId,
                      title: menuTarget.title,
                    })
                  }
                  accessibilityLabel="Delete track"
                  accessibilityRole="button"
                  testID="delete-track-action"
                >
                  <Text variant="label" color={colors.mcPink}>
                    Delete Track
                  </Text>
                </Pressable>
              ) : (
                <Text variant="label" color={colors.mcWhite}>
                  Cannot delete last track
                </Text>
              ))}
            {menuTarget?.kind === 'confirmTrackDelete' && (
              <>
                <Text variant="label" color={colors.mcWhite}>
                  Delete “{menuTarget.title}” and all its clips?
                </Text>
                <Pressable
                  style={s.menuAction}
                  onPress={() => {
                    removeTrack(menuTarget.trackId);
                    setMenuTarget(null);
                  }}
                  accessibilityLabel="Confirm delete track"
                  accessibilityRole="button"
                  testID="confirm-delete-track"
                >
                  <Text variant="label" color={colors.mcPink}>
                    Delete
                  </Text>
                </Pressable>
              </>
            )}
            {menuTarget?.kind === 'clip' && (
              <>
                <Pressable
                  style={s.menuAction}
                  onPress={() => {
                    openClipEditor(menuTarget.trackId, menuTarget.clipId);
                    setMenuTarget(null);
                  }}
                  accessibilityLabel="Edit clip"
                  accessibilityRole="button"
                  testID="edit-clip-action"
                >
                  <Text variant="label" color={colors.mcWhite}>
                    Edit Clip
                  </Text>
                </Pressable>
                <Pressable
                  style={s.menuAction}
                  onPress={() => {
                    duplicateClip(menuTarget.trackId, menuTarget.clipId);
                    setMenuTarget(null);
                  }}
                  accessibilityLabel="Duplicate clip"
                  accessibilityRole="button"
                  testID="duplicate-clip-action"
                >
                  <Text variant="label" color={colors.mcWhite}>
                    Duplicate
                  </Text>
                </Pressable>
                <Pressable
                  style={s.menuAction}
                  onPress={() => {
                    removeClip(menuTarget.trackId, menuTarget.clipId);
                    setMenuTarget(null);
                  }}
                  accessibilityLabel="Delete clip"
                  accessibilityRole="button"
                  testID="delete-clip-action"
                >
                  <Text variant="label" color={colors.mcPink}>
                    Delete
                  </Text>
                </Pressable>
              </>
            )}
            {menuTarget?.kind === 'section' && (
              <>
                <Pressable
                  style={s.menuAction}
                  onPress={() => {
                    setSectionName(menuTarget.name);
                    setMenuTarget({
                      kind: 'renameSection',
                      sectionId: menuTarget.sectionId,
                    });
                  }}
                  accessibilityLabel="Rename section"
                  accessibilityRole="button"
                  testID="rename-section-action"
                >
                  <Text variant="label" color={colors.mcWhite}>
                    Edit Title
                  </Text>
                </Pressable>
                <Pressable
                  style={s.menuAction}
                  onPress={() => {
                    duplicateSection(menuTarget.sectionId);
                    setMenuTarget(null);
                  }}
                  accessibilityLabel="Duplicate section"
                  accessibilityRole="button"
                  testID="duplicate-section-action"
                >
                  <Text variant="label" color={colors.mcWhite}>
                    Duplicate
                  </Text>
                </Pressable>
                {sections.length > 1 && (
                  <Pressable
                    style={s.menuAction}
                    onPress={() => {
                      removeSection(menuTarget.sectionId);
                      setMenuTarget(null);
                    }}
                    accessibilityLabel="Delete section"
                    accessibilityRole="button"
                    testID="delete-section-action"
                  >
                    <Text variant="label" color={colors.mcPink}>
                      Delete
                    </Text>
                  </Pressable>
                )}
              </>
            )}
            {menuTarget?.kind === 'renameSection' && (
              <>
                <TextInput
                  value={sectionName}
                  onChangeText={setSectionName}
                  placeholder="Section name"
                  accessibilityLabel="Section name"
                  testID="section-name-input"
                  style={s.menuInput}
                  autoFocus
                  selectTextOnFocus
                />
                <Pressable
                  style={s.menuAction}
                  onPress={() => {
                    if (sectionName.trim())
                      renameSection(menuTarget.sectionId, sectionName.trim());
                    setMenuTarget(null);
                  }}
                  accessibilityLabel="Save section name"
                  accessibilityRole="button"
                  testID="save-section-name"
                >
                  <Text variant="label" color={colors.mcWhite}>
                    Save
                  </Text>
                </Pressable>
              </>
            )}
            <Pressable
              style={s.menuAction}
              onPress={() => setMenuTarget(null)}
              accessibilityLabel={
                menuTarget?.kind === 'confirmTrackDelete' ||
                menuTarget?.kind === 'renameSection'
                  ? 'Cancel'
                  : 'Close menu'
              }
              accessibilityRole="button"
              testID="close-song-menu-action"
            >
              <Text variant="label" color={colors.mcWhite3}>
                {menuTarget?.kind === 'confirmTrackDelete' ||
                menuTarget?.kind === 'renameSection'
                  ? 'Cancel'
                  : 'Close'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ExportAudioView
        visible={exportVisible}
        onClose={() => setExportVisible(false)}
        onExport={() => onExportAudio?.()}
        playgroundName={playgroundName}
        artistName={artistName}
        coverImageUrl={coverImageUrl}
      />
    </View>
  );
});

const s = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
  grid: { flex: 1, flexDirection: 'row' },
  labelsCol: {
    width: CELL_W,
    gap: GAP,
    marginRight: GAP,
  },
  clipsScroll: { flex: 1 },
  label: {
    width: CELL_W,
    height: CELL_H,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  labelsSpacer: { height: SECTION_H },
  labelTxt: { fontSize: 10, fontWeight: '500' as const },
  sections: {
    flexDirection: 'row',
    gap: GAP,
    marginBottom: GAP,
  },
  secTabContainer: {
    width: CELL_W,
    height: SECTION_H,
    position: 'relative',
  },
  secTab: {
    width: CELL_W,
    height: SECTION_H,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 4,
  },
  addSecBtn: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  clipRows: { gap: GAP },
  clipRow: {
    flexDirection: 'row',
    gap: GAP,
    height: CELL_H,
  },
  cell: {
    width: CELL_W,
    height: CELL_H,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  emptyCell: {
    width: CELL_W,
    height: CELL_H,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    borderWidth: 1,
  },
  cellContent: { flex: 1, width: '100%', position: 'relative' },
  clipCellContainer: {
    width: CELL_W,
    height: CELL_H,
    position: 'relative',
  },
  itemMenuButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  menuLayer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  menuCard: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    padding: 20,
    borderRadius: 6,
    backgroundColor: '#1A1C20',
    gap: 8,
  },
  menuAction: { paddingVertical: 12 },
  menuInput: {
    color: '#F7F7F7',
    borderWidth: 1,
    borderColor: 'rgba(247,247,247,0.3)',
    borderRadius: 6,
    padding: 12,
  },
  addTrack: {
    width: CELL_W,
    height: CELL_H,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
});

export default SongView;
