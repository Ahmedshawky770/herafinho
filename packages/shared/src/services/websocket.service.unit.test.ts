import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebSocketService } from './websocket.service';

describe('WebSocketService', () => {
  let service: WebSocketService;

  beforeEach(() => {
    service = new WebSocketService();
  });

  it('adds a websocket to a room', () => {
    const mockWs = { send: vi.fn() };
    service.addToRoom('room-1', mockWs);
    expect(service.getRoomCount('room-1')).toBe(1);
  });

  it('removes a websocket from a room', () => {
    const mockWs = { send: vi.fn() };
    service.addToRoom('room-1', mockWs);
    service.removeFromRoom('room-1', mockWs);
    expect(service.getRoomCount('room-1')).toBe(0);
  });

  it('deletes room when empty', () => {
    const mockWs = { send: vi.fn() };
    service.addToRoom('room-1', mockWs);
    service.removeFromRoom('room-1', mockWs);
    expect(service.getRoomCount('room-1')).toBe(0);
  });

  it('broadcasts message to room members', () => {
    const mockWs1 = { send: vi.fn() };
    const mockWs2 = { send: vi.fn() };
    service.addToRoom('room-1', mockWs1);
    service.addToRoom('room-1', mockWs2);

    service.broadcastToRoom('room-1', { type: 'test', payload: {} });

    expect(mockWs1.send).toHaveBeenCalledWith(JSON.stringify({ type: 'test', payload: {} }));
    expect(mockWs2.send).toHaveBeenCalledWith(JSON.stringify({ type: 'test', payload: {} }));
  });

  it('does not broadcast to empty room', () => {
    const mockWs = { send: vi.fn() };
    service.broadcastToRoom('room-empty', { type: 'test', payload: {} });
    expect(mockWs.send).not.toHaveBeenCalled();
  });

  it('handles broadcast error gracefully', () => {
    const mockWs = {
      send: vi.fn().mockImplementation(() => {
        throw new Error('send failed');
      }),
    };
    service.addToRoom('room-1', mockWs);

    expect(() => service.broadcastToRoom('room-1', { type: 'test', payload: {} })).not.toThrow();
  });

  it('returns 0 for non-existent room count', () => {
    expect(service.getRoomCount('non-existent')).toBe(0);
  });

  it('handles multiple websockets in same room', () => {
    const mockWs1 = { send: vi.fn() };
    const mockWs2 = { send: vi.fn() };
    const mockWs3 = { send: vi.fn() };
    service.addToRoom('room-1', mockWs1);
    service.addToRoom('room-1', mockWs2);
    service.addToRoom('room-1', mockWs3);
    expect(service.getRoomCount('room-1')).toBe(3);
  });

  it('removes only specified websocket from room', () => {
    const mockWs1 = { send: vi.fn() };
    const mockWs2 = { send: vi.fn() };
    service.addToRoom('room-1', mockWs1);
    service.addToRoom('room-1', mockWs2);
    service.removeFromRoom('room-1', mockWs1);
    expect(service.getRoomCount('room-1')).toBe(1);
  });
});
