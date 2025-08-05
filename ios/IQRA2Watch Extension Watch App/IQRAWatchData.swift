//
//  IQRAWatchData.swift
//  IQRA2Watch Extension Watch App
//
//  Created by Nadeem Freajah on 7/21/25.
//

import Foundation
import WatchConnectivity

class IQRAWatchData: NSObject, ObservableObject, WCSessionDelegate {
    static let shared = IQRAWatchData()
    
    @Published var currentSurah = "Al-Fatiha"
    @Published var currentAyah = 1
    @Published var totalAyahs = 7
    @Published var isAudioPlaying = false
    @Published var memorizationProgress = 0.0
    
    private var session: WCSession?
    
    override init() {
        super.init()
        setupWatchConnectivity()
    }
    
    private func setupWatchConnectivity() {
        if WCSession.isSupported() {
            session = WCSession.default
            session?.delegate = self
            session?.activate()
        }
    }
    
    // MARK: - WCSessionDelegate
    
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            print("Watch session activation failed: \(error.localizedDescription)")
        } else {
            print("Watch session activated successfully")
        }
    }
    
    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        DispatchQueue.main.async {
            if let surah = message["surah"] as? String {
                self.currentSurah = surah
            }
            if let ayah = message["ayah"] as? Int {
                self.currentAyah = ayah
            }
            if let total = message["totalAyahs"] as? Int {
                self.totalAyahs = total
            }
            if let progress = message["progress"] as? Double {
                self.memorizationProgress = progress
            }
            if let playing = message["isAudioPlaying"] as? Bool {
                self.isAudioPlaying = playing
            }
        }
    }
    
    // MARK: - Public Methods
    
    func sendMessageToPhone(_ message: [String: Any]) {
        session?.sendMessage(message, replyHandler: nil) { error in
            print("Failed to send message to phone: \(error.localizedDescription)")
        }
    }
    
    func toggleAudio() {
        isAudioPlaying.toggle()
        sendMessageToPhone(["action": "toggleAudio", "isPlaying": isAudioPlaying])
    }
    
    func navigateAyah(direction: Int) {
        let newAyah = currentAyah + direction
        if newAyah >= 1 && newAyah <= totalAyahs {
            currentAyah = newAyah
            sendMessageToPhone(["action": "navigateAyah", "ayah": currentAyah])
        }
    }
} 