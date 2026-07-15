import { valkey } from '../valkey/client';
import { logger } from '../logger/factory';

export const WS_ORDER_CHANNEL = 'herafino:ws:order';

export interface OrderUpdatePayload {
  status?: string;
  craftsmanId?: string;
  clientId?: string;
  [key: string]: unknown;
}

/**
 * Publishes an order status change to the Valkey pub/sub channel consumed by the
 * WebSocket server (apps/web/src/ws/server.ts). The WS server forwards the message
 * to every client subscribed to the `order:<orderId>` room.
 *
 * This intentionally lives in @herafino/shared and uses only the Valkey client so
 * that non-Next.js runtimes (workers, ws) can reuse it without pulling in
 * `next/server` types.
 */
export async function publishOrderUpdate(
  orderId: string,
  payload: OrderUpdatePayload = {}
): Promise<void> {
  try {
    await valkey.publish(
      WS_ORDER_CHANNEL,
      JSON.stringify({
        type: 'order:status_changed',
        payload: { orderId, ...payload },
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    logger.warn(
      { orderId, error: error instanceof Error ? error.message : String(error) },
      'Failed to publish order update'
    );
  }
}
