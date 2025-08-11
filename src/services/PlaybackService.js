import TrackPlayer, { Event } from 'react-native-track-player';

export async function PlaybackService() {
  try {
    // Initialize track player if not already done
    await TrackPlayer.setupPlayer();
    
    // Add event listeners with error handling
    TrackPlayer.addEventListener(Event.RemotePlay, () => {
      try {
        TrackPlayer.play();
      } catch (error) {
        console.warn('[PlaybackService] Error handling RemotePlay:', error);
      }
    });
    
    TrackPlayer.addEventListener(Event.RemotePause, () => {
      try {
        TrackPlayer.pause();
      } catch (error) {
        console.warn('[PlaybackService] Error handling RemotePause:', error);
      }
    });
    
    TrackPlayer.addEventListener(Event.RemoteStop, () => {
      try {
        TrackPlayer.destroy();
      } catch (error) {
        console.warn('[PlaybackService] Error handling RemoteStop:', error);
      }
    });
    
    TrackPlayer.addEventListener(Event.RemoteNext, () => {
      try {
        TrackPlayer.skipToNext();
      } catch (error) {
        console.warn('[PlaybackService] Error handling RemoteNext:', error);
      }
    });
    
    TrackPlayer.addEventListener(Event.RemotePrevious, () => {
      try {
        TrackPlayer.skipToPrevious();
      } catch (error) {
        console.warn('[PlaybackService] Error handling RemotePrevious:', error);
      }
      });
    
    TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
      try {
        TrackPlayer.seekTo(event.position);
      } catch (error) {
        console.warn('[PlaybackService] Error handling RemoteSeek:', error);
      }
    });
    
    TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
      try {
        if (event.paused) {
          await TrackPlayer.pause();
        } else {
          await TrackPlayer.play();
        }
      } catch (error) {
        console.warn('[PlaybackService] Error handling RemoteDuck:', error);
      }
    });
    
    console.log('[PlaybackService] Track player service initialized successfully');
  } catch (error) {
    console.error('[PlaybackService] Failed to initialize track player service:', error);
  }
} 