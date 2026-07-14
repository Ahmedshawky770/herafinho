import type { EventHandler } from '@herafino/contracts';

type ReviewCreatedConfig = {
  enqueueReviewReceivedEmail: (userId: string, rating: number) => Promise<void>;
  notifyUser: (userId: string, title: string, body: string) => Promise<void>;
};

export class ReviewCreatedEventHandler implements EventHandler {
  constructor(private config: ReviewCreatedConfig) {}
  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    if (event.name === 'review.created') {
      const userId = event.payload.craftsmanId as string;
      const rating = event.payload.rating as number;
      await this.config.enqueueReviewReceivedEmail(userId, rating);
      await this.config.notifyUser(userId, '', '');
    }
  }
}
