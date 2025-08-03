import Foundation
import AVFoundation
import React

@objc(AudioRecorderModule)
class AudioRecorderModule: NSObject {
  
  private var audioRecorder: AVAudioRecorder?
  private var audioPlayer: AVAudioPlayer?
  private var recordingURL: URL?
  private var isRecording = false
  private var isPlaying = false
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  // MARK: - Recording Methods
  
  @objc
  func startRecording(_ surahName: String, ayahNumber: Int, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    do {
      // Request microphone permission
      AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
        DispatchQueue.main.async {
          if granted {
            self?.setupRecording(surahName: surahName, ayahNumber: ayahNumber, resolver: resolver, rejecter: rejecter)
          } else {
            rejecter("PERMISSION_DENIED", "Microphone permission denied", nil)
          }
        }
      }
    } catch {
      rejecter("SETUP_ERROR", "Failed to setup audio session", error)
    }
  }
  
  private func setupRecording(surahName: String, ayahNumber: Int, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    do {
      // Configure audio session
      let audioSession = AVAudioSession.sharedInstance()
      try audioSession.setCategory(.playAndRecord, mode: .default)
      try audioSession.setActive(true)
      
      // Create recording URL
      let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
      let recordingsPath = documentsPath.appendingPathComponent("recordings")
      
      // Create recordings directory if it doesn't exist
      if !FileManager.default.fileExists(atPath: recordingsPath.path) {
        try FileManager.default.createDirectory(at: recordingsPath, withIntermediateDirectories: true)
      }
      
      let timestamp = Int(Date().timeIntervalSince1970)
      let fileName = "recording_\(surahName)_\(ayahNumber)_\(timestamp).m4a"
      recordingURL = recordingsPath.appendingPathComponent(fileName)
      
      // Configure recording settings
      let settings: [String: Any] = [
        AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
        AVSampleRateKey: 44100.0,
        AVNumberOfChannelsKey: 2,
        AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
      ]
      
      // Create and start recorder
      audioRecorder = try AVAudioRecorder(url: recordingURL!, settings: settings)
      audioRecorder?.delegate = self
      audioRecorder?.record()
      
      isRecording = true
      resolver(true)
      
    } catch {
      rejecter("RECORDING_ERROR", "Failed to start recording", error)
    }
  }
  
  @objc
  func stopRecording(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    guard isRecording, let recorder = audioRecorder else {
      rejecter("NOT_RECORDING", "No active recording", nil)
      return
    }
    
    let recordingURL = recorder.url
    let duration = recorder.currentTime
    
    recorder.stop()
    isRecording = false
    self.audioRecorder = nil
    
    // Deactivate audio session
    do {
      try AVAudioSession.sharedInstance().setActive(false)
    } catch {
      print("Error deactivating audio session: \(error)")
    }
    
    resolver([
      "uri": recordingURL.path,
      "duration": duration
    ])
  }
  
  // MARK: - Playback Methods
  
  @objc
  func playRecording(_ uri: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    do {
      // Stop any current playback
      if isPlaying {
        audioPlayer?.stop()
        isPlaying = false
      }
      
      // Configure audio session for playback
      let audioSession = AVAudioSession.sharedInstance()
      try audioSession.setCategory(.playback, mode: .default)
      try audioSession.setActive(true)
      
      // Create player
      let url = URL(fileURLWithPath: uri)
      audioPlayer = try AVAudioPlayer(contentsOf: url)
      audioPlayer?.delegate = self
      audioPlayer?.play()
      
      isPlaying = true
      resolver(true)
      
    } catch {
      rejecter("PLAYBACK_ERROR", "Failed to play recording", error)
    }
  }
  
  @objc
  func stopPlayback(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    if isPlaying {
      audioPlayer?.stop()
      isPlaying = false
      audioPlayer = nil
      
      // Deactivate audio session
      do {
        try AVAudioSession.sharedInstance().setActive(false)
      } catch {
        print("Error deactivating audio session: \(error)")
      }
    }
    
    resolver(true)
  }
  
  // MARK: - Status Methods
  
  @objc
  func getStatus(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    resolver([
      "isRecording": isRecording,
      "isPlaying": isPlaying
    ])
  }
  
  // MARK: - File Management Methods
  
  @objc
  func deleteRecording(_ uri: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    do {
      let url = URL(fileURLWithPath: uri)
      try FileManager.default.removeItem(at: url)
      resolver(true)
    } catch {
      rejecter("DELETE_ERROR", "Failed to delete recording", error)
    }
  }
  
  @objc
  func renameRecording(_ oldUri: String, newName: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    do {
      let oldURL = URL(fileURLWithPath: oldUri)
      let directory = oldURL.deletingLastPathComponent()
      let newFileName = newName.hasSuffix(".m4a") ? newName : "\(newName).m4a"
      let newURL = directory.appendingPathComponent(newFileName)
      
      try FileManager.default.moveItem(at: oldURL, to: newURL)
      resolver(newURL.path)
    } catch {
      rejecter("RENAME_ERROR", "Failed to rename recording", error)
    }
  }
  
  @objc
  func listRecordings(_ surahName: String, ayahNumber: Int, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    do {
      let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
      let recordingsPath = documentsPath.appendingPathComponent("recordings")
      
      guard FileManager.default.fileExists(atPath: recordingsPath.path) else {
        resolver([])
        return
      }
      
      let files = try FileManager.default.contentsOfDirectory(at: recordingsPath, includingPropertiesForKeys: [.creationDateKey])
      
      let recordings = files.compactMap { url -> [String: Any]? in
        let fileName = url.lastPathComponent
        let pattern = "recording_\(surahName)_\(ayahNumber)_"
        
        guard fileName.hasPrefix(pattern) else { return nil }
        
        let attributes = try? FileManager.default.attributesOfItem(atPath: url.path)
        let creationDate = attributes?[.creationDate] as? Date ?? Date()
        
        return [
          "uri": url.path,
          "filename": fileName,
          "timestamp": ISO8601DateFormatter().string(from: creationDate),
          "duration": 0 // TODO: Extract duration from audio file metadata
        ]
      }
      
      // Sort by creation date (newest first)
      let sortedRecordings = recordings.sorted { first, second in
        let firstDate = ISO8601DateFormatter().date(from: first["timestamp"] as! String) ?? Date()
        let secondDate = ISO8601DateFormatter().date(from: second["timestamp"] as! String) ?? Date()
        return firstDate > secondDate
      }
      
      resolver(sortedRecordings)
      
    } catch {
      rejecter("LIST_ERROR", "Failed to list recordings", error)
    }
  }
}

// MARK: - AVAudioRecorderDelegate

extension AudioRecorderModule: AVAudioRecorderDelegate {
  func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
    if !flag {
      print("Recording finished unsuccessfully")
    }
  }
  
  func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
    if let error = error {
      print("Recording encode error: \(error)")
    }
  }
}

// MARK: - AVAudioPlayerDelegate

extension AudioRecorderModule: AVAudioPlayerDelegate {
  func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
    isPlaying = false
    audioPlayer = nil
    
    // Deactivate audio session
    do {
      try AVAudioSession.sharedInstance().setActive(false)
    } catch {
      print("Error deactivating audio session: \(error)")
    }
  }
  
  func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
    if let error = error {
      print("Audio player decode error: \(error)")
    }
    isPlaying = false
    audioPlayer = nil
  }
} 