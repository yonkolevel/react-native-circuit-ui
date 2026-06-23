/* eslint-disable no-undef */
/**
 * Jest setup file for react-native-circuit-ui
 *
 * Provides mocks for native modules that aren't available in the test environment:
 * - react-native-svg: SVG components used by CircularProgress and GradientCover
 * - lucide-react-native: Icon components used by CircuitCard, Modal, and ToolbarButton
 */

// ---------------------------------------------------------------------------
// Mock: react-native-svg
// ---------------------------------------------------------------------------
// Maps each SVG element to a simple React Native View-like component
// so that renders don't crash and snapshots remain readable.
jest.mock('react-native-svg', () => {
  const mockReact = require('react');
  const { View } = require('react-native');

  const createSvgComponent = (name) => {
    const Component = mockReact.forwardRef((props, ref) =>
      mockReact.createElement(View, {
        ...props,
        ref,
        testID: props.testID || name,
      })
    );
    Component.displayName = name;
    return Component;
  };

  const Svg = createSvgComponent('Svg');

  return {
    __esModule: true,
    default: Svg,
    Svg,
    Circle: createSvgComponent('Circle'),
    Rect: createSvgComponent('Rect'),
    Path: createSvgComponent('Path'),
    G: createSvgComponent('G'),
    Text: createSvgComponent('SvgText'),
    TSpan: createSvgComponent('TSpan'),
    TextPath: createSvgComponent('TextPath'),
    Use: createSvgComponent('Use'),
    Image: createSvgComponent('SvgImage'),
    Symbol: createSvgComponent('SvgSymbol'),
    Defs: createSvgComponent('Defs'),
    LinearGradient: createSvgComponent('LinearGradient'),
    RadialGradient: createSvgComponent('RadialGradient'),
    Stop: createSvgComponent('Stop'),
    ClipPath: createSvgComponent('ClipPath'),
    Pattern: createSvgComponent('Pattern'),
    Mask: createSvgComponent('Mask'),
    Line: createSvgComponent('Line'),
    Polyline: createSvgComponent('Polyline'),
    Polygon: createSvgComponent('Polygon'),
    Ellipse: createSvgComponent('Ellipse'),
    ForeignObject: createSvgComponent('ForeignObject'),
    SvgXml: createSvgComponent('SvgXml'),
    SvgUri: createSvgComponent('SvgUri'),
    SvgCss: createSvgComponent('SvgCss'),
    SvgCssUri: createSvgComponent('SvgCssUri'),
  };
});

// ---------------------------------------------------------------------------
// Mock: react-native-worklets
// ---------------------------------------------------------------------------
// Keep PianoRoll tests on the JS thread in Jest. The real package ships ESM
// that Jest does not transform by default.
jest.mock('react-native-worklets', () => ({
  __esModule: true,
  scheduleOnRN: (fn) => fn,
}));

// ---------------------------------------------------------------------------
// Mock: react-native-reanimated
// ---------------------------------------------------------------------------
// Manual mock for react-native-reanimated v3+ providing the most common APIs
// so that components using animations can be rendered in tests without crashing.
jest.mock('react-native-reanimated', () => {
  const mockSharedValue = (init) => ({ value: init });
  const mockAnimation = (toValue) => toValue;

  return {
    __esModule: true,
    default: {
      createAnimatedComponent: (Component) => Component,
      View: require('react-native').View,
      Text: require('react-native').Text,
      Image: require('react-native').Image,
      ScrollView: require('react-native').ScrollView,
      FlatList: require('react-native').FlatList,
      addWhitelistedNativeProps: () => {},
      addWhitelistedUIProps: () => {},
    },
    useSharedValue: mockSharedValue,
    useDerivedValue: (fn) => ({ value: fn() }),
    useAnimatedStyle: (fn) => fn(),
    useAnimatedProps: (fn) => fn(),
    useAnimatedScrollHandler: () => {},
    useAnimatedRef: () => ({ current: null }),
    useAnimatedGestureHandler: () => {},
    withTiming: mockAnimation,
    withSpring: mockAnimation,
    withDecay: mockAnimation,
    withDelay: (_delay, anim) => anim,
    withSequence: (...anims) => anims[anims.length - 1],
    withRepeat: (anim) => anim,
    cancelAnimation: () => {},
    Easing: {
      linear: (t) => t,
      ease: (t) => t,
      bezier: () => (t) => t,
      in: (fn) => fn,
      out: (fn) => fn,
      inOut: (fn) => fn,
    },
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
    interpolate: (value, input, output) => {
      const i = input.findIndex((v) => v >= value);
      if (i <= 0) return output[0];
      if (i >= output.length) return output[output.length - 1];
      const ratio = (value - input[i - 1]) / (input[i] - input[i - 1]);
      return output[i - 1] + ratio * (output[i] - output[i - 1]);
    },
    Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    FadeIn: { duration: () => ({ delay: () => ({}) }) },
    FadeOut: { duration: () => ({ delay: () => ({}) }) },
    SlideInRight: { duration: () => ({}) },
    SlideOutLeft: { duration: () => ({}) },
    Layout: { duration: () => ({}) },
    createAnimatedComponent: (Component) => Component,
    enableLayoutAnimations: () => {},
  };
});

