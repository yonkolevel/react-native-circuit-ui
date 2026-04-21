/**
 * Playground DAW Showcase — renders all feature components with mock data.
 */
import { SafeAreaView, ScrollView, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, Text, useTheme } from 'react-native-circuit-ui';
import { create } from 'zustand';

// Feature components (direct imports from source)
import {
  SongToolbar,
  SongMixerTabBar,
} from '../../src/features/playground/components/SongView';
import { TrackView } from '../../src/features/playground/components/TrackView';
import { MixerView } from '../../src/features/playground/components/Mixer';
import { DrumPadsView } from '../../src/features/playground/components/DrumPads';
import { PianoKeyboard } from '../../src/features/playground/components/PianoKeyboard';
import { SongSectionsView } from '../../src/features/playground/components/Sections';
import { SoundBankView } from '../../src/features/playground/components/SoundBank';
import { PlaygroundsDashboard } from '../../src/features/playground/components/PlaygroundsDashboard';
import { AddTrackMenu } from '../../src/features/playground/components/Toolbar';
import { OnboardingSheet } from '../../src/features/playground/components/Onboarding';
import { ClipEditorView } from '../../src/features/playground/components/ClipEditor';
import { BottomPanel } from '../../src/features/playground/components/BottomPanel';
import { SongStoreProvider } from '../../src/features/playground/stores/playgroundStore';
import type { SongStore } from '../../src/features/playground/stores/playgroundStore';

// Mock data
import {
  createMockSong,
  createMockPlaygroundsList,
  createMockDrumClip,
  createDrumSamples,
} from '../../src/features/playground/mocks';

// Create a mock store for showcase components that use useSongContext
const noop = () => {};
function createMockStore(song: ReturnType<typeof createMockSong>) {
  return create<SongStore>()(() => ({
    ...song,
    currentTab: 'song' as const,
    // Actions (no-ops for showcase)
    setPlaying: noop,
    setRecording: noop,
    setTempo: noop,
    toggleMetronome: noop,
    toggleLoop: noop,
    setCurrentSection: noop,
    addSection: noop,
    renameSection: noop,
    removeSection: noop,
    setTrackVolume: noop,
    setTrackPan: noop,
    toggleTrackMute: noop,
    toggleTrackSolo: noop,
    addNote: noop,
    removeNote: noop,
    updateNote: noop,
    setClipNotes: noop,
    createClip: noop,
    setClipLength: noop,
    addNewTrack: noop,
    removeTrack: noop,
    showSongView: noop,
    showAddTrackMenu: noop,
    showSoundBankPicker: noop,
    fetchSoundBanks: async () => {},
    selectSoundBank: noop,
    previewSoundBank: noop,
    stopPreview: noop,
    confirmSoundBank: noop,
    undoClipEdit: noop,
    redoClipEdit: noop,
    liveNoteOn: noop,
    liveNoteOff: noop,
    showClipSettings: noop,
    hideClipSettings: noop,
    togglePianoNoteNames: noop,
    openClipEditor: noop,
    setCurrentTab: noop,
    setMasterVolume: noop,
  }));
}

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.section,
        { backgroundColor: colors.mcBlack3, borderColor: colors.mcBlack4 },
      ]}
    >
      <Text variant="h5" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
};

function ShowcaseContent() {
  const { colors } = useTheme();
  const mockSong = createMockSong();
  const mockPlaygrounds = createMockPlaygroundsList(4);
  const drumTrack = mockSong.tracks[0]!;
  const drumClip = createMockDrumClip({
    trackID: drumTrack.id,
    sectionID: mockSong.currentSectionId,
  });
  const useMockStore = createMockStore(mockSong);

  return (
    <SongStoreProvider store={useMockStore as any}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.mcBlack2 }]}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text variant="h3" center style={styles.title}>
            🎹 DAW Showcase
          </Text>
          <Text
            variant="body"
            center
            color={colors.mcWhite3}
            style={styles.subtitle}
          >
            CorePlayground Feature Components
          </Text>

          <Section title="SongToolbar">
            <SongToolbar />
          </Section>

          <Section title="SongMixerTabBar">
            <SongMixerTabBar />
          </Section>

          <Section title="SongSections">
            <SongSectionsView
              sections={mockSong.sections}
              currentSectionId={mockSong.currentSectionId}
              onSelect={() => {}}
              onAdd={() => {}}
            />
          </Section>

          <Section title="TrackView">
            <TrackView
              track={drumTrack}
              onClipPress={() => {}}
              onTrackPress={() => {}}
            />
            <TrackView
              track={mockSong.tracks[1]!}
              onClipPress={() => {}}
              onTrackPress={() => {}}
            />
          </Section>

          <Section title="Mixer">
            <MixerView />
          </Section>

          <Section title="DrumPads">
            <DrumPadsView
              samples={createDrumSamples()}
              onPadPress={() => {}}
              onPadRelease={() => {}}
            />
          </Section>

          <Section title="PianoKeyboard (Teenage Engineering style)">
            <PianoKeyboard
              numberOfOctaves={2}
              showNoteNames={true}
              onNoteOn={() => {}}
              onNoteOff={() => {}}
            />
          </Section>

          <Section title="ClipEditor (Piano Roll)">
            <View style={{ height: 500 }}>
              <ClipEditorView
                clip={drumClip}
                instrumentType="drum"
                samples={createDrumSamples()}
                callbacks={{}}
              />
            </View>
          </Section>

          <Section title="BottomPanel">
            <BottomPanel isExpanded={true} onToggle={() => {}}>
              <Text
                variant="body"
                color={colors.mcWhite3}
                style={{ padding: 16 }}
              >
                Panel content goes here
              </Text>
            </BottomPanel>
          </Section>

          <Section title="SoundBank">
            <SoundBankView
              soundBanks={mockSong.tracks.map((t) => t.soundBank)}
              categoryFilter="drum"
              onSelect={() => {}}
            />
          </Section>

          <Section title="AddTrackMenu">
            <AddTrackMenu onSelect={() => {}} onClose={() => {}} />
          </Section>

          <Section title="OnboardingSheet">
            <OnboardingSheet
              title="Welcome!"
              body="Let's create your first beat."
              buttonTitle="Got it"
              onDismiss={() => {}}
            />
          </Section>

          <Section title="PlaygroundsDashboard">
            <PlaygroundsDashboard
              playgrounds={mockPlaygrounds}
              onSelect={() => {}}
              onCreate={() => {}}
            />
          </Section>

          <View style={styles.footer} />
        </ScrollView>
      </SafeAreaView>
    </SongStoreProvider>
  );
}

export default function PlaygroundShowcase() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider initialMode="dark">
        <ShowcaseContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  title: { marginTop: 16, marginBottom: 4 },
  subtitle: { marginBottom: 24 },
  section: { marginBottom: 16, borderRadius: 8, padding: 12, borderWidth: 1 },
  sectionTitle: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(247,247,247,0.1)',
    paddingBottom: 8,
  },
  footer: { height: 40 },
});
