import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { 
  SocialPlatform, 
  PlatformProfile, 
  SocialContent, 
  PlatformConnection,
  WebSocketMessage,
  WebSocketResponse 
} from '@/types';
import { BasePlatformService, PlatformCredentials, PlatformResponse } from './platforms/BasePlatformService';
import { FacebookService } from './platforms/FacebookService';
import { TwitterService } from './platforms/TwitterService';
import { LinkedInService } from './platforms/LinkedInService';
import { InstagramService } from './platforms/InstagramService';
import { RedditService } from './platforms/RedditService';
import { TelegramService } from './platforms/TelegramService';
import { DiscordService } from './platforms/DiscordService';
import { WebSocketService } from './websocket';

export interface PlatformStatus {
  platform: SocialPlatform;
  isConnected: boolean;
  isHealthy: boolean;
  lastHealthCheck: Date;
  connectionCount: number;
  errorCount: number;
  lastError?: string;
  rateLimit?: {
    remaining: number;
    resetTime: Date;
  };
  metadata?: Record<string, any>;
}

export interface PlatformManagerConfig {
  enableHealthChecks: boolean;
  healthCheckInterval: number; // in milliseconds
  enableRealTimeUpdates: boolean;
  maxRetries: number;
  retryDelay: number;
}

export interface ServiceRegistry {
  [key: string]: {
    service: BasePlatformService;
    status: PlatformStatus;
    connections: Map<string, PlatformConnection>;
    credentials: Map<string, PlatformCredentials>;
  };
}

export interface PlatformManagerEvents {
  'platform:connected': { platform: SocialPlatform; userId: string };
  'platform:disconnected': { platform: SocialPlatform; userId: string };
  'platform:error': { platform: SocialPlatform; error: string; userId?: string };
  'platform:health_check': { platform: SocialPlatform; status: PlatformStatus };
  'content:received': { platform: SocialPlatform; content: SocialContent };
  'content:posted': { platform: SocialPlatform; postId: string; userId: string };
  'rate_limit:exceeded': { platform: SocialPlatform; resetTime: Date };
}

export declare interface PlatformManager {
  on<U extends keyof PlatformManagerEvents>(
    event: U,
    listener: (data: PlatformManagerEvents[U]) => void
  ): this;

  emit<U extends keyof PlatformManagerEvents>(
    event: U,
    data: PlatformManagerEvents[U]
  ): boolean;
}

export class PlatformManager extends EventEmitter {
  private serviceRegistry: ServiceRegistry = {};
  private config: PlatformManagerConfig;
  private healthCheckInterval?: NodeJS.Timeout;
  private websocketService?: WebSocketService;
  private isInitialized = false;

  constructor(
    config: Partial<PlatformManagerConfig> = {},
    websocketService?: WebSocketService
  ) {
    super();
    
    this.config = {
      enableHealthChecks: true,
      healthCheckInterval: 60000, // 1 minute
      enableRealTimeUpdates: true,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };

    this.websocketService = websocketService;
    this.setupEventHandlers();
  }

  /**
   * Initialize the platform manager and register all platform services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('PlatformManager is already initialized');
      return;
    }

    try {
      logger.info('Initializing PlatformManager...');

      // Register all platform services
      await this.registerPlatformServices();

      // Start health checks
      if (this.config.enableHealthChecks) {
        this.startHealthChecks();
      }

      // Set up WebSocket event broadcasting
      if (this.websocketService && this.config.enableRealTimeUpdates) {
        this.setupWebSocketBroadcasting();
      }

      this.isInitialized = true;
      logger.info('PlatformManager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize PlatformManager:', error);
      throw error;
    }
  }

  /**
   * Register all platform services in the service registry
   */
  private async registerPlatformServices(): Promise<void> {
    const platforms = [
      { platform: SocialPlatform.FACEBOOK, service: new FacebookService() },
      { platform: SocialPlatform.TWITTER, service: new TwitterService() },
      { platform: SocialPlatform.LINKEDIN, service: new LinkedInService() },
      { platform: SocialPlatform.INSTAGRAM, service: new InstagramService() },
      { platform: SocialPlatform.REDDIT, service: new RedditService() },
      { platform: SocialPlatform.TELEGRAM, service: new TelegramService() },
      { platform: SocialPlatform.DISCORD, service: new DiscordService() },
    ];

    for (const { platform, service } of platforms) {
      await this.registerPlatformService(platform, service);
    }

    logger.info(`Registered ${platforms.length} platform services`);
  }

