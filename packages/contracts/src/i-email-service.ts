export interface IEmailService {
  sendWelcome(email: string, name: string): Promise<void>;
  sendApprovalNotification(email: string, name: string): Promise<void>;
  sendRejectionNotification(email: string, name: string, reason?: string): Promise<void>;
  sendOrderNotification(email: string, order: unknown): Promise<void>;
  sendComplaintNotification(email: string, complaint: unknown): Promise<void>;
  sendBanNotification(email: string, reason: string): Promise<void>;
  sendFreezeNotification(email: string, days: number): Promise<void>;
}
