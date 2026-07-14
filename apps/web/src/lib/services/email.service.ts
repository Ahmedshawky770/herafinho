import { Resend } from 'resend';
import { logger } from '@herafino/shared/logger/factory';
import type { IEmailService } from '@herafino/contracts';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService implements IEmailService {
  async sendWelcome(email: string, name: string): Promise<void> {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@harfino.com',
      to: email,
      subject: 'مرحبا بك في حرفينو',
      html: `<p>أهلاً ${name}، مرحبا بك في حرفينو!</p>`,
    });
    logger.info({ to: email, template: 'welcome' }, 'Welcome email sent');
  }

  async sendApprovalNotification(email: string, name: string): Promise<void> {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@harfino.com',
      to: email,
      subject: 'تم قبول طلبك',
      html: `<p>أهلاً ${name}، تم قبول طلب التحقق من حسابك.</p>`,
    });
    logger.info({ to: email, template: 'approval' }, 'Approval email sent');
  }

  async sendRejectionNotification(email: string, name: string, reason?: string): Promise<void> {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@harfino.com',
      to: email,
      subject: 'تم رفض طلبك',
      html: `<p>أهلاً ${name}، تم رفض طلب التحقق من حسابك.${reason ? `<br>السبب: ${reason}` : ''}</p>`,
    });
    logger.info({ to: email, template: 'rejection' }, 'Rejection email sent');
  }

  async sendOrderNotification(email: string, order: unknown): Promise<void> {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@harfino.com',
      to: email,
      subject: 'تحديث الطلب',
      html: `<p>تحديث جديد على طلبك: ${JSON.stringify(order)}</p>`,
    });
    logger.info({ to: email, template: 'order' }, 'Order notification email sent');
  }

  async sendComplaintNotification(email: string, complaint: unknown): Promise<void> {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@harfino.com',
      to: email,
      subject: 'تحديث الشكوى',
      html: `<p>تحديث جديد على شكواك: ${JSON.stringify(complaint)}</p>`,
    });
    logger.info({ to: email, template: 'complaint' }, 'Complaint notification email sent');
  }

  async sendBanNotification(email: string, reason: string): Promise<void> {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@harfino.com',
      to: email,
      subject: 'تم حظر حسابك',
      html: `<p>تم حظر حسابك. السبب: ${reason}</p>`,
    });
    logger.info({ to: email, template: 'ban' }, 'Ban notification email sent');
  }

  async sendFreezeNotification(email: string, days: number): Promise<void> {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@harfino.com',
      to: email,
      subject: 'تم تجميد حسابك',
      html: `<p>تم تجميد حسابك لمدة ${days} أيام.</p>`,
    });
    logger.info({ to: email, template: 'freeze', days }, 'Freeze notification email sent');
  }
}