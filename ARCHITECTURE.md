# Feature-Driven Architecture

## Principle

**UI components are pure presentation. State lives in the app. The boundary is props.**

```
┌─────────────────────────────────────────────────────┐
│  midicircuit-rn (THE APP)                           │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Zustand      │  │ Audio Engine │  │ Navigation │ │
│  │ Stores       │  │ (Elementary) │  │ (React Nav)│ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬─────┘ │
│         │                 │                 │       │
│         ▼                 ▼                 ▼       │
│  ┌─────────────────────────────────────────────────┐│
│  │  Connected Screens (features/*/screens/)        ││
│  │  - Read from stores                             ││
│  │  - Pass state as props to UI                    ││
│  │  - Pass store actions as callbacks              ││
│  └──────────────────┬──────────────────────────────┘│
│                     │ props + callbacks              │
│                     ▼                               │
│  ┌─────────────────────────────────────────────────┐│
│  │  react-native-circuit-ui (UI LIBRARY)           ││
│  │  - Pure presentation components                 ││
│  │  - No store imports                             ││
│  │  - No audio imports                             ││
│  │  - No navigation imports                        ││
│  │  - Data in via props, actions out via callbacks  ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

## The Rules

### 1. UI Library (`react-native-circuit-ui`)

This package exports ONLY:
- **Components** — pure React components that accept props
- **Types** — TypeScript interfaces for all data shapes
- **Theme** — design tokens (colors, typography, spacing)
- **Mocks** — factory functions for test/preview data

It does NOT contain:
- ❌ Zustand stores (those live in the app)
- ❌ Navigation (that lives in the app)
- ❌ Audio engine hooks (that lives in the app)
- ❌ API calls (that lives in the app)
- ❌ Persistence (that lives in the app)

### 2. App (`midicircuit-rn`)

The app owns:
- **Stores** — Zustand stores are the single source of truth
- **Screens** — connected components that wire store → UI
- **Navigation** — React Navigation / Expo Router
- **Services** — audio, MIDI, API, persistence
- **Native modules** — platform-specific implementations

### 3. Feature Structure (in both repos)

```
feature-name/
  components/          # Pure UI (in circuit-ui)
    ComponentName/
      ComponentName.tsx
      index.ts
      __tests__/
  types/               # Shared interfaces (in circuit-ui)
  screens/             # Connected screens (in midicircuit-rn)
  stores/              # Zustand stores (in midicircuit-rn)  
  hooks/               # Feature hooks (in midicircuit-rn)
  services/            # Business logic (in midicircuit-rn)
```

### 4. Type Alignment

The circuit-ui types MUST match midicircuit-rn store types.

**Source of truth**: `midicircuit-rn/src/stores/songStore.ts` types
**UI mirror**: `react-native-circuit-ui/src/features/playground/types/index.ts`

When migrating, the circuit-ui types should be replaced by imports
from the app's store types (or a shared `@midicircuit/types` package).

### 5. Migration Path

**Phase 1 (current)**: Circuit-UI is standalone with its own types + mock stores.
Develop and test UI in isolation.

**Phase 2**: Install circuit-ui as local dependency in midicircuit-rn.
Create connected screens that map `songStore` → circuit-ui component props.

**Phase 3**: Move connected screens into midicircuit-rn's feature folders.
Circuit-ui becomes a pure component library.

**Phase 4**: Extract shared types to `@midicircuit/types` package.
Both repos import from the same type definitions.

## Component Contract

Every circuit-ui component follows this contract:

```typescript
interface ComponentProps {
  // DATA IN — all the state needed to render
  data: SomeDataType;
  
  // ACTIONS OUT — callbacks for user interactions  
  onSomethingHappened?: (payload: SomePayload) => void;
  
  // STYLING — optional overrides
  style?: StyleProp<ViewStyle>;
}
```

The component NEVER:
- Fetches its own data
- Manages global state
- Navigates to other screens
- Plays audio
- Calls APIs

## Integration Example

```typescript
// In midicircuit-rn/src/features/playground/screens/PlaygroundScreen.tsx

import { SongView } from 'react-native-circuit-ui';  // Pure UI
import { useSongStore } from '../stores/songStore';   // App state
import { useAudioEngine } from '../../audio';         // Audio service

export function PlaygroundScreen() {
  const store = useSongStore();
  const { core } = useAudioEngine();
  
  // Map store state → UI props
  const songState = {
    tracks: store.tracks,
    isPlaying: store.isPlaying,
    tempo: store.tempo,
    // ... map all fields
  };
  
  // Map store actions → UI callbacks  
  const callbacks = {
    onPlay: () => { store.setPlaying(true); /* audio starts via subscription */ },
    onTempoChange: store.setTempo,
    onTrackSelect: (id) => navigation.navigate('ClipEditor', { trackId: id }),
    // ...
  };
  
  return <SongView song={songState} callbacks={callbacks} />;
}
```

## Why This Architecture

1. **Testable** — UI components test with mock data, no store/audio setup needed
2. **Reusable** — circuit-ui works in any React Native app, not just Midicircuit
3. **Parallel development** — UI and audio/logic teams work independently
4. **Platform agnostic** — UI components work on iOS, Android, and potentially web
5. **Clean migration** — swap mock stores for real stores without touching components
