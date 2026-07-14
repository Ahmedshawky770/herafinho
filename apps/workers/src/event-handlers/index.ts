import type { EventHandler } from '@herafino/contracts';
import type { DomainEvent } from '@herafino/types';
import { logger } from '@herafino/shared';
import { CRAFT_TYPE_AR } from './craftsman.handlers';

export interface OrderCreatedDependencies {
  notifyAdminsNewOrder: (orderId: string, craftType: string) => Promise<void>;
  enqueueOrderCreatedEmail: (userId: string, orderId: string, craftType: string) => Promise<void>;
}

export class OrderCreatedEventHandler implements EventHandler {
  constructor(private readonly deps: OrderCreatedDependencies) {}

  async handle(event: DomainEvent): Promise<void> {
    const { orderId, clientId, craftType } = event.payload as {
      orderId: string;
      clientId: string;
      craftType: string;
    };

    logger.info({ eventId: event.id, orderId, clientId, craftType }, 'Processing order.created');

    await Promise.all([
      this.deps.enqueueOrderCreatedEmail(clientId, orderId, craftType),
      this.deps.notifyAdminsNewOrder(orderId, craftType),
    ]).catch((err) => {
      logger.error({ eventId: event.id, error: err instanceof Error ? err.message : String(err) }, 'order.created side effects failed');
    });
  }
}

export interface OrderAcceptedDependencies {
  notifyClient: (userId: string, title: string, body: string) => Promise<void>;
  notifyOtherBidders: (orderId: string, acceptedCraftsmanId: string) => Promise<void>;
  enqueueOrderAcceptedEmail: (clientId: string, orderId: string, craftsmanName: string, craftType: string) => Promise<void>;
}

export class OrderAcceptedEventHandler implements EventHandler {
  constructor(private readonly deps: OrderAcceptedDependencies) {}

  async handle(event: DomainEvent): Promise<void> {
    const { orderId, clientId, craftsmanId } = event.payload as {
      orderId: string;
      clientId: string;
      craftsmanId: string;
    };

    logger.info({ eventId: event.id, orderId, clientId, craftsmanId }, 'Processing order.accepted');

    await Promise.all([
      this.deps.enqueueOrderAcceptedEmail(clientId, orderId, '', craftLabel(craftsmanId)),
      this.deps.notifyClient(clientId, 'تم قبول طلبك ✅', 'قام حرفي بقبول طلبك. يمكنك متابعة التفاصيل.'),
      this.deps.notifyOtherBidders(orderId, craftsmanId),
    ]).catch((err) => {
      logger.error({ eventId: event.id, error: err instanceof Error ? err.message : String(err) }, 'order.accepted side effects failed');
    });
  }
}

export interface OrderRejectedDependencies {
  notifyClient: (userId: string, title: string, body: string) => Promise<void>;
  enqueueOrderRejectedEmail: (clientId: string, orderId: string, reason?: string) => Promise<void>;
}

export class OrderRejectedEventHandler implements EventHandler {
  constructor(private readonly deps: OrderRejectedDependencies) {}

  async handle(event: DomainEvent): Promise<void> {
    const { orderId, clientId } = event.payload as { orderId: string; clientId: string };
    logger.info({ eventId: event.id, orderId, clientId }, 'Processing order.rejected');

    await Promise.all([
      this.deps.enqueueOrderRejectedEmail(clientId, orderId),
      this.deps.notifyClient(clientId, 'تم رفض طلبك ⚠️', 'لم يقبل أي حرفي طلبك بعد. يمكنك تعديل التفاصيل وإعادة المحاولة.'),
    ]).catch((err) => {
      logger.error({ eventId: event.id, error: err instanceof Error ? err.message : String(err) }, 'order.rejected side effects failed');
    });
  }
}

export interface OrderInProgressDependencies {
  notifyClient: (userId: string, title: string, body: string) => Promise<void>;
}

export class OrderInProgressEventHandler implements EventHandler {
  constructor(private readonly deps: OrderInProgressDependencies) {}

