import type { ReactElement } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../theme';
import { DrumPadsView } from '../../components/DrumPads/DrumPadsView';
import { PianoKeyboard } from '../../components/PianoKeyboard/PianoKeyboard';
import { SongSectionsView } from '../../components/Sections/SongSectionsView';
import { SoundBankView } from '../../components/SoundBank/SoundBankView';
import { AddTrackMenu } from '../../components/Toolbar/AddTrackMenu';
import { TrackView } from '../../components/TrackView/TrackView';
import { createDrumSamples, createMockTrack } from '../../mocks';
import { EditorPolicyProvider } from '../editorPolicy';

const renderReadOnly = (ui: ReactElement) =>
  render(
    <ThemeProvider initialMode="dark">
      <EditorPolicyProvider policy={{ readOnly: true }}>
        {ui}
      </EditorPolicyProvider>
    </ThemeProvider>
  );

describe('contextual EditorPolicy leaf enforcement', () => {
  it('blocks direct track, section, and sound callbacks despite permissive props', () => {
    const onAddTrack = jest.fn();
    const onSectionSelect = jest.fn();
    const onSectionAdd = jest.fn();
    const onSoundSelect = jest.fn();
    const onSoundPreview = jest.fn();
    const permissive = {
      readOnly: false,
      capabilities: {
        tracks: true,
        sections: true,
        arrangement: true,
        sound: true,
      },
    } as const;

    const addTrack = renderReadOnly(
      <AddTrackMenu onSelect={onAddTrack} editorPolicy={permissive} />
    );
    fireEvent.press(addTrack.getByLabelText('Add Drum Track'));

    const sections = renderReadOnly(
      <SongSectionsView
        sections={[{ id: 1, name: 'Verse' }]}
        currentSectionId={1}
        onSelect={onSectionSelect}
        onAdd={onSectionAdd}
        editorPolicy={permissive}
      />
    );
    fireEvent.press(sections.getByLabelText('Verse'));
    fireEvent.press(sections.getByLabelText('Add section'));

    const sound = renderReadOnly(
      <SoundBankView
        soundBanks={[{ slug: 'kit', name: 'Kit' }]}
        onSelect={onSoundSelect}
        onPreview={onSoundPreview}
        editorPolicy={permissive}
      />
    );
    fireEvent.press(sound.getByLabelText('Kit'));
    fireEvent.press(sound.getByLabelText('Preview sound'));

    expect(onAddTrack).not.toHaveBeenCalled();
    expect(onSectionSelect).not.toHaveBeenCalled();
    expect(onSectionAdd).not.toHaveBeenCalled();
    expect(onSoundSelect).not.toHaveBeenCalled();
    expect(onSoundPreview).not.toHaveBeenCalled();
  });

  it('marks direct mixer-selection and live-input leaves disabled from context', () => {
    const trackPress = jest.fn();
    const permissive = {
      readOnly: false,
      capabilities: { arrangement: true, liveRecording: true },
    } as const;
    const track = renderReadOnly(
      <TrackView
        track={createMockTrack({ id: 1, title: 'Drums' })}
        onTrackPress={trackPress}
        editorPolicy={permissive}
      />
    );
    fireEvent.press(track.getByLabelText('Drums track'));

    const pads = renderReadOnly(
      <DrumPadsView samples={createDrumSamples()} editorPolicy={permissive} />
    );
    const piano = renderReadOnly(<PianoKeyboard editorPolicy={permissive} />);

    expect(trackPress).not.toHaveBeenCalled();
    expect(
      pads.getByLabelText('Drum pads').props.accessibilityState.disabled
    ).toBe(true);
    expect(
      piano.getByLabelText('Piano keyboard').props.accessibilityState.disabled
    ).toBe(true);
  });
});
