import { Platform } from 'react-native';

// Platform-specific imports
let TrackPlayer, Event, State;

// Import track-player for iOS
if (Platform.OS === 'ios') {
  try {
    const trackPlayerModule = require('react-native-track-player');
    TrackPlayer = trackPlayerModule.default;
    Event = trackPlayerModule.Event;
    State = trackPlayerModule.State;
  } catch (error) {
    console.warn('[AudioPlayer] react-native-track-player not available on iOS, using built-in audio simulation');
  }
}

// Commented out for future Android implementation
// let Sound;
// if (Platform.OS === 'android') {
//   try {
//     Sound = require('react-native-sound').default;
//     Sound.setCategory('Playback');
//   } catch (error) {
//     console.warn('[AudioPlayer] react-native-sound not available on Android, using built-in audio simulation');
//   }
// }

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
    this.audioElement = null;
    this.onEndedCallback = null;
    this.trackPlayerSetup = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      if (Platform.OS === 'web') {
        // Web: Use HTML5 Audio
        this.audioElement = new Audio();
        this.audioElement.preload = 'auto';
        console.log('[AudioPlayer] HTML5 Audio initialized for web');
      } else if (Platform.OS === 'ios' && TrackPlayer) {
        // iOS: Initialize TrackPlayer
        try {
          if (!this.trackPlayerSetup) {
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
            this.trackPlayerSetup = true;
            console.log('[AudioPlayer] TrackPlayer initialized successfully on iOS');
          } else {
            console.log('[AudioPlayer] TrackPlayer already setup on iOS');
          }
          
          // Set up TrackPlayer event listeners
          TrackPlayer.addEventListener(Event.PlaybackState, (state) => {
            if (state.state === State.Ended && this.onEndedCallback) {
              console.log('[AudioPlayer] TrackPlayer playback ended');
              this.onEndedCallback();
            }
          });
        } catch (trackPlayerError) {
          console.warn('[AudioPlayer] TrackPlayer initialization failed on iOS, falling back to simulation:', trackPlayerError);
        }
      } else {
        // Android: Use simulation (react-native-sound commented out for now)
        console.log('[AudioPlayer] Using audio simulation for Android');
      }
      
      this.isInitialized = true;
      console.log('[AudioPlayer] Audio player initialized successfully');
    } catch (error) {
      console.error('[AudioPlayer] Error initializing audio player:', error);
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
      
      if (Platform.OS === 'web' && this.audioElement) {
        // Web: Use HTML5 Audio
        try {
          this.audioElement.src = audioSource;
          this.audioElement.load();
          
          // Add event listeners
          this.audioElement.oncanplay = () => {
            console.log('[AudioPlayer] Audio can play, starting playback');
            this.audioElement.play().catch(error => {
              console.error('[AudioPlayer] Error playing audio:', error);
              this.fallbackToSimulation();
            });
          };
          
          this.audioElement.onerror = (error) => {
            console.error('[AudioPlayer] Audio error:', error);
            this.fallbackToSimulation();
          };
          
          this.audioElement.onended = () => {
            console.log('[AudioPlayer] Audio playback ended');
            this.isPlaying = false;
            this.currentAyah = null;
            this.stopHighlightingTimer();
            
            // Call the onEnded callback if set
            if (this.onEndedCallback) {
              this.onEndedCallback();
            }
          };
          
        } catch (error) {
          console.error('[AudioPlayer] Error with HTML5 Audio:', error);
          this.fallbackToSimulation();
        }
      } else if (Platform.OS === 'ios' && TrackPlayer && this.isInitialized && this.trackPlayerSetup) {
        // iOS: Use TrackPlayer
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
          console.log('[AudioPlayer] Started playing with TrackPlayer on iOS');
        } catch (error) {
          console.error('[AudioPlayer] Error with TrackPlayer on iOS:', error);
          // Fallback to simulation if TrackPlayer fails
          this.fallbackToSimulation();
        }
      } else {
        // Android: Use simulation (react-native-sound commented out for now)
        console.log('[AudioPlayer] Using audio simulation for Android');
        this.fallbackToSimulation();
      }
      
      // Start highlighting timer if metadata is provided
      if (metadata && metadata.words) {
        this.startHighlightingTimer();
      }
      
      console.log('[AudioPlayer] Audio playback started');
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
    // Simulate audio playback for fallback cases
    console.log('[AudioPlayer] Starting simulated audio playback');
    setTimeout(() => {
      console.log('[AudioPlayer] Simulated audio playback completed');
      this.isPlaying = false;
      this.currentAyah = null;
      this.stopHighlightingTimer();
      
      // Call the onEnded callback if set
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
    }, 5000); // Simulate 5 seconds of audio
  }

  async stopAudio() {
    try {
      if (this.isPlaying) {
        if (Platform.OS === 'web' && this.audioElement) {
          this.audioElement.pause();
          this.audioElement.currentTime = 0;
        } else if (Platform.OS === 'ios' && TrackPlayer && this.isInitialized && this.trackPlayerSetup) {
          try {
            await TrackPlayer.stop();
            await TrackPlayer.reset();
          } catch (trackPlayerError) {
            console.warn('[AudioPlayer] TrackPlayer not ready, using fallback stop');
          }
        } else if (this.currentSound) {
          this.currentSound.stop();
          this.currentSound.release();
          this.currentSound = null;
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

  async getPlaybackStatus() {
    try {
      if (Platform.OS === 'web' && this.audioElement) {
        return {
          isPlaying: !this.audioElement.paused && !this.audioElement.ended,
          isPaused: this.audioElement.paused,
          isStopped: this.audioElement.ended,
        };
      } else if (Platform.OS === 'ios' && TrackPlayer && this.isInitialized && this.trackPlayerSetup) {
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
      } else if (this.currentSound) {
        return {
          isPlaying: this.isPlaying,
          isPaused: false,
          isStopped: !this.isPlaying,
        };
      } else {
        return {
          isPlaying: this.isPlaying,
          isPaused: false,
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
      if (Platform.OS === 'web' && this.audioElement) {
        this.audioElement.pause();
      } else if (Platform.OS === 'ios' && TrackPlayer && this.isInitialized) {
        try {
          await TrackPlayer.pause();
        } catch (trackPlayerError) {
          console.warn('[AudioPlayer] TrackPlayer not ready, using fallback pause');
        }
      } else if (this.currentSound) {
        this.currentSound.pause();
      }
      console.log('[AudioPlayer] Audio paused');
    } catch (error) {
      console.error('[AudioPlayer] Error pausing audio:', error);
    }
  }

  async seekToStart() {
    try {
      if (Platform.OS === 'web' && this.audioElement) {
        this.audioElement.currentTime = 0;
      } else if (Platform.OS === 'ios' && TrackPlayer && this.isInitialized) {
        try {
          await TrackPlayer.seekTo(0);
        } catch (trackPlayerError) {
          console.warn('[AudioPlayer] TrackPlayer not ready, using fallback seek');
        }
      } else if (this.currentSound) {
        this.currentSound.setCurrentTime(0);
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

    // Add a small delay before starting highlighting to prevent glitch
    setTimeout(() => {
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
      }, 50); // Balanced frequency for smooth highlighting without excessive CPU usage
    }, 100); // Reduced delay for faster highlighting start
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

  // Set callback for when audio ends
  setOnEndedCallback(callback) {
    this.onEndedCallback = callback;
  }

  getCurrentTime() {
    if (Platform.OS === 'web' && this.audioElement) {
      return this.audioElement.currentTime;
    }
    if (this.currentSound && typeof this.currentSound.getCurrentTime === 'function') {
      try {
        const currentTime = this.currentSound.getCurrentTime();
        if (currentTime !== undefined && currentTime !== null) {
          return currentTime;
        }
      } catch (error) {
        console.warn('[AudioPlayer] Error getting current time from sound:', error);
      }
    }
    // Fallback to simulation only if we have a start time
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