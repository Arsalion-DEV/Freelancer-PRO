import { Request, Response } from 'express';
import { logger } from '@/utils/logger';
import { platformManager } from '@/services/PlatformManager';
import { SocialPlatform, APIResponse, PaginationParams } from '@/types';
import PlatformConnection from '@/models/PlatformConnection';
import User from '@/models/User';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Get all platform statuses
 */
export const getPlatformStatuses = async (req: Request, res: Response): Promise<void> => {
  try {
    const statuses = platformManager.getAllPlatformStatuses();
    
    const response: APIResponse = {
      success: true,
      data: statuses,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get platform statuses:', error);
    
    const response: APIResponse = {
      success: false,
      error: 'Failed to get platform statuses',
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
  }
};

/**
 * Get status for a specific platform
 */
export const getPlatformStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { platform } = req.params;
    
    if (!Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
      const response: APIResponse = {
        success: false,
        error: 'Invalid platform',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    const status = platformManager.getPlatformStatus(platform as SocialPlatform);
    
    if (!status) {
      const response: APIResponse = {
        success: false,
        error: 'Platform not found',
        timestamp: new Date().toISOString(),
      };
      res.status(404).json(response);
      return;
    }

    const response: APIResponse = {
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get platform status:', error);
    
    const response: APIResponse = {
      success: false,
      error: 'Failed to get platform status',
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
  }
};

/**
 * Connect user to a platform
 */
export const connectPlatform = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { platform } = req.params;
    const { accessToken, refreshToken, expiresAt } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      const response: APIResponse = {
        success: false,
        error: 'User not authenticated',
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    if (!Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
      const response: APIResponse = {
        success: false,
        error: 'Invalid platform',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    if (!accessToken) {
      const response: APIResponse = {
        success: false,
        error: 'Access token is required',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    // Create platform connection record
    const platformConnection = await PlatformConnection.create({
      userId,
      platform: platform as SocialPlatform,
      platformUserId: '', // Will be populated after successful connection
      platformUsername: '', // Will be populated after successful connection
      accessToken,
      refreshToken,
      tokenExpiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive: true,
      permissions: [],
      connectedAt: new Date(),
      metadata: {},
    });

    // Prepare credentials for platform manager
    const credentials = {
      accessToken,
      refreshToken,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    };

    // Connect via platform manager
    const connectionResult = await platformManager.connectPlatform(
      userId,
      platform as SocialPlatform,
      credentials,
      platformConnection.toJSON()
    );

    if (connectionResult.success && connectionResult.data) {
      // Update platform connection with profile data
      await platformConnection.update({
        platformUserId: connectionResult.data.platformUserId,
        platformUsername: connectionResult.data.username,
        lastSyncAt: new Date(),
      });

      const response: APIResponse = {
        success: true,
        data: {
          connection: platformConnection.toJSON(),
          profile: connectionResult.data,
        },
        message: 'Platform connected successfully',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } else {
      // Delete the connection record if connection failed
      await platformConnection.destroy();

      const response: APIResponse = {
        success: false,
        error: connectionResult.error || 'Failed to connect platform',
        timestamp: new Date().toISOString(),
      };

      res.status(400).json(response);
    }
  } catch (error) {
    logger.error('Failed to connect platform:', error);
    
    const response: APIResponse = {
      success: false,
      error: 'Failed to connect platform',
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
  }
};

/**
 * Disconnect user from a platform
 */
export const disconnectPlatform = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { platform } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      const response: APIResponse = {
        success: false,
        error: 'User not authenticated',
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    if (!Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
      const response: APIResponse = {
        success: false,
        error: 'Invalid platform',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    // Find and deactivate platform connection
    const platformConnection = await PlatformConnection.findOne({
      where: {
        userId,
        platform: platform as SocialPlatform,
        isActive: true,
      },
    });

    if (platformConnection) {
      await platformConnection.update({ isActive: false });
    }

    // Disconnect via platform manager
    await platformManager.disconnectPlatform(userId, platform as SocialPlatform);

    const response: APIResponse = {
      success: true,
      message: 'Platform disconnected successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to disconnect platform:', error);
    
    const response: APIResponse = {
      success: false,
      error: 'Failed to disconnect platform',
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
  }
};

/**
 * Get user's connected platforms
 */
export const getUserConnections = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      const response: APIResponse = {
        success: false,
        error: 'User not authenticated',
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    const connections = await PlatformConnection.findAll({
      where: {
        userId,
        isActive: true,
      },
      attributes: [
        'id',
        'platform',
        'platformUserId',
        'platformUsername',
        'connectedAt',
        'lastSyncAt',
        'metadata',
      ],
    });

    // Add connection status from platform manager
    const connectionsWithStatus = connections.map(connection => {
      const isConnected = platformManager.isUserConnected(userId, connection.platform);
      const platformStatus = platformManager.getPlatformStatus(connection.platform);
      
      return {
        ...connection.toJSON(),
        isConnected,
        platformHealth: platformStatus?.isHealthy || false,
      };
    });

    const response: APIResponse = {
      success: true,
      data: connectionsWithStatus,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get user connections:', error);
    
    const response: APIResponse = {
      success: false,
      error: 'Failed to get user connections',
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
  }
};

/**
 * Get content from a platform
 */
export const getPlatformContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { platform } = req.params;
    const userId = req.user?.id;
    const { limit = 25, since, until, ...options } = req.query;

    if (!userId) {
      const response: APIResponse = {
        success: false,
        error: 'User not authenticated',
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    if (!Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
      const response: APIResponse = {
        success: false,
        error: 'Invalid platform',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    // Check if user is connected to platform
    if (!platformManager.isUserConnected(userId, platform as SocialPlatform)) {
      const response: APIResponse = {
        success: false,
        error: 'User not connected to platform',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    const contentOptions = {
      limit: Math.min(parseInt(limit as string) || 25, 100),
      since: since ? new Date(since as string) : undefined,
      until: until ? new Date(until as string) : undefined,
      ...options,
    };

    const contentResult = await platformManager.getContent(
      userId,
      platform as SocialPlatform,
      contentOptions
    );

    if (contentResult.success) {
      const response: APIResponse = {
        success: true,
        data: contentResult.data,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } else {
      const response: APIResponse = {
        success: false,
        error: contentResult.error || 'Failed to get content',
        timestamp: new Date().toISOString(),
      };

      res.status(400).json(response);
    }
  } catch (error) {
    logger.error('Failed to get platform content:', error);
    
    const response: APIResponse = {
      success: false,
      error: 'Failed to get platform content',
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
  }
};

/**
 * Post content to a platform
 */
export const postPlatformContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { platform } = req.params;
    const { content, ...options } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      const response: APIResponse = {
        success: false,
        error: 'User not authenticated',
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    if (!Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
      const response: APIResponse = {
        success: false,
        error: 'Invalid platform',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    if (!content || typeof content !== 'string') {
      const response: APIResponse = {
        success: false,
        error: 'Content is required',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    // Check if user is connected to platform
    if (!platformManager.isUserConnected(userId, platform as SocialPlatform)) {
      const response: APIResponse = {
        success: false,
        error: 'User not connected to platform',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    const postResult = await platformManager.postContent(
      userId,
      platform as SocialPlatform,
      content,
      options
    );

    if (postResult.success) {
      const response: APIResponse = {
        success: true,
        data: postResult.data,
        message: 'Content posted successfully',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } else {
      const response: APIResponse = {
        success: false,
        error: postResult.error || 'Failed to post content',
        timestamp: new Date().toISOString(),
      };

      res.status(400).json(response);
    }
  } catch (error) {
    logger.error('Failed to post platform content:', error);
    
    const response: APIResponse = {
      success: false,
      error: 'Failed to post platform content',
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
  }
};

/**
 * Search content on a platform
 */
export const searchPlatformContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { platform } = req.params;
    const { query, limit = 25, ...options } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      const response: APIResponse = {
        success: false,
        error: 'User not authenticated',
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    if (!Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
      const response: APIResponse = {
        success: false,
        error: 'Invalid platform',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    if (!query || typeof query !== 'string') {
      const response: APIResponse = {
        success: false,
        error: 'Search query is required',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    // Check if user is connected to platform
    if (!platformManager.isUserConnected(userId, platform as SocialPlatform)) {
      const response: APIResponse = {
        success: false,
        error: 'User not connected to platform',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    const searchOptions = {
      limit: Math.min(parseInt(limit as string) || 25, 100),
      ...options,
    };

    const searchResult = await platformManager.searchContent(
      userId,
      platform as SocialPlatform,
      query,
      searchOptions
    );

    if (searchResult.success) {
      const response: APIResponse = {
        success: true,
        data: searchResult.data,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } else {
      const response: APIResponse = {
        success: false,
        error: searchResult.error || 'Failed to search content',
        timestamp: new Date().toISOString(),
      };

      res.status(400).json(response);
    }
  } catch (error) {
    logger.error('Failed to search platform content:', error);
    
    const response: APIResponse = {
      success: false,
      error: 'Failed to search platform content',
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
  }
};

/**
 * Get platform analytics/insights
 */
export const getPlatformAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      const response: APIResponse = {
        success: false,
        error: 'User not authenticated',
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    // Get analytics data from platform manager
    const allStatuses = platformManager.getAllPlatformStatuses();
    const userConnections = await PlatformConnection.findAll({
      where: { userId, isActive: true },
      attributes: ['platform', 'connectedAt', 'lastSyncAt'],
    });

    const analytics = {
      totalConnections: userConnections.length,
      activeConnections: Object.values(allStatuses).filter(status => status.isConnected).length,
      healthyConnections: Object.values(allStatuses).filter(status => status.isHealthy).length,
      platforms: Object.entries(allStatuses).map(([platform, status]) => ({
        platform,
        isConnected: platformManager.isUserConnected(userId, platform as SocialPlatform),
        isHealthy: status.isHealthy,
        connectionCount: status.connectionCount,
        errorCount: status.errorCount,
        lastHealthCheck: status.lastHealthCheck,
        rateLimit: status.rateLimit,
      })),
      connections: userConnections.map(conn => ({
        platform: conn.platform,
        connectedAt: conn.connectedAt,
        lastSyncAt: conn.lastSyncAt,
        isActive: platformManager.isUserConnected(userId, conn.platform),
      })),
    };

    const response: APIResponse = {
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get platform analytics:', error);
    
    const response: APIResponse = {
      success: false,
      error: 'Failed to get platform analytics',
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
  }
};