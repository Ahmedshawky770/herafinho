import type { EventHandler } from '@herafino/contracts';

type OrderCreatedConfig = {
  enqueueOrderCreatedEmail: (clientId: string) => Promise<void>;
  notifyAdminsNewOrder: () => Promise<void>;
};
type OrderAcceptedConfig = {
  enqueueOrderAcceptedEmail: (clientId: string) => Promise<void>;
  createInAppNotification: (userId: string, title: string, body: string) => Promise<void>;
  notifyOtherBidders: (orderId: string, acceptedCraftsmanId: string) => Promise<void>;
};
type OrderRejectedConfig = {
  enqueueOrderRejectedEmail: (clientId: string) => Promise<void>;
  notifyClient: (userId: string, title: string, body: string) => Promise<void>;
};
type OrderInProgressConfig = {
  notifyClient: (userId: string, title: string, body: string) => Promise<void>;
};
type OrderCompletedConfig = {
  enqueueOrderCompletedEmail: (clientId: string) => Promise<void>;
  enqueueReviewRequestToClient: (clientId: string) => Promise<void>;
  notifyClient: (userId: string, title: string, body: string) => Promise<void>;
  notifyCraftsman: (userId: string, title: string, body: string) => Promise<void>;
};
type OrderCancelledConfig = {
  enqueueOrderCancelledEmail: (userId: string) => Promise<void>;
  notifyClient: (userId: string, title: string, body: string) => Promise<void>;
  notifyCraftsman: (userId: string, title: string, body: string) => Promise<void>;
};

export class OrderCreatedEventHandler implements EventHandler {
  constructor(private config: OrderCreatedConfig) {}
  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    if (event.name === 'order.created') {
      const clientId = event.payload.clientId as string;
      await this.config.enqueueOrderCreatedEmail(clientId);
      await this.config.notifyAdminsNewOrder();
    }
  }
}

export class OrderAcceptedEventHandler implements EventHandler {
  constructor(private config: OrderAcceptedConfig) {}
  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    if (event.name === 'order.accepted') {
      const clientId = event.payload.clientId as string;
      await this.config.enqueueOrderAcceptedEmail(clientId);
      await this.config.createInAppNotification(clientId, '', '');
      await this.config.notifyOtherBidders(event.payload.orderId as string, event.payload.craftsmanId as string);
    }
  }
}

export class OrderRejectedEventHandler implements EventHandler {
  constructor(private config: OrderRejectedConfig) {}
  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    if (event.name === 'order.rejected') {
      const clientId = event.payload.clientId as string;
      await this.config.enqueueOrderRejectedEmail(clientId);
      await this.config.notifyClient(clientId, '', '');
    }
  }
}

export class OrderInProgressEventHandler implements EventHandler {
  constructor(private config: OrderInProgressConfig) {}
  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    if (event.name === 'order.in_progress') {
      const clientId = event.payload.clientId as string;
      await this.config.notifyClient(clientId, '', '');
    }
  }
}

export class OrderCompletedEventHandler implements EventHandler {
  constructor(private config: OrderCompletedConfig) {}
  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    if (event.name === 'order.completed') {
      const clientId = event.payload.clientId as string;
      await this.config.enqueueOrderCompletedEmail(clientId);
      await this.config.enqueueReviewRequestToClient(clientId);
      await this.config.notifyClient(clientId, '', '');
      await this.config.notifyCraftsman(event.payload.craftsmanId as string, '', '');
    }
  }
}

export class OrderCancelledEventHandler implements EventHandler {
  constructor(private config: OrderCancelledConfig) {}
  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    if (event.name === 'order.cancelled') {
      const userId = event.payload.clientId as string;
      await this.config.enqueueOrderCancelledEmail(userId);
      await this.config.notifyClient(userId, '', '');
      await this.config.notifyCraftsman(event.payload.craftsmanId as string, '', '');
    }
  }
}
