/**
 * ExportAudioView tests — the export guard mirrors iOS:
 * empty playgrounds can open the view but the Export button is disabled;
 * a clip with MIDI notes or an audio-file reference enables it.
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { create } from 'zustand';
import { ThemeProvider } from '../../../../../theme';
import { ExportAudioView } from '../ExportAudioView';
import { SongStoreProvider } from '../../../stores/playgroundStore';
import type { SongStore } from '../../../stores/playgroundStore';
import {
  createMockClip,
  createMockNote,
  createMockSong,
  createMockTrack,
  resetMockIds,
} from '../../../mocks';

function createTestStore(
  overrides: Partial<ReturnType<typeof createMockSong>> = {}
) {
  const song = createMockSong(overrides);
  // ExportAudioView only reads state (id, tracks); actions are unused here.
  return create<SongStore>()(() => ({ ...song }) as unknown as SongStore);
}

function renderView(
  ui: React.ReactElement,
  store: ReturnType<typeof createTestStore>
) {
  return render(
    <ThemeProvider initialMode="dark">
      <SongStoreProvider store={store as any}>{ui}</SongStoreProvider>
    </ThemeProvider>
  );
}

beforeEach(() => resetMockIds());

describe('ExportAudioView', () => {
  it('opens for an empty playground with disabled export + "Nothing to export"', () => {
    const onExport = jest.fn();
    const emptyTrack = createMockTrack({
      id: 1,
      clips: [createMockClip({ notes: [] })],
    });
    const store = createTestStore({ tracks: [emptyTrack] } as any);

    const { getByLabelText, queryByText } = renderView(
      <ExportAudioView visible onClose={jest.fn()} onExport={onExport} />,
      store
    );

    expect(queryByText('Nothing to export')).toBeTruthy();

    const exportButton = getByLabelText('Export Audio');
    expect(exportButton.props.accessibilityState).toMatchObject({
      disabled: true,
    });

    fireEvent.press(exportButton);
    expect(onExport).not.toHaveBeenCalled();
  });

  it('enables export when a clip has MIDI notes', async () => {
    const onExport = jest.fn();
    const track = createMockTrack({
      id: 1,
      clips: [createMockClip({ notes: [createMockNote()] })],
    });
    const store = createTestStore({ tracks: [track] } as any);

    const { getByLabelText, queryByText } = renderView(
      <ExportAudioView visible onClose={jest.fn()} onExport={onExport} />,
      store
    );

    expect(queryByText('Ready to export')).toBeTruthy();

    const exportButton = getByLabelText('Export Audio');
    expect(exportButton.props.accessibilityState).toMatchObject({
      disabled: false,
    });

    fireEvent.press(exportButton);
    await waitFor(() => expect(onExport).toHaveBeenCalledTimes(1));
  });

  it('enables export when an audio clip has a file reference', async () => {
    const onExport = jest.fn();
    const audioTrack = createMockTrack({
      id: 1,
      type: 'audio',
      clips: [
        createMockClip({ notes: [], audioFileReference: 'recordings/take-1.wav' }),
      ],
    });
    const store = createTestStore({ tracks: [audioTrack] } as any);

    const { getByLabelText } = renderView(
      <ExportAudioView visible onClose={jest.fn()} onExport={onExport} />,
      store
    );

    const exportButton = getByLabelText('Export Audio');
    expect(exportButton.props.accessibilityState).toMatchObject({
      disabled: false,
    });

    fireEvent.press(exportButton);
    await waitFor(() => expect(onExport).toHaveBeenCalledTimes(1));
  });

  it('treats a whitespace-only audio reference as not exportable', () => {
    const onExport = jest.fn();
    const audioTrack = createMockTrack({
      id: 1,
      type: 'audio',
      clips: [createMockClip({ notes: [], audioFileReference: '   ' })],
    });
    const store = createTestStore({ tracks: [audioTrack] } as any);

    const { getByLabelText } = renderView(
      <ExportAudioView visible onClose={jest.fn()} onExport={onExport} />,
      store
    );

    const exportButton = getByLabelText('Export Audio');
    expect(exportButton.props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it('calls onClose from the close button', () => {
    const onClose = jest.fn();
    const store = createTestStore();

    const { getByLabelText } = renderView(
      <ExportAudioView visible onClose={onClose} onExport={jest.fn()} />,
      store
    );

    fireEvent.press(getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
