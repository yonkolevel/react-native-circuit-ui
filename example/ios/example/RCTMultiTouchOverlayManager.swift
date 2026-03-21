import React

@objc(RCTMultiTouchOverlayManager)
class RCTMultiTouchOverlayManager: RCTViewManager {
  override func view() -> UIView! {
    return RCTMultiTouchOverlay()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
