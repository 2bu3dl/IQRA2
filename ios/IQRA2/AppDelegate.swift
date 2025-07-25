import UIKit
import React
import WatchConnectivity

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, RCTBridgeDelegate, WCSessionDelegate {
  var window: UIWindow?

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
  
  // MARK: - Watch Connectivity
  
  private func setupWatchConnectivity() {
    if WCSession.isSupported() {
      let session = WCSession.default
      session.delegate = self
      session.activate()
    }
  }
  
  // WCSessionDelegate methods
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    if activationState == .activated {
      print("Watch connectivity activated on iPhone")
    }
  }
  
  func sessionDidBecomeInactive(_ session: WCSession) {
    print("Watch connectivity became inactive")
  }
  
  func sessionDidDeactivate(_ session: WCSession) {
    print("Watch connectivity deactivated")
    // Reactivate for future use
    WCSession.default.activate()
  }
  
  func session(_ session: WCSession, didReceiveMessage message: [String : Any], replyHandler: @escaping ([String : Any]) -> Void) {
    // Handle messages from Apple Watch
    if let request = message["request"] as? String, request == "userData" {
      // Send user data to Apple Watch
      let userData = getUserDataForWatch()
      replyHandler(["userData": userData])
    }
  }
  
  func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
    // Handle messages from Apple Watch (no reply needed)
    print("Received message from Apple Watch: \(message)")
  }
  
  private func getUserDataForWatch() -> [String: Any] {
    // Get user data from shared container or app state
    let sharedDefaults = UserDefaults(suiteName: "group.com.iqra2.app")
    
    let userData: [String: Any] = [
      "totalHasanat": sharedDefaults?.integer(forKey: "totalHasanat") ?? 0,
      "todayHasanat": sharedDefaults?.integer(forKey: "todayHasanat") ?? 0,
      "streak": sharedDefaults?.integer(forKey: "streak") ?? 0,
      "memorizedAyaat": sharedDefaults?.integer(forKey: "memorizedAyaat") ?? 0,
      "totalAyaat": sharedDefaults?.integer(forKey: "totalAyaat") ?? 0
    ]
    
    return userData
  }
  
  // MARK: - Data Sync with Watch
  
  func syncDataWithWatch() {
    guard WCSession.default.isReachable else {
      print("Apple Watch is not reachable")
      return
    }
    
    let userData = getUserDataForWatch()
    WCSession.default.sendMessage(["userData": userData], replyHandler: { reply in
      print("Data synced with Apple Watch successfully")
    }, errorHandler: { error in
      print("Error syncing data with Apple Watch: \(error)")
    })
  }
}
