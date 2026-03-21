#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RCTMultiTouchOverlayManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(columns, int)
RCT_EXPORT_VIEW_PROPERTY(rows, int)
RCT_EXPORT_VIEW_PROPERTY(onPadPress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPadRelease, RCTDirectEventBlock)
@end
