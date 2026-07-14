import { logger } from '../logger/factory';
import type { IWebSocketService } from '@herafino/contracts';

export class WebSocketService implements IWebSocketService {
  private rooms: Map<string, Set<unknown>> = new Map();

  async broadcastToRoom(room: string, message: unknown): Promise<void> {
    const members = this.rooms.get(room);
    if (!members) return;
    for (const ws of members) {
      try {
        if (ws && typeof ws === 'object' && 'send' in ws) {
          (ws as { send: (data: string) => void }).send(JSON.stringify(message));
        }
      } catch (error) {
        logger.warn({ room, error }, 'WebSocket broadcast failed');
      }
    }
    logger.debug({ room, memberCount: members.size }, 'Broadcast sent to room');
  }

  addToRoom(room: string, ws: unknown): void {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    const roomMembers = this.rooms.get(room)!;
    roomMembers.add(ws);
    logger.debug({ room, memberCount: roomMembers.size }, 'Client added to room');
  }

  removeFromRoom(room: string, ws: unknown): void {
    const members = this.rooms.get(room);
    if (!members) return;
    members.delete(ws);
    if (members.size === 0) {
      this.rooms.delete(room);
    }
  }

  getRoomCount(room: string): number {
    return this.rooms.get(room)?.size ?? 0;
  }
}
