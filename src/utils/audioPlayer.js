import { Platform } from 'react-native';

// Platform-specific imports
let TrackPlayer, Event, State;
let Sound;

if (Platform.OS === 'ios') {
  // iOS: Use react-native-track-player (if available) or built-in audio
  try {
    const trackPlayerModule = require('react-native-track-player');
    TrackPlayer = trackPlayerModule.default;
    Event = trackPlayerModule.Event;
    State = trackPlayerModule.State;
  } catch (error) {
    console.warn('[AudioPlayer] react-native-track-player not available on iOS, using built-in audio');
  }
} else {
  // Android: Use react-native-sound
  try {
    Sound = require('react-native-sound').default;
  } catch (error) {
    console.warn('[AudioPlayer] react-native-sound not available on Android');
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
      if (Platform.OS === 'ios' && TrackPlayer) {
        // iOS: Initialize TrackPlayer with proper error handling
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
          console.warn('[AudioPlayer] TrackPlayer initialization failed, falling back to basic audio:', trackPlayerError);
          // Mark as initialized to prevent retry attempts
          this.isInitialized = true;
          return;
        }
      } else if (Platform.OS === 'android' && Sound) {
        // Android: Initialize Sound
        Sound.setCategory('Playback');
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
      
      // For Android, react-native-sound can handle require() results (numbers)
      // For iOS, we'll use a fallback approach since TrackPlayer expects URLs
      // but require() returns numbers
      
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
      
      if (Platform.OS === 'ios' && TrackPlayer && this.isInitialized) {
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
          console.error('[AudioPlayer] Error with TrackPlayer:', error);
          // Fallback to simulation if TrackPlayer fails
          setTimeout(() => {
            console.log('[AudioPlayer] Simulated audio playback completed for iOS');
            this.isPlaying = false;
            this.currentAyah = null;
            this.stopHighlightingTimer();
          }, 5000);
        }
      } else if (Platform.OS === 'android' && Sound) {
        // Android: Use Sound
        // For Android, we need to use the require() result directly
        // react-native-sound can handle module IDs from require()
        this.currentSound = new Sound(audioSource, (error) => {
          if (error) {
            console.error('[AudioPlayer] Error loading sound:', error);
            this.isPlaying = false;
            this.currentAyah = null;
            return;
          }
          
          this.currentSound.play((success) => {
            if (success) {
              console.log('[AudioPlayer] Audio playback completed');
            } else {
              console.error('[AudioPlayer] Playback failed');
            }
            this.isPlaying = false;
            this.currentAyah = null;
            this.stopHighlightingTimer();
          });
        });
      } else {
        // Fallback: Just simulate audio for now
        console.warn('[AudioPlayer] No audio library available, simulating playback');
        setTimeout(() => {
          console.log('[AudioPlayer] Simulated audio playback completed');
          this.isPlaying = false;
          this.currentAyah = null;
          this.stopHighlightingTimer();
        }, 5000); // Simulate 5 seconds of audio
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

  async stopAudio() {
    try {
      if (this.isPlaying) {
        if (Platform.OS === 'ios' && TrackPlayer && this.isInitialized) {
          try {
            await TrackPlayer.stop();
            await TrackPlayer.reset();
          } catch (trackPlayerError) {
            console.warn('[AudioPlayer] TrackPlayer not ready, using fallback stop');
          }
        } else if (Platform.OS === 'android' && this.currentSound) {
          this.currentSound.stop();
          this.currentSound.release();
          this.currentSound = null;
        }
        
        this.isPlaying = false;
        console.log('[AudioPlayer] Audio stopped');
      }
    } catch (error) {
      console.error('[AudioPlayer] Error stopping audio:', error);
    }
  }

  async getStatus() {
    try {
      if (Platform.OS === 'ios' && TrackPlayer && this.isInitialized) {
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
      if (Platform.OS === 'ios' && TrackPlayer && this.isInitialized) {
        try {
          await TrackPlayer.pause();
        } catch (trackPlayerError) {
          console.warn('[AudioPlayer] TrackPlayer not ready, using fallback pause');
        }
      } else if (Platform.OS === 'android' && this.currentSound && this.isPlaying) {
        this.currentSound.pause();
      }
      console.log('[AudioPlayer] Audio paused');
    } catch (error) {
      console.error('[AudioPlayer] Error pausing audio:', error);
    }
  }

  async seekToStart() {
    try {
      if (Platform.OS === 'ios' && TrackPlayer && this.isInitialized) {
        try {
          await TrackPlayer.seekTo(0);
        } catch (trackPlayerError) {
          console.warn('[AudioPlayer] TrackPlayer not ready, using fallback seek');
        }
      } else if (Platform.OS === 'android' && this.currentSound) {
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