  /**
   * Register a single platform service
   */
  async registerPlatformService(
    platform: SocialPlatform,
    service: BasePlatformService
  ): Promise<void> {
    try {
      const status: PlatformStatus = {
        platform,
        isConnected: false,
        isHealthy: false,
        lastHealthCheck: new Date(),
        connectionCount: 0,
        errorCount: 0,
      };

      this.serviceRegistry[platform] = {
        service,
        status,
        connections: new Map(),
        credentials: new Map(),
      };

      logger.info(`Registered platform service: ${platform}`);
    } catch (error) {
      logger.error(`Failed to register platform service ${platform}:`, error);
      throw error;
    }
  }

  /**
   * Connect a user to a platform
   */
  async connectPlatform(
    userId: string,
    platform: SocialPlatform,
    credentials: PlatformCredentials,
    connection: PlatformConnection
  ): Promise<PlatformResponse<PlatformProfile>> {
    try {
      const registry = this.serviceRegistry[platform];
      if (!registry) {
        throw new Error(`Platform ${platform} is not registered`);
      }

      // Set credentials for the service
      registry.service.setCredentials(credentials);
      
      // Store connection and credentials
      registry.connections.set(userId, connection);
      registry.credentials.set(userId, credentials);

      // Test the connection by fetching profile
      const profileResponse = await registry.service.getProfile();
      
      if (profileResponse.success) {
        registry.status.isConnected = true;
        registry.status.connectionCount++;
        registry.status.lastHealthCheck = new Date();

        this.emit('platform:connected', { platform, userId });
        
        // Broadcast via WebSocket
        this.broadcastEvent('platform:connected', {
          platform,
          userId,
          profile: profileResponse.data,
        });

        logger.info(`User ${userId} connected to ${platform}`);
      } else {
        registry.status.errorCount++;
        registry.status.lastError = profileResponse.error;
        
        this.emit('platform:error', { 
          platform, 
          error: profileResponse.error || 'Connection failed',
          userId 
        });
      }

      return profileResponse;
    } catch (error) {
      logger.error(`Failed to connect user ${userId} to ${platform}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('platform:error', { platform, error: errorMessage, userId });
      
      return {
        success: false,
        error: errorMessage,
        platform,
      };
    }
  }

  /**
   * Disconnect a user from a platform
   */
  async disconnectPlatform(userId: string, platform: SocialPlatform): Promise<void> {
    try {
      const registry = this.serviceRegistry[platform];
      if (!registry) {
        throw new Error(`Platform ${platform} is not registered`);
      }

      // Remove connection and credentials
      registry.connections.delete(userId);
      registry.credentials.delete(userId);

      // Update status
      registry.status.connectionCount = Math.max(0, registry.status.connectionCount - 1);
      registry.status.isConnected = registry.status.connectionCount > 0;

      this.emit('platform:disconnected', { platform, userId });
      
      // Broadcast via WebSocket
      this.broadcastEvent('platform:disconnected', { platform, userId });

      logger.info(`User ${userId} disconnected from ${platform}`);
    } catch (error) {
      logger.error(`Failed to disconnect user ${userId} from ${platform}:`, error);
      throw error;
    }
  }

  /**
   * Get content from a platform for a specific user
   */
  async getContent(
    userId: string,
    platform: SocialPlatform,
    options?: any
  ): Promise<PlatformResponse<SocialContent[]>> {
    try {
      const registry = this.serviceRegistry[platform];
      if (!registry) {
        throw new Error(`Platform ${platform} is not registered`);
      }

      const credentials = registry.credentials.get(userId);
      if (!credentials) {
        throw new Error(`User ${userId} is not connected to ${platform}`);
      }

      // Set credentials for this request
      registry.service.setCredentials(credentials);

      // Get content
      const contentResponse = await registry.service.getContent(options);

      // Emit content received event for real-time updates
      if (contentResponse.success && contentResponse.data) {
        contentResponse.data.forEach(content => {
          this.emit('content:received', { platform, content });
        });
      }

      return contentResponse;
    } catch (error) {
      logger.error(`Failed to get content for user ${userId} from ${platform}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('platform:error', { platform, error: errorMessage, userId });
      
      return {
        success: false,
        error: errorMessage,
        platform,
      };
    }
  }

  /**
   * Post content to a platform for a specific user
   */
  async postContent(
    userId: string,
    platform: SocialPlatform,
    content: string,
    options?: any
  ): Promise<PlatformResponse<any>> {
    try {
      const registry = this.serviceRegistry[platform];
      if (!registry) {
        throw new Error(`Platform ${platform} is not registered`);
      }

      const credentials = registry.credentials.get(userId);
      if (!credentials) {
        throw new Error(`User ${userId} is not connected to ${platform}`);
      }

      // Set credentials for this request
      registry.service.setCredentials(credentials);

      // Post content
      const postResponse = await registry.service.postContent(content, options);

      if (postResponse.success) {
        this.emit('content:posted', { 
          platform, 
          postId: postResponse.data?.id || 'unknown',
          userId 
        });

        // Broadcast via WebSocket
        this.broadcastEvent('content:posted', {
          platform,
          userId,
          content,
          postId: postResponse.data?.id,
        });
      }

      return postResponse;
    } catch (error) {
      logger.error(`Failed to post content for user ${userId} to ${platform}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('platform:error', { platform, error: errorMessage, userId });
      
      return {
        success: false,
        error: errorMessage,
        platform,
      };
    }
  }

  /**
   * Search content on a platform for a specific user
   */
  async searchContent(
    userId: string,
    platform: SocialPlatform,
    query: string,
    options?: any
  ): Promise<PlatformResponse<SocialContent[]>> {
    try {
      const registry = this.serviceRegistry[platform];
      if (!registry) {
        throw new Error(`Platform ${platform} is not registered`);
      }

      const credentials = registry.credentials.get(userId);
      if (!credentials) {
        throw new Error(`User ${userId} is not connected to ${platform}`);
      }

      // Set credentials for this request
      registry.service.setCredentials(credentials);

      // Search content
      return await registry.service.searchContent(query, options);
    } catch (error) {
      logger.error(`Failed to search content for user ${userId} on ${platform}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('platform:error', { platform, error: errorMessage, userId });
      
      return {
        success: false,
        error: errorMessage,
        platform,
      };
    }
  }

  /**
   * Get platform status for all platforms
   */
  getAllPlatformStatuses(): Record<SocialPlatform, PlatformStatus> {
    const statuses: Record<string, PlatformStatus> = {};
    
    for (const [platform, registry] of Object.entries(this.serviceRegistry)) {
      statuses[platform] = { ...registry.status };
    }
    
    return statuses as Record<SocialPlatform, PlatformStatus>;
  }

  /**
   * Get platform status for a specific platform
   */
  getPlatformStatus(platform: SocialPlatform): PlatformStatus | null {
    const registry = this.serviceRegistry[platform];
    return registry ? { ...registry.status } : null;
  }

  /**
   * Get connected users for a platform
   */
  getConnectedUsers(platform: SocialPlatform): string[] {
    const registry = this.serviceRegistry[platform];
    return registry ? Array.from(registry.connections.keys()) : [];
  }

  /**
   * Check if a user is connected to a platform
   */
  isUserConnected(userId: string, platform: SocialPlatform): boolean {
    const registry = this.serviceRegistry[platform];
    return registry ? registry.connections.has(userId) : false;
  }

  /**
   * Start health checks for all platforms
   */
  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);

    logger.info('Health checks started');
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      logger.info('Health checks stopped');
    }
  }

  /**
   * Perform health checks on all connected platforms
   */
  private async performHealthChecks(): Promise<void> {
    const platforms = Object.keys(this.serviceRegistry) as SocialPlatform[];
    
    await Promise.allSettled(
      platforms.map(platform => this.performPlatformHealthCheck(platform))
    );
  }

  /**
   * Perform health check on a specific platform
   */
  private async performPlatformHealthCheck(platform: SocialPlatform): Promise<void> {
    try {
      const registry = this.serviceRegistry[platform];
      if (!registry || registry.connections.size === 0) {
        return; // Skip health check if no connections
      }

      // Use the first available user's credentials for health check
      const firstUserId = Array.from(registry.connections.keys())[0];
      const credentials = registry.credentials.get(firstUserId);
      
      if (!credentials) {
        return;
      }

      registry.service.setCredentials(credentials);
      
      // Try to get rate limit status as a light health check
      const rateLimitStatus = await registry.service.getRateLimitStatus();
      
      registry.status.isHealthy = true;
      registry.status.lastHealthCheck = new Date();
      registry.status.rateLimit = {
        remaining: rateLimitStatus.remaining,
        resetTime: rateLimitStatus.reset,
      };

      this.emit('platform:health_check', { platform, status: registry.status });
      
    } catch (error) {
      const registry = this.serviceRegistry[platform];
      if (registry) {
        registry.status.isHealthy = false;
        registry.status.errorCount++;
        registry.status.lastError = error instanceof Error ? error.message : 'Health check failed';
        registry.status.lastHealthCheck = new Date();

        this.emit('platform:health_check', { platform, status: registry.status });
        this.emit('platform:error', { 
          platform, 
          error: registry.status.lastError 
        });
      }

      logger.warn(`Health check failed for ${platform}:`, error);
    }
  }

  /**
   * Set up event handlers for internal events
   */
  private setupEventHandlers(): void {
    this.on('platform:error', (data) => {
      logger.warn(`Platform error on ${data.platform}:`, data.error);
    });

    this.on('rate_limit:exceeded', (data) => {
      logger.warn(`Rate limit exceeded on ${data.platform}, reset at ${data.resetTime}`);
    });
  }

  /**
   * Set up WebSocket broadcasting for real-time updates
   */
  private setupWebSocketBroadcasting(): void {
    if (!this.websocketService) {
      return;
    }

    // Broadcast platform events
    this.on('platform:connected', (data) => {
      this.broadcastEvent('platform:connected', data);
    });

    this.on('platform:disconnected', (data) => {
      this.broadcastEvent('platform:disconnected', data);
    });

    this.on('content:received', (data) => {
      this.broadcastEvent('content:received', data);
    });

    this.on('content:posted', (data) => {
      this.broadcastEvent('content:posted', data);
    });

    this.on('platform:health_check', (data) => {
      this.broadcastEvent('platform:health_check', data);
    });

    logger.info('WebSocket broadcasting configured');
  }

  /**
   * Broadcast event via WebSocket
   */
  private broadcastEvent(type: string, data: any): void {
    if (!this.websocketService) {
      return;
    }

    const message: WebSocketMessage = {
      type,
      payload: data,
      timestamp: new Date(),
    };

    this.websocketService.broadcast(message);
  }

  /**
   * Get service registry (for debugging/admin purposes)
   */
  getServiceRegistry(): ServiceRegistry {
    return { ...this.serviceRegistry };
  }

  /**
   * Shutdown the platform manager
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down PlatformManager...');
    
    this.stopHealthChecks();
    this.removeAllListeners();
    
    // Clear all connections and credentials
    for (const registry of Object.values(this.serviceRegistry)) {
      registry.connections.clear();
      registry.credentials.clear();
    }

    this.isInitialized = false;
    logger.info('PlatformManager shutdown complete');
  }
}

// Export singleton instance
export const platformManager = new PlatformManager();