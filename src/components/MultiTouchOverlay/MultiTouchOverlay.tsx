// Platform-specific implementations:
//   MultiTouchOverlay.ios.tsx  — native RCTMultiTouchOverlay
//   MultiTouchOverlay.android.tsx — JS responder-based multi-touch
//
// This file exists for TypeScript resolution. Metro uses .ios/.android files at runtime.
export { MultiTouchOverlay } from './MultiTouchOverlay.ios';
export type { MultiTouchOverlayProps } from './MultiTouchOverlay.ios';
