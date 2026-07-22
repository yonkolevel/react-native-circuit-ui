# react-native-circuit-ui

A pixel-perfect React Native port of Midicircuit's SwiftUI design system.

## Reply style

Default to a terse, status-first reply modeled on an incident/update card:

```text
🔴 <outcome> — <one-line cause or state>
• ✅ Fix: <concrete action/result>
• 🟡 Findings: <secondary issue, only if useful>
• 👉 Next: <next action or decision>
```

- Lead with the outcome; do not narrate the investigation before it.
- Keep each bullet to one line and include only actionable facts.
- Use `✅`, `🟡`, `🔴`, and `👉` consistently for success, findings, blocker, and next step.
- Omit empty sections; target 1–4 bullets.
- Include changed files and tests/commands in bullets when relevant.
- Use a short before/after only for a meaningful improvement; never default to a long essay.

## Architecture

### Design Token Flow
```
SwiftUI Assets.xcassets → src/theme/colors.ts (exact hex values)
SwiftUI Typography.swift → src/theme/typography.ts (Barlow font, same sizes)
SwiftUI Spacing.swift    → src/theme/spacing.ts (4pt base unit, makeSpacing())
```

### Component Mapping
| SwiftUI (MidicircuitKit) | React Native (CircuitUI) | Status |
|---|---|---|
| McButton / ButtonPrimaryStyle / etc. | `<Button variant="primary">` | ✅ |
| Text + .h1() / .label() / .small() | `<Text variant="h1">` | ✅ |
| LevelIndicator / LevelIcon | `<LevelIndicator>` / `<LevelIcon>` | ✅ |
| ProgressBarView | `<ProgressBar>` | ✅ |
| CircularProgressView | `<CircularProgress>` | ✅ |
| CircuitCard / CardContent | `<CircuitCard>` | ✅ |
| LearningPathCard | `<LearningPathCard>` | ✅ |
| Banner | `<Banner>` | ✅ |
| Modal | `<Modal>` | ✅ |
| LabeledTextField | `<Input>` | ✅ |
| SegmentedProgressBarView | `<SegmentedProgressBar>` | ✅ |
| ToolbarButton | `<ToolbarButton>` | ✅ |
| StaticGradientCover | `<GradientCover>` | ✅ |
| Avatar (profile) | `<Avatar>` | ✅ |

### File Structure
```
src/
  theme/
    colors.ts          # Palette from Assets.xcassets + semantic tokens
    typography.ts      # Font scale matching Typography.swift
    spacing.ts         # 4pt grid + makeSpacing() + shadows + borderRadius
    ThemeContext.tsx    # ThemeProvider + useTheme hook
    index.ts
  components/
    Text/              # Themed text with variant prop
    Button/            # All SwiftUI button styles via variant + size
    Input/             # LabeledTextField port
    Avatar/            # Profile image with placeholder
    ProgressBar/       # Linear progress (ProgressBarView.swift)
    CircularProgress/  # Circular arc (CircularProgressView.swift)
    LevelIndicator/    # Difficulty dots + bars + text
    CircuitCard/       # Content card (CircuitCardView.swift)
    LearningPathCard/  # Learning path card
    Banner/            # Hero image with rounded bottom
    Modal/             # Modal dialog with header
    SegmentedProgressBar/ # Segmented bar
    ToolbarButton/     # Back / sidebar toggle
    GradientCover/     # Deterministic gradient via UUID (djb2 hash)
    index.ts
  index.tsx            # Public API
```

## Development

### Prerequisites
- Node.js 18+
- Yarn 3.6+
- Xcode 16+ (for iOS example)
- CocoaPods

### Setup
```bash
yarn install
cd example && npx expo prebuild --platform ios
```

### Running Example App
```bash
cd example
npx expo run:ios --device <SIMULATOR_UDID> --port 8083
```

### TypeScript Check
```bash
npx tsc --noEmit
```

### Build Library
```bash
yarn prepare  # runs react-native-builder-bob
```

### Custom Fonts (Barlow)
The library defaults to system fonts. To use the original Barlow font:
```ts
import { configureTypography } from 'react-native-circuit-ui';

// After loading fonts with expo-font or config plugin:
configureTypography({
  fontFamily: {
    regular: 'Barlow-Regular',
    semiBold: 'Barlow-SemiBold',
    bold: 'Barlow-Bold',
  },
});
```

## XcodeBuildMCP Defaults
```
workspacePath: example/ios/example.xcworkspace
scheme: example
simulatorName: circuitui-lab
bundleId: circuitui.example
```

## Design Token Accuracy
Color values are extracted directly from MidicircuitKit Assets.xcassets:
- `mcOrange` = `#FF5C24` (not `#FF5722`)
- `mcGreen` = `#00FF9E` (not `#00E676`)
- `mcPink` = `#FF245B` (not `#FF1744`)
- `mcBlack2` = `#1A1C20` (not `#212121`)
- `mcWhite` = `#F7F7F7` (not `#FFFFFF`)
- `mcWhite2-6` are opacity variants of `#F7F7F7`
