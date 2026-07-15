import { ValkeyEventBus, OutboxProcessor, OutboxRepository, getValkeyClient } from '@herafino/shared';
import { createEmailWorker, createEmailQueue, createWebhookWorker, createOrderTimeoutWorker } from '@herafino/shared/jobs';
import { ResendEmailService } from './email/resend-email-service';
import { DatabaseNotificationService } from '@herafino/shared/services';
import { AuditLogService } from './services/audit-log-service';
import { UserRepository, OrderRepository, CraftsmanRepository } from '@herafino/shared';
import { logger } from '@herafino/shared';
import { CacheInvalidationEventHandler } from '@herafino/shared';
import {
  CraftsmanRegisteredEventHandler,
  CraftsmanApprovedEventHandler,
  CraftsmanRejectedEventHandler,
  CraftsmanFrozenEventHandler,
  CraftsmanUnfrozenEventHandler,
  CraftsmanBannedEventHandler,
} from './event-handlers/craftsman.handlers';
import {
  OrderCreatedEventHandler,
  OrderAcceptedEventHandler,
  OrderRejectedEventHandler,
  OrderInProgressEventHandler,
  OrderCompletedEventHandler,
  OrderCancelledEventHandler,
} from './event-handlers/order.handlers';
import { ReviewCreatedEventHandler } from './event-handlers/review.handler';
import {
  ComplaintFiledEventHandler,
  ComplaintInvestigatingEventHandler,
  ComplaintResolvedEventHandler,
  ComplaintDismissedEventHandler,
} from './event-handlers/complaint.handlers';
import { AdminActionTakenEventHandler } from './event-handlers/admin.handler';
import type { EventHandler } from '@herafino/contracts';

const WORKER_ID = process.env.WORKER_ID || `worker-${process.pid}`;
const OUTBOX_POLL_INTERVAL_MS = parseInt(process.env.OUTBOX_POLL_INTERVAL_MS || '1000', 10);

async function resolveUser(userId: string): Promise<{ email: string; name: string } | null> {
  try {
    const user = await new UserRepository().findById(userId);
    return user ? { email: user.email, name: user.name } : null;
  } catch {
    return null;
  }
}

