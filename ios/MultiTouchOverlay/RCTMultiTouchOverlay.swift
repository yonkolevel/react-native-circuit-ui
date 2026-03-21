import UIKit
import React

/// Native UIView that captures multi-touch and maps touches to grid indices.
/// Blocks parent ScrollView gestures to enable drag-to-play.
@objc(RCTMultiTouchOverlay)
class RCTMultiTouchOverlay: RCTView, UIGestureRecognizerDelegate {

  // MARK: - Props from JS

  @objc var columns: Int = 4
  @objc var rows: Int = 4
  @objc var onPadPress: RCTDirectEventBlock?
  @objc var onPadRelease: RCTDirectEventBlock?

  /// Maps each active touch to the grid index it's currently on
  private var touchMap: [ObjectIdentifier: Int] = [:]

  // MARK: - Setup

  override init(frame: CGRect) {
    super.init(frame: frame)
    isMultipleTouchEnabled = true
    backgroundColor = .clear

    let gesture = ImmediateTouchGesture(target: nil, action: nil)
    gesture.cancelsTouchesInView = false
    gesture.delaysTouchesBegan = false
    gesture.delaysTouchesEnded = false
    gesture.delegate = self
    addGestureRecognizer(gesture)
  }

  required init?(coder: NSCoder) { fatalError() }

  // MARK: - Index calculation

  private func indexAt(_ point: CGPoint) -> Int? {
    guard bounds.width > 0, bounds.height > 0 else { return nil }
    let col = Int(point.x / (bounds.width / CGFloat(columns)))
    let row = Int(point.y / (bounds.height / CGFloat(rows)))
    guard col >= 0, col < columns, row >= 0, row < rows else { return nil }
    return row * columns + col
  }

  // MARK: - Touch handling

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    for touch in touches {
      let point = touch.location(in: self)
      guard let index = indexAt(point) else { continue }
      let touchID = ObjectIdentifier(touch)
      touchMap[touchID] = index
      if fingerCount(on: index, excluding: touchID) == 0 {
        onPadPress?(["index": index])
      }
    }
  }

  override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
    for touch in touches {
      let point = touch.location(in: self)
      let newIndex = indexAt(point)
      let touchID = ObjectIdentifier(touch)
      let oldIndex = touchMap[touchID]

      guard newIndex != oldIndex else { continue }

      // Release old
      if let old = oldIndex {
        touchMap[touchID] = newIndex
        if fingerCount(on: old) == 0 {
          onPadRelease?(["index": old])
        }
      } else {
        touchMap[touchID] = newIndex
      }

      // Press new
      if let new_ = newIndex, fingerCount(on: new_, excluding: touchID) == 0 {
        onPadPress?(["index": new_])
      }
    }
  }

  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    removeTouches(touches)
  }

  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
    removeTouches(touches)
  }

  private func removeTouches(_ touches: Set<UITouch>) {
    for touch in touches {
      let touchID = ObjectIdentifier(touch)
      guard let index = touchMap.removeValue(forKey: touchID) else { continue }
      if fingerCount(on: index) == 0 {
        onPadRelease?(["index": index])
      }
    }
  }

  private func fingerCount(on index: Int, excluding: ObjectIdentifier? = nil) -> Int {
    touchMap.reduce(0) { count, entry in
      if entry.key == excluding { return count }
      return entry.value == index ? count + 1 : count
    }
  }

  // MARK: - Gesture delegate — block ScrollView

  func gestureRecognizer(_ gr: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool {
    if other.view is UIScrollView { return false }
    let name = String(describing: type(of: other))
    if name.hasPrefix("RCT"), name.contains("TouchHandler") { return false }
    return true
  }
}

/// Immediately claims touch to prevent ScrollView from stealing it.
private final class ImmediateTouchGesture: UIGestureRecognizer {
  private var count = 0

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
    count += touches.count
    state = state == .possible ? .began : .changed
  }
  override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent) {
    state = .changed
  }
  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
    count -= touches.count
    state = count <= 0 ? .ended : .changed
    if count <= 0 { count = 0 }
  }
  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) {
    count -= touches.count
    state = count <= 0 ? .cancelled : .changed
    if count <= 0 { count = 0 }
  }
  override func reset() { super.reset(); count = 0 }
}
