import { act, render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme';
import { DrumPadsView } from '../features/playground/components/DrumPads/DrumPadsView.web';
import { PianoKeyboard } from '../features/playground/components/PianoKeyboard/PianoKeyboard.web';

type Listener = (event: any) => void;
let listeners: Record<string, Listener[]>;

beforeEach(() => {
  listeners = {};
  Object.assign(window, {
    addEventListener: (name: string, listener: Listener) => {
      (listeners[name] ??= []).push(listener);
    },
    removeEventListener: (name: string, listener: Listener) => {
      listeners[name] = (listeners[name] ?? []).filter(
        (item) => item !== listener
      );
    },
  });
  (global as any).document = {
    activeElement: null,
    hidden: false,
    addEventListener: (name: string, listener: Listener) => {
      (listeners[name] ??= []).push(listener);
    },
    removeEventListener: (name: string, listener: Listener) => {
      listeners[name] = (listeners[name] ?? []).filter(
        (item) => item !== listener
      );
    },
  };
});

const dispatch = (name: string, event: any = {}) =>
  act(() => listeners[name]?.forEach((listener) => listener(event)));

describe('web instrument QWERTY release', () => {
  it('releases a held drum pad once when the window blurs', () => {
    const onPadPress = jest.fn();
    const onPadRelease = jest.fn();
    const samples = Array.from({ length: 16 }, (_, noteNumber) => ({
      id: String(noteNumber),
      name: `Pad ${noteNumber}`,
      fileName: `pad-${noteNumber}.wav`,
      noteNumber,
    }));
    render(
      <ThemeProvider initialMode="dark">
        <DrumPadsView
          samples={samples}
          onPadPress={onPadPress}
          onPadRelease={onPadRelease}
        />
      </ThemeProvider>
    );

    dispatch('keydown', { key: 'a' });
    expect(onPadPress).toHaveBeenCalledWith(8);
    dispatch('blur');
    expect(onPadRelease).toHaveBeenCalledTimes(1);
    expect(onPadRelease).toHaveBeenCalledWith(8);

    dispatch('keyup', { key: 'a' });
    expect(onPadRelease).toHaveBeenCalledTimes(1);
  });

  it('releases a held piano key once when the window blurs', () => {
    const onNoteOn = jest.fn();
    const onNoteOff = jest.fn();
    render(<PianoKeyboard onNoteOn={onNoteOn} onNoteOff={onNoteOff} />);

    dispatch('keydown', { key: 'a' });
    expect(onNoteOn).toHaveBeenCalledWith(0);
    dispatch('blur');
    expect(onNoteOff).toHaveBeenCalledTimes(1);
    expect(onNoteOff).toHaveBeenCalledWith(0);

    dispatch('keyup', { key: 'a' });
    expect(onNoteOff).toHaveBeenCalledTimes(1);
  });
});
