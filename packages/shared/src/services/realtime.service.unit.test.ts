// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

const publishMock = vi.fn(() => Promise.resolve());

vi.mock('@herafino/shared/valkey/client', () => ({
  valkey: { publish: publishMock },
}));

import { publishOrderUpdate, WS_ORDER_CHANNEL } from './realtime.service';

describe('publishOrderUpdate', () => {
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
});
