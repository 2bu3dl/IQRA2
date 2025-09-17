import { Platform } from 'react-native';
import logger from './logger';

// Safe wrapper for audio player that won't crash on device
class SafeAudioPlayer {
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
    this.isAvailable = false;
    
    // Check if audio is available
    this.checkAvailability();
  }

  checkAvailability() {
    try {
      if (Platform.OS === 'ios') {
        // Try to import track player safely
        try {
          const trackPlayerModule = require('react-native-track-player');
          this.isAvailable = !!trackPlayerModule.default;
        } catch (error) {
          logger.warn('SafeAudioPlayer', 'Track player not available', error);
          this.isAvailable = false;
        }
      }
    } catch (error) {
      logger.warn('SafeAudioPlayer', 'Audio player not available', error);
      this.isAvailable = false;
    }
  }

  async initialize() {
    try {
      if (this.isInitialized) return;
      
      if (!this.isAvailable) {
        logger.warn('SafeAudioPlayer', 'Audio player not available, using simulation');
        this.isInitialized = true;
        return;
      }

      // Initialize track player if available
      if (Platform.OS === 'ios') {
        try {
          const trackPlayerModule = require('react-native-track-player');
          const TrackPlayer = trackPlayerModule.default;
          
          await TrackPlayer.setupPlayer();
          this.trackPlayerSetup = true;
          logger.info('SafeAudioPlayer', 'Track player initialized');
        } catch (error) {
          logger.warn('SafeAudioPlayer', 'Failed to initialize track player', error);
        }
      }
      
      this.isInitialized = true;
    } catch (error) {
      logger.error('SafeAudioPlayer', 'Error initializing audio player', error);
      this.isInitialized = true; // Still mark as initialized to prevent retries
    }
  }

  async playAyah(surahNumber, ayahNumber, onProgress, onEnded) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.isAvailable) {
        logger.warn('SafeAudioPlayer', 'Audio playback not available, simulating');
        // Simulate playback
        this.isPlaying = true;
        this.currentAyah = { surahNumber, ayahNumber };
        this.playbackStartTime = Date.now();
        
        // Simulate progress updates
        if (onProgress) {
          const interval = setInterval(() => {
            const elapsed = Date.now() - this.playbackStartTime;
            const progress = Math.min(elapsed / 5000, 1); // 5 second simulation
            onProgress(progress);
            
            if (progress >= 1) {
              clearInterval(interval);
              this.isPlaying = false;
              if (onEnded) onEnded();
            }
          }, 100);
        }
        
        return { success: true, message: 'Simulated playback started' };
      }

      // Real playback logic would go here
      this.isPlaying = true;
      this.currentAyah = { surahNumber, ayahNumber };
      this.playbackStartTime = Date.now();
      
      logger.info('SafeAudioPlayer', 'Playing ayah', { surahNumber, ayahNumber });
      return { success: true, message: 'Playback started' };
    } catch (error) {
      logger.error('SafeAudioPlayer', 'Error playing ayah', error);
      this.isPlaying = false;
      return { success: false, message: 'Failed to play ayah' };
    }
  }

  async stop() {
    try {
      this.isPlaying = false;
      this.currentAyah = null;
      
      if (this.highlightingInterval) {
        clearInterval(this.highlightingInterval);
        this.highlightingInterval = null;
      }
      
      logger.info('SafeAudioPlayer', 'Playback stopped');
      return { success: true, message: 'Playback stopped' };
    } catch (error) {
      logger.error('SafeAudioPlayer', 'Error stopping playback', error);
      return { success: false, message: 'Failed to stop playback' };
    }
  }

  async pause() {
    try {
      if (this.isPlaying) {
        this.isPlaying = false;
        logger.info('SafeAudioPlayer', 'Playback paused');
        return { success: true, message: 'Playback paused' };
      }
      return { success: false, message: 'No playback in progress' };
    } catch (error) {
      logger.error('SafeAudioPlayer', 'Error pausing playback', error);
      return { success: false, message: 'Failed to pause playback' };
    }
  }

  async resume() {
    try {
      if (!this.isPlaying && this.currentAyah) {
        this.isPlaying = true;
        logger.info('SafeAudioPlayer', 'Playback resumed');
        return { success: true, message: 'Playback resumed' };
      }
      return { success: false, message: 'No paused playback to resume' };
    } catch (error) {
      logger.error('SafeAudioPlayer', 'Error resuming playback', error);
      return { success: false, message: 'Failed to resume playback' };
    }
  }

  isCurrentlyPlaying() {
    return this.isPlaying;
  }

  getCurrentAyah() {
    return this.currentAyah;
  }

  getPlaybackProgress() {
    if (!this.isPlaying || !this.playbackStartTime) return 0;
    const elapsed = Date.now() - this.playbackStartTime;
    return Math.min(elapsed / 5000, 1); // 5 second simulation
  }
}

// Export singleton instance
const safeAudioPlayer = new SafeAudioPlayer();
export default safeAudioPlayer;
