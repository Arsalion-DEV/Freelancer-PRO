import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '@/utils/logger';
import { WebSocketMessage, WebSocketResponse } from '@/types';

export class WebSocketService {
  private io: SocketIOServer;
  private connectedClients: Map<string, Socket> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);
      this.connectedClients.set(socket.id, socket);

      // Handle authentication
      socket.on('authenticate', (data: { token: string }) => {
        // TODO: Implement JWT token verification
        logger.info(`Client ${socket.id} authenticated`);
        socket.join('authenticated');
      });

      // Handle dashboard subscriptions
      socket.on('subscribe', (data: { channels: string[] }) => {
        data.channels.forEach(channel => {
          socket.join(channel);
          logger.info(`Client ${socket.id} subscribed to ${channel}`);
        });
      });

      // Handle unsubscribe
      socket.on('unsubscribe', (data: { channels: string[] }) => {
        data.channels.forEach(channel => {
          socket.leave(channel);
          logger.info(`Client ${socket.id} unsubscribed from ${channel}`);
        });
      });

      // Handle disconnection
      socket.on('disconnect', (reason: string) => {
        logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
        this.connectedClients.delete(socket.id);
      });

      // Handle errors
      socket.on('error', (error: Error) => {
        logger.error(`Socket error for client ${socket.id}:`, error);
      });
    });
  }

  // Broadcast to all connected clients
  public broadcast(event: string, data: any): void {
    this.io.emit(event, {
      type: event,
      data,
      timestamp: new Date(),
    });
  }

  // Send to specific channel/room
  public sendToChannel(channel: string, event: string, data: any): void {
    this.io.to(channel).emit(event, {
      type: event,
      data,
      timestamp: new Date(),
    });
  }

  // Send to specific client
  public sendToClient(clientId: string, event: string, data: any): void {
    const socket = this.connectedClients.get(clientId);
    if (socket) {
      socket.emit(event, {
        type: event,
        data,
        timestamp: new Date(),
      });
    }
  }

  // Get connected clients count
  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Get connected clients in a room
  public getClientsInRoom(room: string): Promise<string[]> {
    return new Promise((resolve) => {
      this.io.in(room).allSockets().then((sockets) => {
        resolve(Array.from(sockets));
      });
    });
  }
}

let webSocketService: WebSocketService;

export const initializeWebSocket = (io: SocketIOServer): WebSocketService => {
  webSocketService = new WebSocketService(io);
  return webSocketService;
};

export const getWebSocketService = (): WebSocketService => {
  if (!webSocketService) {
    throw new Error('WebSocket service not initialized');
  }
  return webSocketService;
};

// Real-time event types
export enum WebSocketEvent {
  // Job monitoring events
  NEW_JOB = 'new_job',
  JOB_MATCH = 'job_match',
  JOB_APPLIED = 'job_applied',
  
  // Platform events
  PLATFORM_CONNECTED = 'platform_connected',
  PLATFORM_DISCONNECTED = 'platform_disconnected',
  PLATFORM_ERROR = 'platform_error',
  
  // Content events
  NEW_CONTENT = 'new_content',
  CONTENT_FLAGGED = 'content_flagged',
  
  // Compliance events
  COMPLIANCE_VIOLATION = 'compliance_violation',
  SECURITY_ALERT = 'security_alert',
  
  // Analytics events
  METRICS_UPDATE = 'metrics_update',
  CAMPAIGN_UPDATE = 'campaign_update',
  
  // System events
  SYSTEM_NOTIFICATION = 'system_notification',
  USER_NOTIFICATION = 'user_notification',
}