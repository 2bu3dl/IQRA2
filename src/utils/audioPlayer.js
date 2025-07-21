import { Platform } from 'react-native';
import TrackPlayer, { Event, State } from 'react-native-track-player';

class AudioPlayer {
  constructor() {
    this.currentSound = null;
    this.isPlaying = false;
    this.currentAyah = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
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
      this.isInitialized = true;
      console.log('[AudioPlayer] TrackPlayer initialized successfully');
    } catch (error) {
      console.error('[AudioPlayer] Error initializing TrackPlayer:', error);
    }
  }

  async playAudio(audioSource) {
    try {
      // Initialize if not already done
      await this.initialize();
      
      // Stop any currently playing audio
      await this.stopAudio();
      
      console.log('[AudioPlayer] Attempting to play:', audioSource);
      
      // Set playing state
      this.isPlaying = true;
      this.currentAyah = audioSource;
      
      // Add the track to the queue
      await TrackPlayer.add({
        id: 'ayah-audio',
        url: audioSource,
        title: 'Ayah Audio',
        artist: 'Quran Recitation',
      });
      
      // Play the track
      await TrackPlayer.play();
      
      console.log('[AudioPlayer] Audio playback started');
      
      // Set up event listener for completion
      TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async (event) => {
        if (event.nextTrack === null) {
          // Track finished
          console.log('[AudioPlayer] Audio playback completed');
          this.isPlaying = false;
          this.currentAyah = null;
        }
      });
      
      return true;
    } catch (error) {
      console.error('[AudioPlayer] Error playing audio:', error);
      this.isPlaying = false;
      this.currentAyah = null;
      return false;
    }
  }

  async stopAudio() {
    try {
      if (this.isPlaying) {
        await TrackPlayer.stop();
        await TrackPlayer.reset();
        this.isPlaying = false;
        this.currentAyah = null;
        console.log('[AudioPlayer] Audio stopped');
      }
    } catch (error) {
      console.error('[AudioPlayer] Error stopping audio:', error);
    }
  }

  async getStatus() {
    try {
      const state = await TrackPlayer.getState();
      return {
        isPlaying: state === State.Playing,
        currentAyah: this.currentAyah
      };
    } catch (error) {
      return {
        isPlaying: this.isPlaying,
        currentAyah: this.currentAyah
      };
    }
  }

  async pauseAudio() {
    try {
      const state = await TrackPlayer.getState();
      if (state === State.Playing) {
        await TrackPlayer.pause();
        this.isPlaying = false;
        console.log('[AudioPlayer] Audio paused');
      }
    } catch (error) {
      console.error('[AudioPlayer] Error pausing audio:', error);
    }
  }

  async seekToStart() {
    try {
      const state = await TrackPlayer.getState();
      if (state === State.Playing || state === State.Paused) {
        await TrackPlayer.seekTo(0);
        console.log('[AudioPlayer] Audio seeked to start');
      }
    } catch (error) {
      console.error('[AudioPlayer] Error seeking audio:', error);
    }
  }

  cleanup() {
    this.stopAudio();
    // Removed TrackPlayer.destroy() as it does not exist in v2
  }
}

export default new AudioPlayer(); 