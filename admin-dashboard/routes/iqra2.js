const express = require('express');
const router = express.Router();
const { logger } = require('../services/logger');

// Store telemetry data in memory (in production, use a database)
let telemetryData = {
  events: [],
  devices: new Map(),
  sessions: new Map(),
  stats: {
    totalEvents: 0,
    totalSessions: 0,
    totalDevices: 0,
    lastEvent: null,
  }
};

// Telemetry endpoint for IQRA2 app
router.post('/telemetry', async (req, res) => {
  try {
    const { events, deviceInfo, sessionId } = req.body;
    
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid events data' });
    }

    // Process events
    events.forEach(event => {
      // Add to events array
      telemetryData.events.push({
        ...event,
        receivedAt: new Date().toISOString(),
      });

      // Track device
      if (deviceInfo && deviceInfo.deviceId) {
        telemetryData.devices.set(deviceInfo.deviceId, {
          ...deviceInfo,
          lastSeen: new Date().toISOString(),
          eventCount: (telemetryData.devices.get(deviceInfo.deviceId)?.eventCount || 0) + 1,
        });
      }

      // Track session
      if (sessionId) {
        const session = telemetryData.sessions.get(sessionId) || {
          sessionId,
          deviceId: deviceInfo?.deviceId,
          startTime: new Date().toISOString(),
          events: [],
        };
        session.events.push(event);
        session.lastActivity = new Date().toISOString();
        telemetryData.sessions.set(sessionId, session);
      }
    });

    // Update stats
    telemetryData.stats.totalEvents += events.length;
    telemetryData.stats.lastEvent = new Date().toISOString();
    telemetryData.stats.totalDevices = telemetryData.devices.size;
    telemetryData.stats.totalSessions = telemetryData.sessions.size;

    logger.info(`Received ${events.length} telemetry events from device ${deviceInfo?.deviceId || 'unknown'}`);

    res.json({ 
      success: true, 
      received: events.length,
      stats: telemetryData.stats
    });

  } catch (error) {
    logger.error('Telemetry endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get telemetry data
router.get('/telemetry', (req, res) => {
  try {
    const { limit = 100, deviceId, sessionId, eventType } = req.query;

    let filteredEvents = telemetryData.events;

    // Filter by device
    if (deviceId) {
      filteredEvents = filteredEvents.filter(event => 
        event.deviceInfo?.deviceId === deviceId
      );
    }

    // Filter by session
    if (sessionId) {
      filteredEvents = filteredEvents.filter(event => 
        event.sessionId === sessionId
      );
    }

    // Filter by event type
    if (eventType) {
      filteredEvents = filteredEvents.filter(event => 
        event.eventName === eventType
      );
    }

    // Limit results
    filteredEvents = filteredEvents.slice(-parseInt(limit));

    res.json({
      success: true,
      data: {
        events: filteredEvents,
        stats: telemetryData.stats,
        devices: Array.from(telemetryData.devices.values()),
        sessions: Array.from(telemetryData.sessions.values()).slice(-20), // Last 20 sessions
      }
    });

  } catch (error) {
    logger.error('Get telemetry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get IQRA2 app metrics
router.get('/metrics', (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Filter recent events
    const recentEvents = telemetryData.events.filter(event => 
      new Date(event.timestamp) > oneHourAgo
    );

    const dailyEvents = telemetryData.events.filter(event => 
      new Date(event.timestamp) > oneDayAgo
    );

    // Calculate metrics
    const metrics = {
      activeDevices: telemetryData.devices.size,
      activeSessions: telemetryData.sessions.size,
      eventsLastHour: recentEvents.length,
      eventsLastDay: dailyEvents.length,
      totalEvents: telemetryData.stats.totalEvents,
      
      // Event breakdown
      eventTypes: recentEvents.reduce((acc, event) => {
        acc[event.eventName] = (acc[event.eventName] || 0) + 1;
        return acc;
      }, {}),

      // Device breakdown
      deviceTypes: Array.from(telemetryData.devices.values()).reduce((acc, device) => {
        const type = device.isTablet ? 'tablet' : 'phone';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),

      // Platform breakdown
      platforms: Array.from(telemetryData.devices.values()).reduce((acc, device) => {
        acc[device.systemName] = (acc[device.systemName] || 0) + 1;
        return acc;
      }, {}),

      // Recent activity
      recentActivity: recentEvents.slice(-10).map(event => ({
        eventName: event.eventName,
        timestamp: event.timestamp,
        deviceId: event.deviceInfo?.deviceId,
        data: event.data,
      })),
    };

    res.json({
      success: true,
      data: metrics,
      timestamp: now.toISOString(),
    });

  } catch (error) {
    logger.error('Get IQRA2 metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get device details
router.get('/devices/:deviceId', (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = telemetryData.devices.get(deviceId);

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Get events for this device
    const deviceEvents = telemetryData.events.filter(event => 
      event.deviceInfo?.deviceId === deviceId
    );

    res.json({
      success: true,
      data: {
        device,
        events: deviceEvents.slice(-50), // Last 50 events
        eventCount: deviceEvents.length,
      }
    });

  } catch (error) {
    logger.error('Get device details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session details
router.get('/sessions/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = telemetryData.sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      data: session,
    });

  } catch (error) {
    logger.error('Get session details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 