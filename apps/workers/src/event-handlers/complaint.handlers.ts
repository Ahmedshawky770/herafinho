import type { EventHandler } from '@herafino/contracts';

type ComplaintFiledConfig = {
  enqueueComplaintFiledEmail: (userId: string) => Promise<void>;
  notifyUser: (userId: string, title: string, body: string) => Promise<void>;
  notifyAdmin: (title: string, body: string) => Promise<void>;
};
type ComplaintInvestigatingConfig = {
  notifyUser: (userId: string, title: string, body: string) => Promise<void>;
};
type ComplaintResolvedConfig = {
  enqueueComplaintResolvedEmail: (userId: string, actionTaken: string) => Promise<void>;
  notifyUser: (userId: string, title: string, body: string) => Promise<void>;
};
type ComplaintDismissedConfig = {
  notifyUser: (userId: string, title: string, body: string) => Promise<void>;
};

export class ComplaintFiledEventHandler implements EventHandler {
  constructor(private config: ComplaintFiledConfig) {}
  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    if (event.name === 'complaint.filed') {
      const userId = event.payload.againstUserId as string;
      await this.config.enqueueComplaintFiledEmail(userId);
      await this.config.notifyUser(userId, '', '');
      await this.config.notifyAdmin('', '');
    }
  }
}

export class ComplaintInvestigatingEventHandler implements EventHandler {
  constructor(private config: ComplaintInvestigatingConfig) {}
  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    if (event.name === 'complaint.investigating') {
      const userId = event.payload.againstUserId as string;
      await this.config.notifyUser(userId, '', '');
    }
  }
}

export class ComplaintResolvedEventHandler implements EventHandler {
  constructor(private config: ComplaintResolvedConfig, _outbox?: unknown) {}
  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    if (event.name === 'complaint.resolved') {
      const userId = event.payload.againstUserId as string;
      const actionTaken = event.payload.actionTaken as string;
      await this.config.enqueueComplaintResolvedEmail(userId, actionTaken);
      await this.config.notifyUser(userId, '', '');
    }
  }
}

export class ComplaintDismissedEventHandler implements EventHandler {
  constructor(private config: ComplaintDismissedConfig) {}
  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    if (event.name === 'complaint.dismissed') {
      const userId = event.payload.againstUserId as string;
      await this.config.notifyUser(userId, '', '');
    }
  }
}
