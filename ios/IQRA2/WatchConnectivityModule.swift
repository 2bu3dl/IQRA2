import Foundation
import React
import WatchConnectivity

@objc(WatchConnectivityModule)
class WatchConnectivityModule: RCTEventEmitter, WCSessionDelegate {
  
  static func moduleName() -> String! {
    return "WatchConnectivityModule"
  }
  
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  override func supportedEvents() -> [String]! {
    return ["WatchMessageReceived", "WatchProgressUpdated"]
  }
  
  // MARK: - React Native Methods
  
  @objc
  func syncDataWithWatch(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard WCSession.isSupported() else {
      reject("error", "Watch connectivity not supported", nil)
      return
    }
    
    guard WCSession.default.isReachable else {
      reject("error", "Apple Watch is not reachable", nil)
      return
    }
    
    let userData = getUserDataForWatch()
    WCSession.default.sendMessage(["userData": userData], replyHandler: { reply in
      resolve(["success": true, "message": "Data synced successfully"])
    }, errorHandler: { error in
      reject("error", "Failed to sync data with Apple Watch", error)
    })
  }
  
  @objc
  func isWatchReachable(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let isReachable = WCSession.isSupported() && WCSession.default.isReachable
    resolve(["isReachable": isReachable])
  }
  
  @objc
  func sendMessageToWatch(_ message: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard WCSession.isSupported() && WCSession.default.isReachable else {
      reject("error", "Apple Watch is not reachable", nil)
      return
    }
    
    WCSession.default.sendMessage(message, replyHandler: { reply in
      resolve(["success": true, "reply": reply])
    }, errorHandler: { error in
      reject("error", "Failed to send message to Apple Watch", error)
    })
  }
  
  // MARK: - Helper Methods
  
  private func getUserDataForWatch() -> [String: Any] {
    let sharedDefaults = UserDefaults(suiteName: "group.com.iqra2.app")
    
    let userData: [String: Any] = [
      "totalHasanat": sharedDefaults?.integer(forKey: "totalHasanat") ?? 0,
      "todayHasanat": sharedDefaults?.integer(forKey: "todayHasanat") ?? 0,
      "streak": sharedDefaults?.integer(forKey: "streak") ?? 0,
      "memorizedAyaat": sharedDefaults?.integer(forKey: "memorizedAyaat") ?? 0,
      "totalAyaat": sharedDefaults?.integer(forKey: "totalAyaat") ?? 0,
      "lastSyncDate": Date().timeIntervalSince1970
    ]
    
    return userData
  }
  
  // MARK: - WCSessionDelegate
  
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    if activationState == .activated {
      print("Watch connectivity activated")
    }
  }
  
  func sessionDidBecomeInactive(_ session: WCSession) {
    print("Watch connectivity became inactive")
  }
  
  func sessionDidDeactivate(_ session: WCSession) {
    print("Watch connectivity deactivated")
    WCSession.default.activate()
  }
  
  func session(_ session: WCSession, didReceiveMessage message: [String : Any], replyHandler: @escaping ([String : Any]) -> Void) {
    // Handle messages from Apple Watch
    if let request = message["request"] as? String {
      switch request {
      case "userData":
        let userData = getUserDataForWatch()
        replyHandler(["userData": userData])
      case "updateProgress":
        // Handle progress update from watch
        if let progress = message["progress"] as? [String: Any] {
          updateProgressFromWatch(progress)
        }
        replyHandler(["success": true])
      default:
        replyHandler(["error": "Unknown request"])
      }
    } else {
      replyHandler(["error": "Invalid message format"])
    }
  }
  
  func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
    // Handle messages from Apple Watch (no reply needed)
    print("Received message from Apple Watch: \(message)")
    
    // Emit event to React Native
    sendEvent(withName: "WatchMessageReceived", body: message)
    
    // Handle progress updates
    if let progress = message["progress"] as? [String: Any] {
      updateProgressFromWatch(progress)
      sendEvent(withName: "WatchProgressUpdated", body: progress)
    }
  }
  
  private func updateProgressFromWatch(_ progress: [String: Any]) {
    let sharedDefaults = UserDefaults(suiteName: "group.com.iqra2.app")
    
    if let hasanat = progress["hasanat"] as? Int {
      sharedDefaults?.set(hasanat, forKey: "todayHasanat")
    }
    
    if let streak = progress["streak"] as? Int {
      sharedDefaults?.set(streak, forKey: "streak")
    }
    
    if let memorizedAyaat = progress["memorizedAyaat"] as? Int {
      sharedDefaults?.set(memorizedAyaat, forKey: "memorizedAyaat")
    }
    
    sharedDefaults?.synchronize()
  }
} 