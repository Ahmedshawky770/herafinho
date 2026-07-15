import type { EventHandler } from '@herafino/contracts';

type CraftsmanNotificationConfig = {
  enqueueEmailTo: (userId: string) => Promise<void>;
  createInAppNotification: (userId: string, title: string, body: string) => Promise<void>;
};

export class CraftsmanRegisteredEventHandler implements EventHandler {
  constructor(private config: CraftsmanRegisteredConfig) {}

  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    if (event.name === 'craftsman.registered') {
      const userId = event.payload.userId as string;
      await this.config.enqueueUserWelcomeEmail(userId);
      await this.config.enqueueAdminPendingNotification();
    }
  }
}

export class CraftsmanApprovedEventHandler implements EventHandler {
  constructor(private config: CraftsmanNotificationConfig) {}

  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    if (event.name === 'craftsman.approved') {
      const userId = event.payload.userId as string;
      await this.config.enqueueEmailTo(userId);
      await this.config.createInAppNotification(userId, '', '');
    }
  }
}

export class CraftsmanRejectedEventHandler implements EventHandler {
  constructor(private config: CraftsmanNotificationConfig) {}

  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    if (event.name === 'craftsman.rejected') {
      const userId = event.payload.userId as string;
      await this.config.enqueueEmailTo(userId);
      await this.config.createInAppNotification(userId, '', '');
    }
  }
}

export class CraftsmanFrozenEventHandler implements EventHandler {
  constructor(private config: CraftsmanNotificationConfig) {}

  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    if (event.name === 'craftsman.frozen') {
      const userId = event.payload.userId as string;
      await this.config.enqueueEmailTo(userId);
      await this.config.createInAppNotification(userId, '', '');
    }
  }
}

export class CraftsmanUnfrozenEventHandler implements EventHandler {
  constructor(private config: CraftsmanNotificationConfig) {}

  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    if (event.name === 'craftsman.unfrozen') {
      const userId = event.payload.userId as string;
      await this.config.enqueueEmailTo(userId);
      await this.config.createInAppNotification(userId, '', '');
    }
  }
}

export class CraftsmanBannedEventHandler implements EventHandler {
  constructor(private config: CraftsmanNotificationConfig) {}

  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    if (event.name === 'craftsman.banned') {
      const userId = event.payload.userId as string;
      await this.config.enqueueEmailTo(userId);
      await this.config.createInAppNotification(userId, '', '');
    }
  }
}

type CraftsmanRegisteredConfig = {
  enqueueUserWelcomeEmail: (userId: string) => Promise<void>;
  enqueueAdminPendingNotification: () => Promise<void>;
};
