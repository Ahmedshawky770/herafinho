export interface IWebSocketService {
  broadcastToRoom(room: string, message: unknown): Promise<void>;
  addToRoom(room: string, ws: unknown): void;
  removeFromRoom(room: string, ws: unknown): void;
  getRoomCount(room: string): number;
}
