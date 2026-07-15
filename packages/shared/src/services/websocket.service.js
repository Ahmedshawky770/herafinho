import { logger } from '../logger/factory';
export class WebSocketService {
    rooms = new Map();
    async broadcastToRoom(room, message) {
        const members = this.rooms.get(room);
        if (!members)
            return;
        for (const ws of members) {
            try {
                if (ws && typeof ws === 'object' && 'send' in ws) {
                    ws.send(JSON.stringify(message));
                }
            }
            catch (error) {
                logger.warn({ room, error }, 'WebSocket broadcast failed');
            }
        }
        logger.debug({ room, memberCount: members.size }, 'Broadcast sent to room');
    }
    addToRoom(room, ws) {
        if (!this.rooms.has(room)) {
            this.rooms.set(room, new Set());
        }
        const roomMembers = this.rooms.get(room);
        roomMembers.add(ws);
        logger.debug({ room, memberCount: roomMembers.size }, 'Client added to room');
    }
    removeFromRoom(room, ws) {
        const members = this.rooms.get(room);
        if (!members)
            return;
        members.delete(ws);
        if (members.size === 0) {
            this.rooms.delete(room);
        }
    }
    getRoomCount(room) {
        return this.rooms.get(room)?.size ?? 0;
    }
}
