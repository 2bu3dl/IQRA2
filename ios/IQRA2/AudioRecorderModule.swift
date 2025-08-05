// Temporarily commented out due to missing React Native dependencies
/*
import Foundation
import AVFoundation
import React

@objc(AudioRecorderModule)
class AudioRecorderModule: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
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
  func startRecording(_ surahName: String, ayahNumber: NSNumber, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    print("AudioRecorderModule: startRecording called with surahName: \(surahName), ayahNumber: \(ayahNumber)")
    
    // Check if already recording
    if isRecording {
      print("AudioRecorderModule: Already recording, stopping first")
      stopRecording(resolver: { _ in }, rejecter: { _, _, _ in })
    }
    
    // Request microphone permission
    AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
      guard let self = self else { return }
      
      DispatchQueue.main.async {
        if granted {
          print("AudioRecorderModule: Microphone permission granted")
          self.beginRecording(surahName: surahName, ayahNumber: ayahNumber.intValue, resolver: resolver, rejecter: rejecter)
        } else {
          print("AudioRecorderModule: Microphone permission denied")
          rejecter("PERMISSION_DENIED", "Microphone permission denied", nil)
        }
      }
    }
  }
  
  private func beginRecording(surahName: String, ayahNumber: Int, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    do {
      // Configure audio session
      let audioSession = AVAudioSession.sharedInstance()
      try audioSession.setCategory(.playAndRecord, mode: .default)
      try audioSession.setActive(true)
      
      // Create recordings directory
      let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
      let recordingsPath = documentsPath.appendingPathComponent("Recordings")
      
      if !FileManager.default.fileExists(atPath: recordingsPath.path) {
        try FileManager.default.createDirectory(at: recordingsPath, withIntermediateDirectories: true)
      }
      
      // Generate filename with new format: surahName_ayahNumber_IQRA2rec_count
      let baseName = "\(surahName)_\(ayahNumber)_IQRA2rec"
      let existingRecordings = getExistingRecordings(baseName: baseName)
      let nextNumber = existingRecordings.count + 1
      let filename = "\(baseName)_\(nextNumber).m4a"
      
      let recordingURL = recordingsPath.appendingPathComponent(filename)
      
      // Configure recorder settings
      let settings: [String: Any] = [
        AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
        AVSampleRateKey: 44100,
        AVNumberOfChannelsKey: 1, // Mono recording
        AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
      ]
      
      // Create and configure recorder
      audioRecorder = try AVAudioRecorder(url: recordingURL, settings: settings)
      audioRecorder?.delegate = self
      audioRecorder?.prepareToRecord()
      
      // Start recording
      if audioRecorder?.record() == true {
        isRecording = true
        self.recordingURL = recordingURL // Store the URL for stopping
        resolver(true)
      } else {
        rejecter("RECORDING_FAILED", "Failed to start recording", nil)
      }
      
    } catch {
      rejecter("RECORDING_ERROR", "Error starting recording: \(error.localizedDescription)", error)
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
  
  // MARK: - Helper Methods
  
  private func getExistingRecordings(baseName: String) -> [URL] {
    let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    let recordingsPath = documentsPath.appendingPathComponent("Recordings")
    
    do {
      let fileURLs = try FileManager.default.contentsOfDirectory(at: recordingsPath, includingPropertiesForKeys: nil)
      return fileURLs.filter { url in
        let filename = url.lastPathComponent
        return filename.hasPrefix(baseName) && filename.hasSuffix(".m4a")
      }.sorted { url1, url2 in
        url1.lastPathComponent < url2.lastPathComponent
      }
    } catch {
      print("AudioRecorderModule: Error getting existing recordings: \(error)")
      return []
    }
  }
  
  @objc
  func loadRecordings(_ surahName: String, ayahNumber: NSNumber, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    let recordingsPath = documentsPath.appendingPathComponent("Recordings")
    
    do {
      let fileURLs = try FileManager.default.contentsOfDirectory(at: recordingsPath, includingPropertiesForKeys: [.creationDateKey, .fileSizeKey], options: [])
      
      let baseName = "\(surahName)_\(ayahNumber)_Recitation_recording"
      let recordings = fileURLs.compactMap { url -> [String: Any]? in
        let filename = url.lastPathComponent
        if filename.hasPrefix(baseName) && filename.hasSuffix(".m4a") {
          do {
            let attributes = try FileManager.default.attributesOfItem(atPath: url.path)
            let creationDate = attributes[.creationDate] as? Date ?? Date()
            let fileSize = attributes[.size] as? Int64 ?? 0
            
            // Calculate duration using AVAsset
            let asset = AVAsset(url: url)
            let duration = CMTimeGetSeconds(asset.duration)
            
            return [
              "uri": url.path,
              "name": filename,
              "creationDate": creationDate.timeIntervalSince1970,
              "fileSize": fileSize,
              "duration": duration
            ]
          } catch {
            return nil
          }
        }
        return nil
      }
      
      resolver(recordings)
    } catch {
      rejecter("LOAD_ERROR", "Error loading recordings: \(error.localizedDescription)", error)
    }
  }
  
  private func extractNumberFromFilename(_ filename: String) -> Int {
    // Extract number from "SurahName_AyahNumber_Recitation_recording_X.m4a"
    let components = filename.components(separatedBy: "_")
    if components.count >= 4 {
      let lastComponent = components.last ?? ""
      let numberString = lastComponent.replacingOccurrences(of: ".m4a", with: "")
      return Int(numberString) ?? 0
    }
    return 0
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
      let recordingsPath = documentsPath.appendingPathComponent("Recordings")
      
      guard FileManager.default.fileExists(atPath: recordingsPath.path) else {
        resolver([])
        return
      }
      
      let files = try FileManager.default.contentsOfDirectory(at: recordingsPath, includingPropertiesForKeys: [.creationDateKey])
      
      let recordings = files.compactMap { url -> [String: Any]? in
        let fileName = url.lastPathComponent
        let pattern = "\(surahName)_\(ayahNumber)_Recitation_recording_"
        
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
*/ 