function buildEventHandlers(
  emailQueue: ReturnType<typeof createEmailQueue>,
  notificationService: DatabaseNotificationService,
  outboxRepo: OutboxRepository
): Map<string, EventHandler[]> {
  const handlers = new Map<string, EventHandler[]>();
  const cacheHandler = new CacheInvalidationEventHandler();

  const withCache = (eventName: string, handlerList: EventHandler[]): EventHandler[] => {
    return [...handlerList, cacheHandler];
  };

  const CRAFT_TYPE_AR: Record<string, string> = {
    carpenter: 'نجار',
    plumber: 'سباك',
    painter: 'دهان',
    electrician: 'كهربائي',
    welder: 'لحام',
    tiler: 'بلاط',
    ceramicist: 'سيراميك',
    whitewasher: 'محارة',
    hvac: 'تكييف',
    satellite: 'أقمار صناعية',
    aluminum: 'ألمونيوم',
  };

  const notify = async (userId: string, title: string, body: string) =>
    notificationService.send({ userId, type: 'in_app', title, body });

  const enqueueEmail = async (userId: string, subject: string, html: string, text: string) =>
    resolveUser(userId).then((u) => {
      if (u) {
        return emailQueue.add(
          'email:send',
          { to: u.email, subject, html, text },
          { jobId: `email:${u.email}:${Date.now()}`, removeOnComplete: true }
        );
      }
    });

  // ─── craftsman.registered ───────────────────────────────────────────────────

  handlers.set('craftsman.registered', withCache('craftsman.registered', [
    new CraftsmanRegisteredEventHandler({
      async enqueueUserWelcomeEmail(userId: string): Promise<void> {
        const u = await resolveUser(userId);
        if (u) {
          await emailQueue.add(
            'email:send',
            { to: u.email, subject: `مرحباً بك في حرفينو`, html: `<p>أهلاً بك ${u.name}!</p>`, text: `أهلاً بك ${u.name}!` },
            { jobId: `welcome:${u.email}:${Date.now()}`, removeOnComplete: true }
          );
        }
      },
      async enqueueAdminPendingNotification(): Promise<void> {
        await notify('admin', 'حرفي جديد بانتظار الموافقة', 'تم تسجيل حرفي جديد.');
      },
    }),
  ]));

  // ─── craftsman.approved ────────────────────────────────────────────────────

  handlers.set('craftsman.approved', withCache('craftsman.approved', [
    new CraftsmanApprovedEventHandler({
      async enqueueEmailTo(userId: string): Promise<void> {
        await enqueueEmail(userId, 'موافقة على تسجيلك – حرفينو', '<p>تم قبول تسجيلك!</p>', 'تم قبول تسجيلك!');
      },
      async createInAppNotification(userId: string, title: string, body: string): Promise<void> {
        await notify(userId, title, body);
      },
    }),
  ]));

  // ─── craftsman.rejected ────────────────────────────────────────────────────

  handlers.set('craftsman.rejected', withCache('craftsman.rejected', [
    new CraftsmanRejectedEventHandler({
      async enqueueEmailTo(userId: string): Promise<void> {
        await enqueueEmail(userId, 'تحديث بخصوص تسجيلك – حرفينو', '<p>لم يتم قبول تسجيلك.</p>', 'لم يتم قبول تسجيلك.');
      },
      async createInAppNotification(userId: string, title: string, body: string): Promise<void> {
        await notify(userId, title, body);
      },
    }),
  ]));

  // ─── craftsman.frozen ──────────────────────────────────────────────────────

  handlers.set('craftsman.frozen', withCache('craftsman.frozen', [
    new CraftsmanFrozenEventHandler({
      async enqueueEmailTo(userId: string): Promise<void> {
        await enqueueEmail(userId, 'تنبيه تجميد الحساب – حرفينو', '<p>تم تجميد حسابك.</p>', 'تم تجميد حسابك.');
      },
      async createInAppNotification(userId: string, title: string, body: string): Promise<void> {
        await notify(userId, title, body);
      },
    }),
  ]));

  // ─── craftsman.unfrozen ────────────────────────────────────────────────────

  handlers.set('craftsman.unfrozen', withCache('craftsman.unfrozen', [
    new CraftsmanUnfrozenEventHandler({
      async enqueueEmailTo(userId: string): Promise<void> {
        await enqueueEmail(userId, 'تم رفع التجميد – حرفينو', '<p>تم رفع التجميد عن حسابك.</p>', 'تم رفع التجميد.');
      },
      async createInAppNotification(userId: string, title: string, body: string): Promise<void> {
        await notify(userId, title, body);
      },
    }),
  ]));

  // ─── craftsman.banned ──────────────────────────────────────────────────────

  handlers.set('craftsman.banned', withCache('craftsman.banned', [
    new CraftsmanBannedEventHandler({
      async enqueueEmailTo(userId: string): Promise<void> {
        await enqueueEmail(userId, 'حظر الحساب – حرفينو', '<p>تم حظر حسابك نهائياً.</p>', 'تم حظر حسابك.');
      },
      async createInAppNotification(userId: string, title: string, body: string): Promise<void> {
        await notify(userId, title, body);
      },
    }),
  ]));

  // ─── order.created ─────────────────────────────────────────────────────────

  handlers.set('order.created', withCache('order.created', [
    new OrderCreatedEventHandler({
      async enqueueOrderCreatedEmail(clientId: string): Promise<void> {
        await enqueueEmail(clientId, 'طلب جديد متاح – حرفينو', '<p>طلب جديد متاح.</p>', 'طلب جديد.');
      },
      async notifyAdminsNewOrder(): Promise<void> {
        await notify('admin', 'طلب جديد متاح', 'تم إنشاء طلب جديد.');
      },
    }),
  ]));

  // ─── order.accepted ────────────────────────────────────────────────────────

  handlers.set('order.accepted', withCache('order.accepted', [
    new OrderAcceptedEventHandler({
      async enqueueOrderAcceptedEmail(clientId: string): Promise<void> {
        await enqueueEmail(clientId, 'تم قبول طلبك – حرفينو', '<p>تم قبول طلبك!</p>', 'تم قبول طلبك!');
      },
      async createInAppNotification(userId: string, title: string, body: string): Promise<void> {
        await notify(userId, title, body);
      },
      async notifyOtherBidders(orderId: string, acceptedCraftsmanId: string): Promise<void> {
        try {
          const order = await new OrderRepository().findById(orderId);
          if (!order) {
            logger.warn({ orderId }, 'Order not found for notifying other bidders');
            return;
          }

          const otherApproved = await new CraftsmanRepository().findApprovedByCraftType(
            order.craftType as import('@herafino/types').CraftType,
            '0',
            '0',
            9999999
          );

          const otherCraftsmen = otherApproved.filter(
            (profile) => profile.userId !== acceptedCraftsmanId
          );

          if (otherCraftsmen.length === 0) {
            logger.info({ orderId }, 'No other approved craftsmen to notify');
            return;
          }

          const label = CRAFT_TYPE_AR[order.craftType] || order.craftType;

          const notifications = [
            {
              userId: 'admin',
              type: 'in_app' as const,
              title: 'طلب جديد مقبول',
              body: `تم قبول طلب (${label}) #${orderId.slice(0, 8)}.`,
            },
            ...otherCraftsmen.map((profile) => ({
              userId: profile.userId,
              type: 'in_app' as const,
              title: 'تم قبول طلب آخر',
              body: `تم قبول طلب "${label}" من قبل حرفي آخر. يمكنك متابعة الطلبات المتاحة.`,
            })),
          ];

          await notificationService.sendBatch(notifications);
          logger.info(
            { orderId, notifiedCount: notifications.length },
            'Notified admin and other bidders about order acceptance'
          );
        } catch (err) {
          logger.error(
            { orderId, acceptedCraftsmanId, error: err instanceof Error ? err.message : String(err) },
            'Failed to notify other bidders'
          );
        }
      },
    }),
  ]));

  // ─── order.rejected ────────────────────────────────────────────────────────

  handlers.set('order.rejected', withCache('order.rejected', [
    new OrderRejectedEventHandler({
      async enqueueOrderRejectedEmail(clientId: string): Promise<void> {
        await enqueueEmail(clientId, 'تم رفض طلبك – حرفينو', '<p>لم يقبل أي حرفي طلبك بعد.</p>', 'لم يقبل أي حرفي طلبك.');
      },
      async notifyClient(userId: string, title: string, body: string): Promise<void> {
        await notify(userId, title, body);
      },
    }),
  ]));

  // ─── order.in_progress ─────────────────────────────────────────────────────

  handlers.set('order.in_progress', withCache('order.in_progress', [
    new OrderInProgressEventHandler({
      async notifyClient(userId: string, title: string, body: string): Promise<void> {
        await notify(userId, title, body);
      },
    }),
  ]));

  // ─── order.completed ───────────────────────────────────────────────────────

  handlers.set('order.completed', withCache('order.completed', [
    new OrderCompletedEventHandler({
      async enqueueOrderCompletedEmail(clientId: string): Promise<void> {
        await enqueueEmail(clientId, 'تم إتمام طلبك – حرفينو', '<p>طلبك اكتمل!</p>', 'طلبك اكتمل!');
      },
      async enqueueReviewRequestToClient(clientId: string): Promise<void> {
        await notify(clientId, 'شارك رأيك', 'نرجو منك تقييم تجربتك مع الحرفي.');
      },
      async notifyClient(userId: string, title: string, body: string): Promise<void> {
        await notify(userId, title, body);
      },
      async notifyCraftsman(userId: string, title: string, body: string): Promise<void> {
        await notify(userId, title, body);
      },
    }),
  ]));

  // ─── order.cancelled ───────────────────────────────────────────────────────

  handlers.set('order.cancelled', withCache('order.cancelled', [
    new OrderCancelledEventHandler({
      async enqueueOrderCancelledEmail(userId: string): Promise<void> {
        await enqueueEmail(userId, 'تم إلغاء طلبك – حرفينو', '<p>تم إلغاء طلبك.</p>', 'تم إلغاء طلبك.');
      },
      async notifyClient(userId: string, title: string, body: string): Promise<void> {
        await notify(userId, title, body);
      },
      async notifyCraftsman(userId: string, title: string, body: string): Promise<void> {
        await notify(userId, title, body);
      },
    }),
  ]));

  // ─── review.created ────────────────────────────────────────────────────────

  handlers.set('review.created', withCache('review.created', [
    new ReviewCreatedEventHandler({
      async enqueueReviewReceivedEmail(userId: string, rating: number): Promise<void> {
        await enqueueEmail(userId, 'تقييم جديد – حرفينو', `<p>تقييم جديد ⭐ ${String(rating)}/5</p>`, `تقييم جديد ${String(rating)}/5`);
      },
      async notifyUser(userId: string, title: string, body: string): Promise<void> {
        await notify(userId, title, body);
      },
    }),
  ]));

  // ─── complaint.filed ───────────────────────────────────────────────────────

  handlers.set('complaint.filed', withCache('complaint.filed', [
    new ComplaintFiledEventHandler({
      async enqueueComplaintFiledEmail(userId: string): Promise<void> {
        await enqueueEmail(userId, 'شكوى مقدمة ضدك – حرفينو', '<p>تم تقديم شكوى ضدك.</p>', 'تم تقديم شكوى ضدك.');
      },
      async notifyUser(userId: string, title: string, body: string): Promise<void> {
        await notify(userId, title, body);
      },
      async notifyAdmin(title: string, body: string): Promise<void> {
        await notify('admin', title, body);
      },
    }),
  ]));

  // ─── complaint.investigating ───────────────────────────────────────────────

  handlers.set('complaint.investigating', withCache('complaint.investigating', [
    new ComplaintInvestigatingEventHandler({
      async notifyUser(userId: string, title: string, body: string): Promise<void> {
        await notify(userId, title, body);
      },
    }),
  ]));

  // ─── complaint.resolved ────────────────────────────────────────────────────

  handlers.set('complaint.resolved', withCache('complaint.resolved', [
    new ComplaintResolvedEventHandler({
      async enqueueComplaintResolvedEmail(userId: string, actionTaken: string): Promise<void> {
        await enqueueEmail(userId, 'تم حسم الشكوى – حرفينو', `<p>تم حسم الشكوى. الإجراء: ${actionTaken}</p>`, `تم حسم الشكوى. الإجراء: ${actionTaken}`);
      },
      async notifyUser(userId: string, title: string, body: string): Promise<void> {
        await notify(userId, title, body);
      },
    }, outboxRepo),
  ]));

  // ─── complaint.dismissed ───────────────────────────────────────────────────

  handlers.set('complaint.dismissed', withCache('complaint.dismissed', [
    new ComplaintDismissedEventHandler({
      async notifyUser(userId: string, title: string, body: string): Promise<void> {
        await notify(userId, title, body);
      },
    }),
  ]));

  // ─── admin.action_taken ────────────────────────────────────────────────────

  handlers.set('admin.action_taken', withCache('admin.action_taken', [
    new AdminActionTakenEventHandler({
      async createAuditLog(action: string, targetType: string, targetId: string, metadata?: Record<string, unknown>): Promise<void> {
        await new AuditLogService().createAuditLog(action, targetType, targetId, metadata);
      },
    }),
  ]));

  return handlers;
}

