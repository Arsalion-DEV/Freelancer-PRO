import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import config from '@/config';
import { logger, stream } from '@/utils/logger';
import Database from '@/database/connection';
import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { rateLimiterMiddleware } from '@/middleware/rateLimiter';
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/users';
import platformRoutes from '@/routes/platforms';
import jobRoutes from '@/routes/jobs';
import analyticsRoutes from '@/routes/analytics';
import complianceRoutes from '@/routes/compliance';
import { initializeWebSocket } from '@/services/websocket';
import { initializePlatformManager } from '@/services/PlatformManagerInitializer';

class Application {
  public app: express.Application;
  public server: any;
  public io!: SocketIOServer;
  
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.setupWebSocket();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupWebSocket(): void {
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.cors.origin,
        credentials: config.cors.credentials,
      },
    });
    
    initializeWebSocket(this.io);
  }

  private setupMiddleware(): void {
    // Security middleware
    if (config.security.helmetEnabled) {
      this.app.use(helmet());
    }

    // Trust proxy if enabled
    if (config.security.trustProxy) {
      this.app.set('trust proxy', 1);
    }

    // CORS
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use(morgan('combined', { stream }));

    // Rate limiting
    this.app.use(rateLimiterMiddleware);

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.env,
      });
    });
  }

  private setupRoutes(): void {
    const apiPrefix = config.apiPrefix;

    // API routes
    this.app.use(`${apiPrefix}/auth`, authRoutes);
    this.app.use(`${apiPrefix}/users`, userRoutes);
    this.app.use(`${apiPrefix}/platforms`, platformRoutes);
    this.app.use(`${apiPrefix}/jobs`, jobRoutes);
    this.app.use(`${apiPrefix}/analytics`, analyticsRoutes);
    this.app.use(`${apiPrefix}/compliance`, complianceRoutes);

    // API info endpoint
    this.app.get(apiPrefix, (req, res) => {
      res.json({
        name: 'Social Media Monitor API',
        version: '1.0.0',
        description: 'Backend API for Multi-Platform Social Media & Job Monitoring System',
        endpoints: {
          health: '/health',
          auth: `${apiPrefix}/auth`,
          users: `${apiPrefix}/users`,
          platforms: `${apiPrefix}/platforms`,
          jobs: `${apiPrefix}/jobs`,
          analytics: `${apiPrefix}/analytics`,
          compliance: `${apiPrefix}/compliance`,
        },
        documentation: `${apiPrefix}/docs`,
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await Database.connect();
      
      // Sync database models (only in development)
      if (config.env === 'development') {
        await Database.sync({ alter: true });
        logger.info('Database models synchronized');
      }

      // Start server
      this.server.listen(config.port, config.host, () => {
        logger.info(`Server started on ${config.host}:${config.port}`);
        logger.info(`Environment: ${config.env}`);
        logger.info(`API endpoints available at: http://${config.host}:${config.port}${config.apiPrefix}`);
      });

      // Handle graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      try {
        // Close server
        this.server.close(() => {
          logger.info('HTTP server closed');
        });

        // Close WebSocket
        this.io.close(() => {
          logger.info('WebSocket server closed');
        });

        // Close database connection
        await Database.disconnect();

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }
}

// Create and start application
const app = new Application();

if (require.main === module) {
  app.start().catch((error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}

export default app;