// ---------------------------------------------------------------------------
// Mock: MultiTouchOverlay (native iOS multi-touch component)
// ---------------------------------------------------------------------------
// The real module calls requireNativeComponent('RCTMultiTouchOverlay') at
// import time on iOS. Since Jest defaults Platform.OS to 'ios', that native
// registration doesn't exist and would throw. We replace the entire module
// with a plain View wrapper so DrumPadsView / PianoKeyboard can render in
// tests without crashing.
jest.mock('./src/components/MultiTouchOverlay/MultiTouchOverlay', () => {
  const mockReact = require('react');
  const { View } = require('react-native');

  const MockOverlay = mockReact.forwardRef((props, ref) =>
    mockReact.createElement(View, {
      ...props,
      ref,
      testID: props.testID || 'MultiTouchOverlay',
    })
  );
  MockOverlay.displayName = 'MultiTouchOverlay';

  return {
    __esModule: true,
    MultiTouchOverlay: mockReact.memo(MockOverlay),
  };
});

// ---------------------------------------------------------------------------
// Mock: lucide-react-native
// ---------------------------------------------------------------------------
// Each icon is mocked as a simple View with a testID matching the icon name.
// Icons used: Heart, Check (CircuitCard), X (Modal), ChevronLeft, PanelLeft (ToolbarButton)
jest.mock('lucide-react-native', () => {
  const mockReact = require('react');
  const { View } = require('react-native');

  const createIconMock = (name) => {
    const Icon = mockReact.forwardRef((props, ref) =>
      mockReact.createElement(View, {
        ...props,
        ref,
        testID: props.testID || `lucide-${name}`,
      })
    );
    Icon.displayName = name;
    return Icon;
  };

  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (typeof prop === 'string' && prop !== '__esModule') {
          return createIconMock(prop);
        }
        return undefined;
      },
    }
  );
});

// ---------------------------------------------------------------------------
// Mock: @shopify/react-native-skia
// ---------------------------------------------------------------------------
// Skia requires a native module that doesn't exist in Jest.
// Mock Canvas, drawing primitives, and the Skia API so components render as Views.
jest.mock('@shopify/react-native-skia', () => {
  const mockReact = require('react');
  const { View } = require('react-native');

  const createSkiaComponent = (name) => {
    const Component = mockReact.forwardRef((props, ref) =>
      mockReact.createElement(View, {
        ...props,
        ref,
        testID: props.testID || name,
      })
    );
    Component.displayName = name;
    return Component;
  };

  const createPath = () => {
    const path = {
      moveTo: () => path,
      lineTo: () => path,
      close: () => path,
      cubicTo: () => path,
      quadTo: () => path,
      arcTo: () => path,
      addRect: () => path,
      addOval: () => path,
      addCircle: () => path,
      addRRect: () => path,
      detach: () => path,
    };
    return path;
  };

  return {
    __esModule: true,
    Canvas: createSkiaComponent('Canvas'),
    Group: createSkiaComponent('Group'),
    Path: createSkiaComponent('SkiaPath'),
    Rect: createSkiaComponent('SkiaRect'),
    Line: createSkiaComponent('SkiaLine'),
    Circle: createSkiaComponent('SkiaCircle'),
    Oval: createSkiaComponent('SkiaOval'),
    Text: createSkiaComponent('SkiaText'),
    TextPath: createSkiaComponent('SkiaTextPath'),
    Image: createSkiaComponent('SkiaImage'),
    Paint: createSkiaComponent('Paint'),
    Blur: createSkiaComponent('Blur'),
    Shadow: createSkiaComponent('Shadow'),
    Mask: createSkiaComponent('SkiaMask'),
    RoundedRect: createSkiaComponent('RoundedRect'),
    Opacity: createSkiaComponent('Opacity'),
    ClipPath: createSkiaComponent('SkiaClipPath'),
    LinearGradient: createSkiaComponent('SkiaLinearGradient'),
    RadialGradient: createSkiaComponent('SkiaRadialGradient'),
    SweepGradient: createSkiaComponent('SkiaSweepGradient'),
    Turbulence: createSkiaComponent('Turbulence'),
    Vertices: createSkiaComponent('Vertices'),
    Points: createSkiaComponent('Points'),
    Patch: createSkiaComponent('Patch'),
    useFont: () => null,
    vec: (x, y) => ({ x, y }),
    useFonts: () => [null],
    useImage: () => null,
    Skia: {
      Path: {
        Make: createPath,
      },
      PathBuilder: {
        Make: createPath,
      },
      Paint: () => ({}),
      Matrix: () => [],
    },
    useSharedValue: (init) => ({ value: init }),
    matchFont: () => ({}),
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const { ScrollView, View } = require('react-native');
  // Chainable gesture mock — every method returns `this`
  const chainable = () => {
    const g = new Proxy({}, { get: () => () => g });
    return g;
  };
  return {
    ScrollView,
    GestureHandlerRootView: View,
    GestureDetector: ({ children }) => children,
    Gesture: {
      Pan: chainable,
      Pinch: chainable,
      Tap: chainable,
      LongPress: chainable,
      Simultaneous: (...args) => args[0] || chainable(),
      Exclusive: (...args) => args[0] || chainable(),
      Race: (...args) => args[0] || chainable(),
    },
    PanGestureHandler: View,
    TapGestureHandler: View,
    State: {},
    Directions: {},
  };
});
