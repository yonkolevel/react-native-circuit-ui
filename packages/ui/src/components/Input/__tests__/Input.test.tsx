import { TextInput } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme';
import { Input } from '../Input';

it('preserves the native text input accessibility role', () => {
  const { UNSAFE_getByType } = render(
    <ThemeProvider initialMode="dark">
      <Input label="Email" />
    </ThemeProvider>
  );

  expect(UNSAFE_getByType(TextInput).props.accessibilityRole).toBeUndefined();
});
