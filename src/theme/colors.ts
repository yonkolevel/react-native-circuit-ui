const palette = {
  mcOrange1: '#FF5722',
  mcOrange2: '#FF7043',
  mcOrange3: '#FF8A65',
  mcOrange4: '#FFAB91',
  mcOrange5: '#FFCCBC',

  mcGreen1: '#00E676',
  mcGreen2: '#33EB91',
  mcGreen3: '#66EFAC',
  mcGreen4: '#99F4C6',
  mcGreen5: '#CCF9E1',

  mcPink1: '#FF1744',
  mcPink2: '#FF4D6A',
  mcPink3: '#FF8390',
  mcPink4: '#FFB9B7',
  mcPink5: '#FFDEDC',

  mcBlue1: '#2979FF',
  mcBlue2: '#5393FF',
  mcBlue3: '#7DADFF',
  mcBlue4: '#A6C8FF',
  mcBlue5: '#D0E3FF',

  mcPurple1: '#AA00FF',
  mcPurple2: '#BB33FF',
  mcPurple3: '#CC66FF',
  mcPurple4: '#DD99FF',
  mcPurple5: '#EECCFF',

  mcBlack1: '#000000',
  mcBlack2: '#212121',
  mcBlack3: '#424242',
  mcBlack4: '#616161',
  mcBlack5: '#9E9E9E',

  mcBlackOpacity1: 'rgba(0, 0, 0, 0.87)', // mcBlack 2
  mcBlackOpacity2: 'rgba(0, 0, 0, 0.6)', // mcBlack 3
  mcBlackOpacity3: 'rgba(0, 0, 0, 0.38)', // mcBlack 4
  mcBlackOpacity4: 'rgba(0, 0, 0, 0.12)', // mcBlack 5
  mcBlackOpacity5: 'rgba(0, 0, 0, 0.05)',

  mcWhite1: '#FFFFFF',
  mcWhite2: '#F5F5F5',
  mcWhite3: '#EEEEEE',
  mcWhite4: '#E0E0E0',
  mcWhite5: '#BDBDBD',
  mcWhite6: '#9E9E9E',

  // Window controls (macOS)
  close: '#FF5F56',
  minimize: '#FFBD2E',
  expand: '#28C941',
};

const colorAliases = {
  orange: palette.mcOrange1,
  orange2: palette.mcOrange2,
  orange3: palette.mcOrange3,
  orange4: palette.mcOrange4,
  orange5: palette.mcOrange5,

  green: palette.mcGreen1,
  green2: palette.mcGreen2,
  green3: palette.mcGreen3,
  green4: palette.mcGreen4,
  green5: palette.mcGreen5,

  pink: palette.mcPink1,
  pink2: palette.mcPink2,
  pink3: palette.mcPink3,
  pink4: palette.mcPink4,
  pink5: palette.mcPink5,

  blue: palette.mcBlue1,
  blue2: palette.mcBlue2,
  blue3: palette.mcBlue3,
  blue4: palette.mcBlue4,
  blue5: palette.mcBlue5,

  purple: palette.mcPurple1,
  purple2: palette.mcPurple2,
  purple3: palette.mcPurple3,
  purple4: palette.mcPurple4,
  purple5: palette.mcPurple5,

  black: palette.mcBlack1,
  black2: palette.mcBlack2,
  black3: palette.mcBlack3,
  black4: palette.mcBlack4,
  black5: palette.mcBlack5,

  white: palette.mcWhite1,
  white2: palette.mcWhite2,
  white3: palette.mcWhite3,
  white4: palette.mcWhite4,
  white5: palette.mcWhite5,
  white6: palette.mcWhite6,

  gray: palette.mcBlack5,
};

const lightTheme = {
  background: palette.mcWhite1,
  primaryText: palette.mcBlack1,
  secondaryText: palette.mcBlack2,
  tertiaryText: palette.mcBlack3,

  primary: palette.mcOrange1,
  secondary: palette.mcPink1,
  success: palette.mcGreen1,
  warning: palette.mcOrange1,
  error: palette.close,
  info: palette.mcBlue1,

  border: palette.mcWhite4,
  divider: palette.mcWhite5,
  card: palette.mcWhite2,
  disabled: palette.mcWhite6,

  // Window controls
  closeButton: palette.close,
  minimizeButton: palette.minimize,
  expandButton: palette.expand,

  ...palette,
  ...colorAliases,
};

const darkTheme = {
  background: palette.mcBlack2,
  primaryText: palette.mcWhite1,
  secondaryText: palette.mcWhite2,
  tertiaryText: palette.mcWhite3,

  primary: palette.mcOrange1,
  secondary: palette.mcPink1,
  success: palette.mcGreen1,
  warning: palette.mcOrange1,
  error: palette.close,
  info: palette.mcBlue1,

  border: palette.mcBlack4,
  divider: palette.mcBlack3,
  card: palette.mcBlack3,
  disabled: palette.mcBlack5,

  // Window controls
  closeButton: palette.close,
  minimizeButton: palette.minimize,
  expandButton: palette.expand,

  ...palette,
  ...colorAliases,
};

export const colors = {
  light: lightTheme,
  dark: darkTheme,
  palette,
};

/**
 * Utility function to convert hex to rgba
 */
export const hexToRgba = (hex: string, alpha: number = 1): string => {
  const hexValue = hex.replace('#', '');

  if (hexValue.length === 3) {
    const r = parseInt(hexValue.charAt(0) + hexValue.charAt(0), 16);
    const g = parseInt(hexValue.charAt(1) + hexValue.charAt(1), 16);
    const b = parseInt(hexValue.charAt(2) + hexValue.charAt(2), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const r = parseInt(hexValue.substring(0, 2), 16);
  const g = parseInt(hexValue.substring(2, 4), 16);
  const b = parseInt(hexValue.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
