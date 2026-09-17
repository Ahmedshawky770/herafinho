// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

const { publishMock } = vi.hoisted(() => ({
  publishMock: vi.fn(() => Promise.resolve()),
}));

vi.mock('@herafino/shared/valkey/client', () => ({
  valkey: { publish: publishMock },
}));

vi.mock('@herafino/shared/logger/factory', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
  },
}));

import { publishOrderUpdate, WS_ORDER_CHANNEL } from './realtime.service';

describe('publishOrderUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    publishMock.mockReset();
    publishMock.mockImplementation(() => Promise.resolve());
  });

  it('publishes an order:status_changed message to the ws order channel', async () => {
    await publishOrderUpdate('order-1', { status: 'accepted' });

    expect(publishMock).toHaveBeenCalledTimes(1);
    const [channel, raw] = publishMock.mock.calls[0];
    expect(channel).toBe(WS_ORDER_CHANNEL);
    const message = JSON.parse(raw as string);
    expect(message.type).toBe('order:status_changed');
    expect(message.payload).toMatchObject({ orderId: 'order-1', status: 'accepted' });
    expect(typeof message.timestamp).toBe('number');
  });

  it('never rejects when publishing fails', async () => {
    publishMock.mockImplementationOnce(() => Promise.reject(new Error('down')));
    await expect(publishOrderUpdate('order-2')).resolves.toBeUndefined();
  });

  it('publishes with empty payload', async () => {
    await publishOrderUpdate('order-1');

    expect(publishMock).toHaveBeenCalledTimes(1);
    const [channel, raw] = publishMock.mock.calls[0];
    expect(channel).toBe(WS_ORDER_CHANNEL);
    const message = JSON.parse(raw as string);
    expect(message.payload.orderId).toBe('order-1');
  });

  it('includes timestamp in message', async () => {
    await publishOrderUpdate('order-1');

    const [, raw] = publishMock.mock.calls[0];
    const message = JSON.parse(raw as string);
    expect(message.timestamp).toBeGreaterThanOrEqual(0);
  });
});
