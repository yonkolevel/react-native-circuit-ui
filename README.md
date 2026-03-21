# react-native-circuit-ui

A pixel-perfect React Native component library ported from Midicircuit's SwiftUI design system. Built for cross-platform consistency with architecture designed for future web reuse.

## Installation

```sh
npm install react-native-circuit-ui react-native-svg
# or
yarn add react-native-circuit-ui react-native-svg
```

### Peer Dependencies
- `react` >= 18
- `react-native` >= 0.70
- `react-native-svg` >= 13
- `lucide-react-native` (icons)

## Quick Start

```tsx
import { ThemeProvider, Button, Text, useTheme } from 'react-native-circuit-ui';

function App() {
  return (
    <ThemeProvider initialMode="dark">
      <MyScreen />
    </ThemeProvider>
  );
}

function MyScreen() {
  const { colors } = useTheme();
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Text variant="h4">Welcome to CircuitUI</Text>
      <Button label="Get Started" variant="primary" onPress={() => {}} />
    </View>
  );
}
```

## Components

### Atoms
| Component | Description |
|---|---|
| `<Text>` | Themed text with `variant` prop (h1–h5, body, label, small, quote) |
| `<Button>` | Primary, secondary, normal, outline, solid variants |
| `<Input>` | Text input with label, error, helper text |
| `<Avatar>` | Profile image with fallback placeholder |
| `<ProgressBar>` | Linear progress bar with animation |
| `<LevelIndicator>` | Difficulty level display (beginner/intermediate/advanced) |
| `<ToolbarButton>` | Back and sidebar toggle buttons |

### Molecules
| Component | Description |
|---|---|
| `<CircuitCard>` | Content card with image, title, progress, levels |
| `<LearningPathCard>` | Learning path display card |
| `<Banner>` | Full-width hero image |
| `<Modal>` | Modal dialog with header and close |
| `<SegmentedProgressBar>` | Multi-segment progress display |

### Compounds
| Component | Description |
|---|---|
| `<CircularProgress>` | Circular arc progress with percentage |
| `<GradientCover>` | Deterministic gradient from UUID |

## Theming

### Colors
Exact values from the original SwiftUI asset catalog:
```ts
import { palette, useTheme } from 'react-native-circuit-ui';

// Direct palette access
palette.mcOrange  // '#FF5C24'
palette.mcGreen   // '#00FF9E'
palette.mcBlue    // '#2496FF'

// Theme-aware colors
const { colors } = useTheme();
colors.background  // dark: '#1A1C20', light: '#F7F7F7'
colors.primaryText // dark: '#F7F7F7', light: '#000000'
```

### Typography
Matches SwiftUI Font.mc* scale. Configure custom Barlow fonts:
```ts
import { configureTypography } from 'react-native-circuit-ui';

configureTypography({
  fontFamily: {
    regular: 'Barlow-Regular',
    semiBold: 'Barlow-SemiBold',
    bold: 'Barlow-Bold',
  },
});
```

### Spacing
4pt base grid matching SwiftUI `makeSpacing()`:
```ts
import { spacing, makeSpacing } from 'react-native-circuit-ui';

makeSpacing(4)  // 16pt
spacing.md      // 12pt
spacing.lg      // 16pt
```

## Architecture

The library is designed with cross-platform reuse in mind:

- **Design tokens** are pure TypeScript objects — easily portable to CSS variables or Tailwind configs
- **Components** use standard React patterns (composition, context, memo) — no platform-specific logic in the API surface
- **Theme system** uses React Context — works identically on React Native and React DOM
- **No barrel exports** — tree-shakeable imports for optimal bundle size

## Contributing

See the [contributing guide](CONTRIBUTING.md).

## License

MIT
