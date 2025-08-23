import { Platform } from 'react-native';

// Platform-specific imports
let TrackPlayer, Event, State;

if (Platform.OS === 'ios' || Platform.OS === 'android') {
  // Both platforms: Use react-native-track-player (if available)
  try {
    const trackPlayerModule = require('react-native-track-player');
    TrackPlayer = trackPlayerModule.default;
    Event = trackPlayerModule.Event;
    State = trackPlayerModule.State;
  } catch (error) {
    console.warn('[AudioPlayer] react-native-track-player not available, using built-in audio simulation');
  }
}

class AudioPlayer {
  constructor() {
    this.currentSound = null;
    this.isPlaying = false;
    this.currentAyah = null;
    this.isInitialized = false;
    this.highlightingInterval = null;
    this.playbackStartTime = null;
    this.currentMetadata = null;
    this.highlightingCallbacks = [];
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      if (TrackPlayer) {
        // Both platforms: Initialize TrackPlayer with proper error handling
        try {
          await TrackPlayer.setupPlayer();
          await TrackPlayer.updateOptions({
            capabilities: [
              'play',
              'pause',
              'stop',
            ],
            compactCapabilities: [
              'play',
              'pause',
              'stop',
            ],
          });
          console.log('[AudioPlayer] TrackPlayer initialized successfully');
        } catch (trackPlayerError) {
          console.warn('[AudioPlayer] TrackPlayer initialization failed, falling back to basic audio simulation:', trackPlayerError);
          // Mark as initialized to prevent retry attempts
          this.isInitialized = true;
          return;
        }
      }
      
      this.isInitialized = true;
      console.log('[AudioPlayer] Audio player initialized successfully');
    } catch (error) {
      console.error('[AudioPlayer] Error initializing audio player:', error);
      // Mark as initialized to prevent retry attempts
      this.isInitialized = true;
    }
  }

  async playAudio(audioSource, metadata = null) {
    try {
      // Validate audioSource
      if (!audioSource) {
        console.error('[AudioPlayer] Invalid audioSource:', audioSource);
        return false;
      }
      
      // Initialize if not already done
      await this.initialize();
      
      // Stop any currently playing audio
      await this.stopAudio();
      
      console.log('[AudioPlayer] Attempting to play:', audioSource);
      
      // Set playing state
      this.isPlaying = true;
      this.currentAyah = audioSource;
      this.currentMetadata = metadata;
      this.playbackStartTime = Date.now();
      
      if (TrackPlayer && this.isInitialized) {
        // Both platforms: Use TrackPlayer
        try {
          // Clear any existing tracks
          await TrackPlayer.reset();
          
          // Add the track to the queue
          await TrackPlayer.add({
            id: 'quran-audio',
            url: audioSource, // This should be a URL or file path
            title: metadata?.title || 'Quran Audio',
            artist: metadata?.artist || 'Reciter',
            duration: metadata?.duration || 0,
          });
          
          // Start playing
          await TrackPlayer.play();
          console.log('[AudioPlayer] Started playing with TrackPlayer');
        } catch (error) {
          console.error('[AudioPlayer] Error with TrackPlayer:', error);
          // Fallback to simulation if TrackPlayer fails
          this.fallbackToSimulation();
        }
      } else {
        // Fallback: Just simulate audio for now
        console.warn('[AudioPlayer] No audio library available, simulating playback');
        this.fallbackToSimulation();
      }
      
      console.log('[AudioPlayer] Audio playback started');
      
      // Start highlighting timer if metadata is provided
      if (metadata && metadata.words) {
        this.startHighlightingTimer();
      }
      
      return true;
    } catch (error) {
      console.error('[AudioPlayer] Error playing audio:', error.message || error);
      this.isPlaying = false;
      this.currentAyah = null;
      this.stopHighlightingTimer();
      return false;
    }
  }

  fallbackToSimulation() {
    // Simulate audio playback for both platforms when TrackPlayer is not available
    setTimeout(() => {
      console.log('[AudioPlayer] Simulated audio playback completed');
      this.isPlaying = false;
      this.currentAyah = null;
      this.stopHighlightingTimer();
    }, 5000); // Simulate 5 seconds of audio
  }

  async stopAudio() {
    try {
      if (this.isPlaying) {
        if (TrackPlayer && this.isInitialized) {
          try {
            await TrackPlayer.stop();
            await TrackPlayer.reset();
          } catch (trackPlayerError) {
            console.warn('[AudioPlayer] TrackPlayer not ready, using fallback stop');
          }
        }
        
        this.isPlaying = false;
        this.currentAyah = null;
        this.stopHighlightingTimer();
        console.log('[AudioPlayer] Audio stopped');
      }
    } catch (error) {
      console.error('[AudioPlayer] Error stopping audio:', error);
    }
  }

  async getStatus() {
    try {
      if (TrackPlayer && this.isInitialized) {
        try {
          const state = await TrackPlayer.getState();
          return {
            isPlaying: state === State.Playing,
            isPaused: state === State.Paused,
            isStopped: state === State.Stopped,
          };
        } catch (trackPlayerError) {
          console.warn('[AudioPlayer] TrackPlayer not ready, using fallback status');
          return {
            isPlaying: this.isPlaying,
            isPaused: false,
            isStopped: !this.isPlaying,
          };
        }
      } else {
        return {
          isPlaying: this.isPlaying,
          isPaused: false, // react-native-sound doesn't have pause state
          isStopped: !this.isPlaying,
        };
      }
    } catch (error) {
      console.error('[AudioPlayer] Error getting status:', error);
      return { isPlaying: false, isPaused: false, isStopped: true };
    }
  }

  async pauseAudio() {
    try {
      if (TrackPlayer && this.isInitialized) {
        try {
          await TrackPlayer.pause();
        } catch (trackPlayerError) {
          console.warn('[AudioPlayer] TrackPlayer not ready, using fallback pause');
        }
      }
      console.log('[AudioPlayer] Audio paused');
    } catch (error) {
      console.error('[AudioPlayer] Error pausing audio:', error);
    }
  }

  async seekToStart() {
    try {
      if (TrackPlayer && this.isInitialized) {
        try {
          await TrackPlayer.seekTo(0);
        } catch (trackPlayerError) {
          console.warn('[AudioPlayer] TrackPlayer not ready, using fallback seek');
        }
      }
      console.log('[AudioPlayer] Audio seeked to start');
    } catch (error) {
      console.error('[AudioPlayer] Error seeking audio:', error);
    }
  }

  startHighlightingTimer() {
    if (this.highlightingInterval) {
      clearInterval(this.highlightingInterval);
    }

    this.highlightingInterval = setInterval(() => {
      if (this.isPlaying && this.currentMetadata && this.currentMetadata.words) {
        const currentTime = this.getCurrentTime();
        const currentWord = this.findCurrentWord(currentTime);
        
        if (currentWord !== null) {
          this.highlightingCallbacks.forEach(callback => {
            callback(currentWord, currentTime);
          });
        }
      }
    }, 100);
  }

  stopHighlightingTimer() {
    if (this.highlightingInterval) {
      clearInterval(this.highlightingInterval);
      this.highlightingInterval = null;
    }
  }

  onHighlightingUpdate(callback) {
    this.highlightingCallbacks.push(callback);
    
    return () => {
      const index = this.highlightingCallbacks.indexOf(callback);
      if (index > -1) {
        this.highlightingCallbacks.splice(index, 1);
      }
    };
  }

  getCurrentTime() {
    if (!this.playbackStartTime) return 0;
    return (Date.now() - this.playbackStartTime) / 1000;
  }

  findCurrentWord(currentTime) {
    if (!this.currentMetadata || !this.currentMetadata.words) return null;
    
    for (let i = 0; i < this.currentMetadata.words.length; i++) {
      const word = this.currentMetadata.words[i];
      if (currentTime >= word.startTime && currentTime <= word.endTime) {
        return i;
      }
    }
    return null;
  }

  cleanup() {
    this.stopHighlightingTimer();
    this.stopAudio();
    this.highlightingCallbacks = [];
  }
}

export default new AudioPlayer(); 