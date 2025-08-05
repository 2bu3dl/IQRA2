import UIKit
import React
import WatchConnectivity

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, RCTBridgeDelegate, WCSessionDelegate {

  var window: UIWindow?
  var bridge: RCTBridge!

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    
    let bridge = RCTBridge(delegate: self, launchOptions: launchOptions)
    let rootView = RCTRootView(bridge: bridge!, moduleName: "IQRA2", initialProperties: nil)
    let rootViewController = UIViewController()
    rootViewController.view = rootView

    self.window = UIWindow(frame: UIScreen.main.bounds)
    self.window?.rootViewController = rootViewController
    self.window?.makeKeyAndVisible()
    
    // Setup Watch Connectivity
    setupWatchConnectivity()
    
    return true
  }

  // MARK: - RCTBridgeDelegate
  @objc(sourceURLForBridge:)
  func sourceURL(for bridge: RCTBridge) -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index", fallbackExtension: nil)
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }

  // MARK: - WCSessionDelegate
  func setupWatchConnectivity() {
    if WCSession.isSupported() {
      let session = WCSession.default
      session.delegate = self
      session.activate()
    }
  }

  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    if let error = error {
      print("Watch connectivity activation failed: \(error)")
    } else {
      print("Watch connectivity activated successfully")
    }
  }

  func sessionDidBecomeInactive(_ session: WCSession) {
    print("Watch session became inactive")
  }

  func sessionDidDeactivate(_ session: WCSession) {
    print("Watch session deactivated")
    // Reactivate for future use
    WCSession.default.activate()
  }

  func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
    print("Received message from watch: \(message)")
    // Handle messages from watch
  }

  func session(_ session: WCSession, didReceiveMessage message: [String : Any], replyHandler: @escaping ([String : Any]) -> Void) {
    print("Received message from watch with reply: \(message)")
    // Handle messages from watch with reply
    replyHandler(["status": "received"])
  }
}