  async handle(event: DomainEvent): Promise<void> {
    const { orderId, clientId, craftsmanId } = event.payload as {
      orderId: string;
      clientId: string;
      craftsmanId: string;
    };
    logger.info({ eventId: event.id, orderId, clientId, craftsmanId }, 'Processing order.in_progress');

    await this.deps
      .notifyClient(clientId, 'طلبك قيد التنفيذ 🔧', `الحرفي بدأ العمل على طلبك (رقم الطلب: ${orderId}).`)
      .catch((err) => {
        logger.error({ eventId: event.id, error: err instanceof Error ? err.message : String(err) }, 'order.in_progress side effects failed');
      });
  }
}

export interface OrderCompletedDependencies {
  notifyClient: (userId: string, title: string, body: string) => Promise<void>;
  notifyCraftsman: (userId: string, title: string, body: string) => Promise<void>;
  enqueueOrderCompletedEmail: (clientId: string, orderId: string, finalPrice?: string) => Promise<void>;
  enqueueReviewRequestToClient: (clientId: string, orderId: string) => Promise<void>;
}

export class OrderCompletedEventHandler implements EventHandler {
  constructor(private readonly deps: OrderCompletedDependencies) {}

  async handle(event: DomainEvent): Promise<void> {
    const { orderId, clientId, craftsmanId, finalPrice } = event.payload as {
      orderId: string;
      clientId: string;
      craftsmanId: string;
      finalPrice?: string;
    };

    logger.info({ eventId: event.id, orderId, clientId, craftsmanId }, 'Processing order.completed');

    await Promise.all([
      this.deps.notifyClient(clientId, 'تم إتمام طلبك 🎉', `طلبك اكتمل بنجاح! ${finalPrice ? `السعر النهائي: ${finalPrice} ج.م` : ''}`),
      this.deps.notifyCraftsman(craftsmanId, 'تم إتمام الطلب 🎉', `تم إتمام الطلب ${orderId} بنجاح!`),
      this.deps.enqueueOrderCompletedEmail(clientId, orderId, finalPrice),
      this.deps.enqueueReviewRequestToClient(clientId, orderId),
    ]).catch((err) => {
      logger.error({ eventId: event.id, error: err instanceof Error ? err.message : String(err) }, 'order.completed side effects failed');
    });
  }
}

export interface OrderCancelledDependencies {
  notifyClient: (userId: string, title: string, body: string) => Promise<void>;
  notifyCraftsman: (userId: string, title: string, body: string) => Promise<void>;
  enqueueOrderCancelledEmail: (userId: string, orderId: string, reason?: string) => Promise<void>;
}

export class OrderCancelledEventHandler implements EventHandler {
  constructor(private readonly deps: OrderCancelledDependencies) {}

  async handle(event: DomainEvent): Promise<void> {
    const { orderId, clientId, craftsmanId, reason } = event.payload as {
      orderId: string;
      clientId: string;
      craftsmanId?: string;
      reason?: string;
    };

    logger.info({ eventId: event.id, orderId, cancelledBy: craftsmanId ? 'craftsman' : 'client' }, 'Processing order.cancelled');

    const promises: Promise<void>[] = [
      this.deps.notifyClient(clientId, 'تم إلغاء طلبك', `تم إلغاء طلبك (${orderId}).${reason ? ` السبب: ${reason}` : ''}`),
      this.deps.enqueueOrderCancelledEmail(clientId, orderId, reason),
    ];

    if (craftsmanId) {
      promises.push(
        this.deps.notifyCraftsman(craftsmanId, 'تم إلغاء الطلب', `تم إلغاء الطلب ${orderId} من قبل العميل.`)
      );
    }

    await Promise.all(promises).catch((err) => {
      logger.error({ eventId: event.id, error: err instanceof Error ? err.message : String(err) }, 'order.cancelled side effects failed');
    });
  }
}

function craftLabel(type: string): string {
  return CRAFT_TYPE_AR[type] || type;
}
