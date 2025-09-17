import Foundation
import WatchConnectivity

// React Native Event Emitter (inline definition)
@objc class RCTEventEmitter: NSObject {
    func supportedEvents() -> [String] {
        return []
    }
}

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
    
    let session = WCSession.default
    session.delegate = self
    session.activate()
    
    if session.isReachable {
      let userData: [String: Any] = [
        "totalHasanat": UserDefaults.standard.integer(forKey: "totalHasanat"),
        "todayHasanat": UserDefaults.standard.integer(forKey: "todayHasanat"),
        "streak": UserDefaults.standard.integer(forKey: "streak"),
        "memorizedAyaat": UserDefaults.standard.integer(forKey: "memorizedAyaat"),
        "totalAyaat": UserDefaults.standard.integer(forKey: "totalAyaat")
      ]
      
      session.sendMessage(["userData": userData], replyHandler: { reply in
        resolve(["success": true, "message": "Data synced with watch"])
      }, errorHandler: { error in
        reject("error", "Failed to sync with watch: \(error.localizedDescription)", error)
      })
    } else {
      reject("error", "Watch is not reachable", nil)
    }
  }
  
  @objc
  func sendProgressToWatch(_ progress: [String: Any], resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard WCSession.isSupported() else {
      reject("error", "Watch connectivity not supported", nil)
      return
    }
    
    let session = WCSession.default
    if session.isReachable {
      session.sendMessage(["progress": progress], replyHandler: { reply in
        resolve(["success": true])
      }, errorHandler: { error in
        reject("error", "Failed to send progress to watch: \(error.localizedDescription)", error)
      })
    } else {
      reject("error", "Watch is not reachable", nil)
    }
  }
  
  // MARK: - WCSessionDelegate
  
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
    WCSession.default.activate()
  }
  
  func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
    print("Received message from watch: \(message)")
    sendEvent(withName: "WatchMessageReceived", body: message)
  }
  
  func session(_ session: WCSession, didReceiveMessage message: [String : Any], replyHandler: @escaping ([String : Any]) -> Void) {
    print("Received message from watch with reply: \(message)")
    sendEvent(withName: "WatchMessageReceived", body: message)
    replyHandler(["status": "received"])
  }
} 