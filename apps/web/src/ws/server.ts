import { WebSocketServer, WebSocket, type RawData } from 'ws';
import { createServer } from 'http';
import { logger } from '@herafino/shared/logger/factory';
import { verifyToken } from '@herafino/shared/auth/options';
import { valkey } from '@herafino/shared/valkey/client';

// ─── Types ───────────────────────────────────────────────────────────────────

export type WSMessage = {
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
};

export type AuthenticatedClient = {
  id: string;
  userId: string;
  role: 'client' | 'craftsman' | 'admin' | 'super_admin';
  ws: WebSocket;
  rooms: Set<string>;
  isAlive: boolean;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10);
const PING_INTERVAL_MS = 30_000;
const MAX_PAYLOAD_BYTES = 64 * 1024;

// ─── Server ──────────────────────────────────────────────────────────────────

export class HarfinoWebSocketServer {
  private wss: WebSocketServer;
  private server: ReturnType<typeof createServer>;
  private clients = new Map<string, AuthenticatedClient>();
  private rooms: Map<string, Set<string>> = new Map(); // room -> Set<clientId>
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private valkeySubscriber: ReturnType<typeof valkey.duplicate> | null = null;
  private isShuttingDown = false;

  constructor() {
    this.server = createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('WebSocket server running');
    });

    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('error', (err: Error) => {
      logger.error({ component: 'ws-server', error: err.message }, 'WSS error');
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(WS_PORT, () => {
        logger.info({ port: WS_PORT }, 'WS server listening');
        this.startHeartbeat();
        void this.setupValkeySubscriber();
        resolve();
      });

      this.server.on('error', (err: Error) => {
        logger.error({ component: 'ws-server', error: err.message }, 'WS server failed');
        reject(err);
      });
    });
  }

  async stop(): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    logger.info({ component: 'ws-server' }, 'Stopping WS server...');

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.valkeySubscriber) {
      await this.valkeySubscriber.quit();
    }

    const closes: Promise<void>[] = [];
    this.clients.forEach((client) => {
      closes.push(
        new Promise((resolve) => {
          client.ws.close(1001, 'Server shutting down');
          client.ws.once('close', () => resolve());
          setTimeout(resolve, 1000);
        })
      );
    });

    await Promise.all(closes);
    await new Promise<void>((resolve) => this.wss.close(() => resolve()));
    await new Promise<void>((resolve) => this.server.close(() => resolve()));

    this.clients.clear();
    this.rooms.clear();

    logger.info({ component: 'ws-server' }, 'WS server stopped');
  }

  // ─── Connection ────────────────────────────────────────────────────────────

  private handleConnection(ws: WebSocket, _req: import('http').IncomingMessage): void {
    const clientId = crypto.randomUUID();

    ws.on('message', (data: RawData) => {
      void this.handleMessage(clientId, data);
    });

    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.isAlive = true;
      }
    });

    ws.on('close', () => {
      const client = this.clients.get(clientId);
      if (client) {
        this.removeClient(client);
        logger.info({ component: 'ws-server', userId: client.userId }, 'Client disconnected');
      }
    });

    ws.on('error', (err: Error) => {
      logger.error({ component: 'ws-server', clientId, error: err.message }, 'WS error');
    });

    this.send(ws, {
      type: 'auth:challenge',
      payload: { message: 'Send auth token as first message' },
      timestamp: Date.now(),
    });
  }

  // ─── Message Router ────────────────────────────────────────────────────────

  private async handleMessage(clientId: string, data: RawData): Promise<void> {
    const client = this.clients.get(clientId);

    if (!client) {
      await this.handleAuth(clientId, data.toString());
      return;
    }

    try {
      const raw = data.toString();
      if (raw.length > MAX_PAYLOAD_BYTES) {
        this.sendError(client.ws, 'Payload too large');
        return;
      }

      const message = JSON.parse(raw) as WSMessage;

      switch (message.type) {
        case 'ping':
          this.send(client.ws, { type: 'pong', payload: {}, timestamp: Date.now() });
          break;
        case 'location:update':
          await this.handleLocationUpdate(client, message.payload);
          break;
        case 'craftsman:toggle_availability':
          await this.handleToggleAvailability(client, message.payload);
          break;
        case 'order:subscribe':
          this.handleOrderSubscribe(client, message.payload);
          break;
        case 'order:unsubscribe':
          this.handleOrderUnsubscribe(client, message.payload);
          break;
        default:
          this.sendError(client.ws, `Unknown message type: ${message.type}`);
      }
    } catch (err) {
      logger.error(
        { component: 'ws-server', clientId, error: err instanceof Error ? err.message : String(err) },
        'Message handling error'
      );
    }
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  private async handleAuth(clientId: string, raw: string): Promise<void> {
    let message: WSMessage;
    try {
      message = JSON.parse(raw) as WSMessage;
    } catch {
      this.sendErrorById(clientId, 'Invalid JSON format');
      return;
    }

    if (message.type !== 'auth:login') {
      this.sendErrorById(clientId, 'First message must be auth:login');
      this.closeById(clientId, 4001, 'Auth required');
      return;
    }

    const token = message.payload?.token as string | undefined;
    if (!token) {
      this.sendErrorById(clientId, 'Missing auth token');
      this.closeById(clientId, 4001, 'Missing token');
      return;
    }

    const payload = await verifyToken(token);
    if (!payload?.sub) {
      this.sendErrorById(clientId, 'Invalid or expired token');
      this.closeById(clientId, 4001, 'Invalid token');
      return;
    }

    const userId = payload.sub as string;
    const role = (payload.role as AuthenticatedClient['role']) || 'client';

    const ws = this.getWsById(clientId);
    if (!ws) return;

    const client: AuthenticatedClient = {
      id: clientId,
      userId,
      role,
      ws,
      rooms: new Set(),
      isAlive: true,
    };

    this.clients.set(clientId, client);

    // Auto-join rooms
    this.joinRoom(`user:${userId}`, clientId);
    if (role === 'craftsman') {
      this.joinRoom(`craftsman:${userId}`, clientId);
    }
    if (role === 'admin' || role === 'super_admin') {
      this.joinRoom('admin', clientId);
    }

    this.send(ws, {
      type: 'auth:success',
      payload: { userId, role, clientId },
      timestamp: Date.now(),
    });

    logger.info({ component: 'ws-server', userId, role, clientId }, 'Client authenticated');
  }

  // ─── Message Handlers ───────────────────────────────────────────────────────

  private async handleLocationUpdate(client: AuthenticatedClient, payload: Record<string, unknown>): Promise<void> {
    if (client.role !== 'craftsman') {
      this.sendError(client.ws, 'Only craftsmen can update location');
      return;
    }

    const latitude = payload.latitude as string;
    const longitude = payload.longitude as string;
    const isAvailable = payload.isAvailable as boolean;

    if (!latitude || !longitude) {
      this.sendError(client.ws, 'Missing latitude or longitude');
      return;
    }

    // Cache in Valkey
    try {
      await valkey.setex(
        `craftsman:location:${client.userId}`,
        300,
        JSON.stringify({ latitude, longitude, isAvailable, updatedAt: new Date().toISOString() })
      );
    } catch (err) {
      logger.warn({ userId: client.userId, error: err instanceof Error ? err.message : String(err) }, 'Valkey location cache failed');
    }

    // Broadcast via Valkey pub/sub
    try {
      await valkey.publish(
        'herafino:ws:location',
        JSON.stringify({
          type: 'location:update',
          userId: client.userId,
          latitude,
          longitude,
          isAvailable,
          timestamp: Date.now(),
        })
      );
    } catch {
      // non-critical
    }

    this.send(client.ws, {
      type: 'location:updated',
      payload: { latitude, longitude, isAvailable },
      timestamp: Date.now(),
    });

    logger.debug({ component: 'ws-server', userId: client.userId }, 'Location updated');
  }

  private async handleToggleAvailability(client: AuthenticatedClient, payload: Record<string, unknown>): Promise<void> {
    if (client.role !== 'craftsman') {
      this.sendError(client.ws, 'Only craftsmen can toggle availability');
      return;
    }

    const isAvailable = payload.isAvailable as boolean;

    try {
      await valkey.publish(
        'herafino:ws:online_status',
        JSON.stringify({
          type: 'craftsman:online_status_changed',
          userId: client.userId,
          isAvailable,
          timestamp: Date.now(),
        })
      );
    } catch {
      // non-critical
    }

    this.broadcastToRoom(`craftsman:${client.userId}`, {
      type: 'craftsman:online_status_changed',
      payload: { userId: client.userId, isAvailable },
      timestamp: Date.now(),
    });

    logger.info({ component: 'ws-server', userId: client.userId, isAvailable }, 'Availability toggled');
  }

  private handleOrderSubscribe(client: AuthenticatedClient, payload: Record<string, unknown>): void {
    const orderId = payload.orderId as string | undefined;
    if (!orderId) {
      this.sendError(client.ws, 'Missing orderId');
      return;
    }

    this.joinRoom(`order:${orderId}`, client.id);

    this.send(client.ws, {
      type: 'order:subscribed',
      payload: { orderId },
      timestamp: Date.now(),
    });

    logger.debug({ component: 'ws-server', userId: client.userId, orderId }, 'Subscribed to order room');
  }

  private handleOrderUnsubscribe(client: AuthenticatedClient, payload: Record<string, unknown>): void {
    const orderId = payload.orderId as string | undefined;
    if (!orderId) {
      this.sendError(client.ws, 'Missing orderId');
      return;
    }

    this.leaveRoom(`order:${orderId}`, client.id);

    this.send(client.ws, {
      type: 'order:unsubscribed',
      payload: { orderId },
      timestamp: Date.now(),
    });

    logger.debug({ component: 'ws-server', userId: client.userId, orderId }, 'Unsubscribed from order room');
  }

  // ─── Room Management ────────────────────────────────────────────────────────

  joinRoom(room: string, clientId: string): void {
    const members = this.rooms.get(room) ?? new Set<string>();
    members.add(clientId);
    this.rooms.set(room, members);

    const client = this.clients.get(clientId);
    if (client) {
      client.rooms.add(room);
    }
  }

  leaveRoom(room: string, clientId: string): void {
    const members = this.rooms.get(room);
    if (members) {
      members.delete(clientId);
      if (members.size === 0) {
        this.rooms.delete(room);
      }
    }

    const client = this.clients.get(clientId);
    if (client) {
      client.rooms.delete(room);
    }
  }

  removeClient(client: AuthenticatedClient): void {
    for (const room of client.rooms) {
      this.leaveRoom(room, client.id);
    }
    this.clients.delete(client.id);
  }

  // ─── Broadcast ──────────────────────────────────────────────────────────────

  broadcastToRoom(room: string, message: WSMessage): void {
    const members = this.rooms.get(room);
    if (!members || members.size === 0) return;

    const dead: string[] = [];

    members.forEach((clientId) => {
      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        this.send(client.ws, message);
      } else {
        dead.push(clientId);
      }
    });

    dead.forEach((id) => this.leaveRoom(room, id));
  }

  broadcastToUser(userId: string, message: WSMessage): void {
    this.broadcastToRoom(`user:${userId}`, message);
  }

  broadcastToCraftsman(craftsmanId: string, message: WSMessage): void {
    this.broadcastToRoom(`craftsman:${craftsmanId}`, message);
  }

  broadcastToAdmins(message: WSMessage): void {
    this.broadcastToRoom('admin', message);
  }

  // ─── Valkey Pub/Sub ─────────────────────────────────────────────────────────

  private async setupValkeySubscriber(): Promise<void> {
    try {
      this.valkeySubscriber = valkey.duplicate();
      await this.valkeySubscriber.connect();

      const channels = [
        'herafino:ws:location',
        'herafino:ws:online_status',
        'herafino:ws:notification',
        'herafino:ws:order',
      ];

      for (const channel of channels) {
        await this.valkeySubscriber.subscribe(channel, (err, ...chunks) => {
          if (err) return;
          const raw = chunks[0];
          if (raw) {
            void this.handleValkeyMessage(raw.toString());
          }
        });
      }

      logger.info({ component: 'ws-server', channels: channels.length }, 'Valkey pub/sub ready');
    } catch (err) {
      logger.error({ component: 'ws-server', error: err instanceof Error ? err.message : String(err) }, 'Valkey subscriber failed');
    }
  }

  private async handleValkeyMessage(raw: string): Promise<void> {
    try {
      const data = JSON.parse(raw) as WSMessage;
      const { type, payload } = data;

      switch (type) {
        case 'location:update': {
          const { userId } = payload as { userId: string };
          this.broadcastToUser(userId, data);
          break;
        }
        case 'craftsman:online_status_changed': {
          const { userId } = payload as { userId: string };
          this.broadcastToRoom(`craftsman:${userId}`, data);
          break;
        }
        case 'notification:new': {
          const { userId } = payload as { userId: string };
          this.broadcastToUser(userId, data);
          break;
        }
        case 'order:status_changed': {
          const { orderId } = payload as { orderId: string };
          this.broadcastToRoom(`order:${orderId}`, data);
          break;
        }
      }
    } catch {
      // skip malformed
    }
  }

  // ─── Heartbeat ──────────────────────────────────────────────────────────────

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const dead: string[] = [];

      this.clients.forEach((client, id) => {
        if (!client.isAlive) {
          client.ws.terminate();
          dead.push(id);
        } else {
          client.isAlive = false;
          client.ws.ping();
        }
      });

      dead.forEach((id) => {
        const client = this.clients.get(id);
        if (client) this.removeClient(client);
      });
    }, PING_INTERVAL_MS);
  }

  // ─── Public API (for API route handlers) ────────────────────────────────────

  async notifyUser(userId: string, message: WSMessage): Promise<void> {
    this.broadcastToUser(userId, message);
    try {
      await valkey.publish('herafino:ws:notification', JSON.stringify({
        ...message,
        payload: { ...message.payload, userId },
      }));
    } catch {
      // non-critical
    }
  }

  async notifyOrder(orderId: string, message: WSMessage): Promise<void> {
    this.broadcastToRoom(`order:${orderId}`, message);
    try {
      await valkey.publish('herafino:ws:order', JSON.stringify({
        ...message,
        payload: { ...message.payload, orderId },
      }));
    } catch {
      // non-critical
    }
  }

  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  getRoomCount(room: string): number {
    return this.rooms.get(room)?.size ?? 0;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private send(ws: WebSocket, message: WSMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string): void {
    this.send(ws, { type: 'error', payload: { error }, timestamp: Date.now() });
  }

  private sendErrorById(clientId: string, error: string): void {
    const client = this.clients.get(clientId);
    if (client) this.sendError(client.ws, error);
  }

  private closeById(clientId: string, code: number, reason: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.ws.close(code, reason);
    }
  }

  private getWsById(clientId: string): WebSocket | undefined {
    return this.clients.get(clientId)?.ws;
  }
}