// ─── Public API ──────────────────────────────────────────────────────────────

let runtime: { stop: () => Promise<void> } | null = null;

export async function startWorkerService(): Promise<void> {
  if (runtime) {
    return;
  }

  logger.info('[worker] Harfino Background Worker Service');
  logger.info(
    {
      workerId: WORKER_ID,
      pid: process.pid,
      nodeEnv: process.env.NODE_ENV || 'development',
    },
    '[worker] startup'
  );

  const emailService = new ResendEmailService();
  const emailWorker = createEmailWorker(emailService);
  const emailQueue = createEmailQueue();
  const webhookWorker = createWebhookWorker();
  const notificationService = new DatabaseNotificationService();

  const eventBus = new ValkeyEventBus(getValkeyClient());
  await eventBus.start();

  const outboxRepo = new OutboxRepository();
  const eventHandlers = buildEventHandlers(emailQueue, notificationService, outboxRepo);

  const outboxProcessor = new OutboxProcessor(
    outboxRepo,
    eventBus,
    eventHandlers,
    OUTBOX_POLL_INTERVAL_MS
  );
  await outboxProcessor.start();

  const orderTimeoutWorker = createOrderTimeoutWorker(outboxRepo);
  logger.info('Order timeout worker started');

  let isShuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
      logger.error({ signal }, '[worker] Forced exit');
      process.exit(1);
    }
    isShuttingDown = true;
    logger.info({ signal }, '[worker] Received shutdown signal, shutting down gracefully');

    try {
      await Promise.all([
        outboxProcessor.stop(),
        eventBus.stop(),
        webhookWorker.close(),
        emailWorker.close(),
        emailQueue.close(),
        orderTimeoutWorker.close(),
      ]);
      logger.info('[worker] Cleanup done — goodbye');
      process.exit(0);
    } catch (err) {
      logger.error(
        { message: err instanceof Error ? err.message : String(err) },
        '[worker] Shutdown error'
      );
      process.exit(1);
    }
  };

  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
    process.on(signal, () => { void shutdown(signal); });
  }

  process.on('unhandledRejection', (reason) => {
    logger.error(
      { reason: reason instanceof Error ? reason.message : String(reason) },
      '[worker] Unhandled rejection'
    );
  });

  process.on('uncaughtException', (err: Error) => {
    logger.error({ message: err.message, stack: err.stack }, '[worker] Uncaught exception');
    void shutdown('uncaughtException');
  });

  runtime = {
    stop: async () => {
      await Promise.all([
        outboxProcessor.stop(),
        eventBus.stop(),
        webhookWorker.close(),
        emailWorker.close(),
        emailQueue.close(),
        orderTimeoutWorker.close(),
      ]);
    },
  };

  logger.info({ handlerGroups: eventHandlers.size }, '[worker] Event handler groups registered');
  logger.info('[worker] Email worker, webhook worker, outbox processor, Valkey bus started');
  logger.info('[worker] Ready — awaiting outbox events');

  await new Promise(() => {});
}
