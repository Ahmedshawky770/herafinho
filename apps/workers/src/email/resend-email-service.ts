import { Resend } from 'resend';
import { logger } from '@herafino/shared';

export class ResendEmailService {
  private readonly client: Resend;
  private readonly from: string;

  constructor() {
    this.client = new Resend(process.env.RESEND_API_KEY ?? '');
    this.from = process.env.RESEND_FROM_EMAIL ?? 'noreply@herafino.com';
  }

  async send(to: string, subject: string, html: string, text: string): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      throw new Error(`Resend email failed: ${error.message}`);
    }

    logger.debug({ to, subject }, 'Email sent via Resend');
  }
}
