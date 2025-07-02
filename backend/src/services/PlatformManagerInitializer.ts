import { logger } from '@/utils/logger';
import { platformManager } from './PlatformManager';
import { getWebSocketService } from './websocket';

/**
 * Initialize PlatformManager with WebSocket integration
 */
export async function initializePlatformManager(): Promise<void> {
  try {
    logger.info('Initializing PlatformManager...');
    
    // Get WebSocket service instance
    const webSocketService = getWebSocketService();
    
    // Initialize platform manager with WebSocket integration
    await platformManager.initialize();
    
    // Set up event listeners for WebSocket broadcasting
    setupPlatformEventBroadcasting(webSocketService);
    
    logger.info('PlatformManager initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize PlatformManager:', error);
    throw error;
  }
}

/**
 * Set up event listeners to broadcast platform events via WebSocket
 */
function setupPlatformEventBroadcasting(webSocketService: any): void {
  // Platform connection events
  platformManager.on('platform:connected', (data) => {
    webSocketService.broadcastToChannel('platform:connections', 'platform:connected', data);
    webSocketService.broadcastToUserChannel(data.userId, 'platform:connected', data);
    logger.debug(`Broadcasting platform:connected event for ${data.platform}`);
  });

  platformManager.on('platform:disconnected', (data) => {
    webSocketService.broadcastToChannel('platform:connections', 'platform:disconnected', data);
    webSocketService.broadcastToUserChannel(data.userId, 'platform:disconnected', data);
    logger.debug(`Broadcasting platform:disconnected event for ${data.platform}`);
  });

  platformManager.on('platform:error', (data) => {
    webSocketService.broadcastToChannel('platform:status', 'platform:error', data);
    if (data.userId) {
      webSocketService.broadcastToUserChannel(data.userId, 'platform:error', data);
    }
    logger.debug(`Broadcasting platform:error event for ${data.platform}`);
  });

  // Platform health check events
  platformManager.on('platform:health_check', (data) => {
    webSocketService.broadcastToChannel('platform:status', 'platform:health_check', data);
    logger.debug(`Broadcasting platform:health_check event for ${data.platform}`);
  });

  // Content events
  platformManager.on('content:received', (data) => {
    webSocketService.broadcastToChannel('content:updates', 'content:received', data);
    webSocketService.broadcastPlatformEvent(data.platform, 'content:received', data);
    logger.debug(`Broadcasting content:received event for ${data.platform}`);
  });

  platformManager.on('content:posted', (data) => {
    webSocketService.broadcastToChannel('content:updates', 'content:posted', data);
    webSocketService.broadcastToUserChannel(data.userId, 'content:posted', data);
    webSocketService.broadcastPlatformEvent(data.platform, 'content:posted', data);
    logger.debug(`Broadcasting content:posted event for ${data.platform}`);
  });

  // Rate limiting events
  platformManager.on('rate_limit:exceeded', (data) => {
    webSocketService.broadcastToChannel('platform:status', 'rate_limit:exceeded', data);
    webSocketService.broadcastPlatformEvent(data.platform, 'rate_limit:exceeded', data);
    logger.debug(`Broadcasting rate_limit:exceeded event for ${data.platform}`);
  });

  logger.info('Platform event broadcasting configured');
}

/**
 * Graceful shutdown of PlatformManager
 */
export async function shutdownPlatformManager(): Promise<void> {
  try {
    logger.info('Shutting down PlatformManager...');
    await platformManager.shutdown();
    logger.info('PlatformManager shutdown complete');
  } catch (error) {
    logger.error('Error during PlatformManager shutdown:', error);
    throw error;
  }
}

/**
 * Get platform manager health status
 */
export function getPlatformManagerHealth(): {
  isInitialized: boolean;
  connectedPlatforms: number;
  totalConnections: number;
  healthyPlatforms: number;
} {
  const statuses = platformManager.getAllPlatformStatuses();
  
  return {
    isInitialized: true,
    connectedPlatforms: Object.values(statuses).filter(status => status.isConnected).length,
    totalConnections: Object.values(statuses).reduce((sum, status) => sum + status.connectionCount, 0),
    healthyPlatforms: Object.values(statuses).filter(status => status.isHealthy).length,
  };
}

export { platformManager };