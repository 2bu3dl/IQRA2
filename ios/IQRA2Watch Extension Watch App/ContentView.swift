//
//  ContentView.swift
//  IQRA2Watch Extension Watch App
//
//  Created by Nadeem Freajah on 7/21/25.
//

import SwiftUI
import WatchKit

struct ContentView: View {
    @StateObject private var watchData = IQRAWatchData.shared
    
    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                // Header with surah name
                VStack {
                    Text("IQRA")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.green)
                    
                    Text(watchData.currentSurah)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.primary)
                }
                .padding(.top, 8)
                
                // Current ayah display
                VStack(spacing: 4) {
                    Text("Ayah \(watchData.currentAyah)")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.primary)
                    
                    Text("of \(watchData.totalAyahs)")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                }
                
                // Progress indicator
                ProgressView(value: watchData.memorizationProgress)
                    .progressViewStyle(LinearProgressViewStyle(tint: .green))
                    .scaleEffect(0.8)
                
                // Audio control button
                Button(action: {
                    watchData.toggleAudio()
                    WKInterfaceDevice.current().play(.click)
                }) {
                    HStack {
                        Image(systemName: watchData.isAudioPlaying ? "pause.circle.fill" : "play.circle.fill")
                            .font(.system(size: 20))
                        Text(watchData.isAudioPlaying ? "Pause" : "Play")
                            .font(.system(size: 12, weight: .medium))
                    }
                    .foregroundColor(.green)
                }
                .buttonStyle(PlainButtonStyle())
                
                // Navigation buttons
                HStack(spacing: 20) {
                    Button(action: {
                        watchData.navigateAyah(direction: -1)
                        WKInterfaceDevice.current().play(.click)
                    }) {
                        Image(systemName: "chevron.left.circle.fill")
                            .font(.system(size: 24))
                            .foregroundColor(watchData.currentAyah > 1 ? .blue : .gray)
                    }
                    .disabled(watchData.currentAyah <= 1)
                    
                    Button(action: {
                        watchData.navigateAyah(direction: 1)
                        WKInterfaceDevice.current().play(.click)
                    }) {
                        Image(systemName: "chevron.right.circle.fill")
                            .font(.system(size: 24))
                            .foregroundColor(watchData.currentAyah < watchData.totalAyahs ? .blue : .gray)
                    }
                    .disabled(watchData.currentAyah >= watchData.totalAyahs)
                }
                
                // Quick stats
                VStack(spacing: 4) {
                    Text("Progress")
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                    
                    Text("\(Int(watchData.memorizationProgress * 100))%")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.green)
                }
                .padding(.top, 8)
            }
            .padding()
        }
    }
}

#Preview {
    ContentView()
}
