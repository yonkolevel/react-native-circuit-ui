# YON-159 — Circuit UI Boundary and Migration Plan

Status: implementation-ready research plan

Issue: [YON-159](https://linear.app/yonkolevel/issue/YON-159/sound-browser-ui-preset-picker-with-categories-favorites-and-preview)

Repository role: reusable React Native design-system/components; no sound-browser domain ownership
Companion implementation: `midicircuit-rn/docs/plans/2026-08-22-yon-159-sound-browser-plan.md`

This plan keeps YON-159’s app behavior in `midicircuit-rn` while removing the current browser boundary violation safely.

---

## 1. Outcome

For YON-159:

- no favorite, taxonomy, persistence, preview lifecycle, or new browser state is added here;
- generic `Text`, `Input`, icons, theme tokens, spacing, buttons, and modal primitives remain reusable;
- `SongView` exposes only the smallest optional callback needed for the app-owned **Change Sound** route;
- the RN app stops importing the legacy `AddTrackMenu` and `SoundBankView`;
- those exported legacy components are deprecated but not deleted until a later package-release audit proves all downstream consumers have migrated.

---

## 2. Verified current boundary problem

The RN app deep-imports:

- `packages/ui/src/features/playground/components/Toolbar/AddTrackMenu.tsx`;
- `packages/ui/src/features/playground/components/SoundBank/SoundBankView.tsx`.

Both are app-domain components:

- Add Track hard-codes Midicircuit’s Drum/Melodic/Bass/Audio taxonomy and navigation semantics.
- SoundBankView hard-codes `SoundBankRef`, engine category filtering, selection/confirmation, preview callbacks, and app copy.
- SoundBankView owns optimistic local `playingSlug`; it can display playing after RN rejects a user-kit preview, playback fails, or playback completes.
- Neither component has meaningful component coverage.
- `packages/ui/src/features/playground/stores/playgroundStore.tsx` and `types/index.ts` mirror RN app actions/types, forcing mocks and examples to track app behavior.
- `package.json` exports `./src/*`, allowing deep imports around the root design-system API.

Existing generic assets that RN should reuse:

- `components/Input/Input.tsx`;
- `components/Text`;
- `components/Button` where its API fits;
- `components/SFSymbol` speaker/search/favorite icons;
- theme colors, spacing, typography, and border radius;
- generic modal/surface components.

Do not extract a speculative `SoundRow`, `FavoriteButton`, category-chip framework, or browser shell. There is one consumer.

---

## 3. Settled integration seam

YON-159 concretely interprets “Sound Design workspace” as **Change Sound** from an existing track’s options, matching designer Option B’s change flow.

`SongView` currently owns the track options menu. Add one optional callback prop:

```ts
export interface SongViewProps {
  // existing props...
  onChangeTrackSound?: (trackId: number) => void;
}
```

When present and the target track is drum/melodic/bass, render **Change Sound** before Delete Track. On press:

1. close the Circuit UI menu;
2. call `onChangeTrackSound(trackId)`;
3. leave all browser routing, loading, selection, audio, and replacement semantics to RN.

Do not add this action to `SongActions` or the mirrored playground store. The callback is a navigation seam like existing app-supplied export/share callbacks and avoids expanding duplicated domain state.

Accessibility/test contract:

```text
label: Change sound
role: button
testID: change-track-sound-action
```

The action is absent for Audio tracks and when the callback is omitted, preserving existing consumers.

---

## 4. Safe migration sequence

### Slice 1 — Add the optional Change Sound callback

Files:

- `packages/ui/src/features/playground/components/SongView/SongView.tsx`
- `packages/ui/src/features/playground/components/SongView/__tests__/SongView.test.tsx`
- example usage only if needed to prove the callback

Tests:

- action is absent when callback omitted;
- action appears for drum/melodic/bass track options;
- action is absent for Audio;
- pressing closes the menu and calls once with stable track ID;
- Delete Track behavior is unchanged.

This slice may merge before RN because it is backward-compatible.

### Slice 2 — RN migrates browser UI to app ownership

This work occurs in `midicircuit-rn`, not here:

- create app-owned Add Track/Sound Browser components;
- switch `PlaygroundScreen.tsx` away from the two Circuit UI deep imports;
- pass `onChangeTrackSound` into `SongView`;
- add RN store/component/audio/persistence coverage.

Gate before continuing here:

```bash
rg "components/(Toolbar/AddTrackMenu|SoundBank/SoundBankView)|\bAddTrackMenu\b|\bSoundBankView\b" \
  /path/to/midicircuit-rn/src
```

There must be no RN imports/usages of the library components being deprecated.

### Slice 3 — Deprecate, do not delete, legacy browser exports

After RN no longer imports them:

- add a JSDoc deprecation notice to `AddTrackMenu` and `SoundBankView` stating that app-domain browser behavior belongs in the consuming app;
- point maintainers to the RN app-owned replacement without importing it;
- leave files, barrels, examples, mirrored actions/types, and package exports intact in YON-159.

This avoids a breaking package release based on an audit of only one downstream source tree.

### Later package cleanup — outside YON-159

A separate release-scoped cleanup may delete the deprecated components and now-dead mirrored contracts only after:

1. repository-wide references are zero;
2. GitHub/downstream consumer search is recorded;
3. changelog and semver policy are settled;
4. all supported consuming apps are on the app-owned browser.

Do not remove the whole playground store or tighten wildcard package exports as part of that cleanup without their own scope.

---

## 5. Files intentionally unchanged

Unless compilation proves otherwise, leave these alone:

- generic `Input`, `Text`, `Button`, `Icon`/`SFSymbol`, modal, theme, spacing, and layout primitives;
- deprecated `AddTrackMenu` / `SoundBankView` files and their exports until the later audit;
- `CircuitCard` favorite behavior (it is content-card-specific, not a generic favorite primitive);
- `package.json` `./src/*` wildcard export (boundary tightening needs a complete consumer migration and semver decision);
- mirrored picker store/types, unrelated playground contracts, and design-system color/icon APIs.

---

## 6. Validation

Use the repository-declared Yarn 3 toolchain and scripts:

```bash
yarn test:unit
yarn typecheck
yarn lint
yarn prepare
```

Cross-repo verification against the paired RN branch:

```bash
# In midicircuit-rn
npm test -- --runInBand
npm run lint
npx tsc --noEmit
```

Manual checks:

- track options still open via tap/long-press on iOS/Android and context menu on web;
- Change Sound appears only for supported instrument tracks;
- pressing it closes the old menu before RN presents the browser;
- Add Track, Delete Track, clip menus, export, and onboarding remain functional;
- the example app has no broken browser showcase/navigation.

---

## 7. Coordinated PR deliverables and landing order

| Repository PR | Required deliverable | Dependency / merge gate |
|---|---|---|
| `react-native-circuit-ui` | Optional `SongView.onChangeTrackSound` callback, tests, and deprecation notice for legacy picker exports; no deletion in YON-159 | May merge first |
| `MidicircuitKit` | Tolerant metadata decoder, native catalog/browser/preferences/preview, Change Sound, package tests | Decoder can develop first; full PR validates curated host assets |
| `midicircuit-rn` | Tolerant decoder + source-aware bridges, sole-store RN browser, app-owned UI, all RN tests | Requires this callback before final merge |
| `midicircuit-macos` | Catalog validator/curation, minimal native UI journeys, final merged Kit gitlink, five-surface evidence | Opens in parallel, merges last |

One order applies everywhere: callback → tolerant decoders/bridges → curated host assets → finish and merge Kit/RN implementations → host gitlink and five-surface validation. All four PRs must link YON-159 and each other. Component deletion is a later package-release cleanup after downstream audit.

---

## 8. Acceptance checklist

- [ ] `SongView` exposes one optional track-ID callback and no browser state.
- [ ] Change Sound is accessible, tested, and omitted for unsupported consumers/tracks.
- [ ] RN no longer imports the legacy app-domain components.
- [ ] `AddTrackMenu` and `SoundBankView` are marked deprecated but remain source-compatible.
- [ ] No picker mirror contract or export is deleted in YON-159.
- [ ] No YON-159 taxonomy, favorites, preferences, preview service, or Sound Browser UI is added to Circuit UI.
- [ ] Unit tests, typecheck, package build, and paired RN checks pass.

---

## 9. Non-goals

Full playground-store removal; package export-map tightening; a new generic browser component suite; new dependencies; redesigning track menus; unrelated component refactors.
