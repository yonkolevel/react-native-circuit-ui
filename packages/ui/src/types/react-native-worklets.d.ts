declare module 'react-native-worklets' {
  export function scheduleOnRN<Args extends unknown[]>(
    fn: (...args: Args) => void,
    ...args: Args
  ): void;
}
