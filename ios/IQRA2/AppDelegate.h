#import <UIKit/UIKit.h>

@protocol RCTBridgeDelegate;

@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate>

@property (nonatomic, strong) UIWindow *window;

@end
