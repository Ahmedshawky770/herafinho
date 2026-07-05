import type {
  ID,
  ComplaintStatus,
  ComplaintReason,
  ModerationAction,
} from './user.types';

export type { ID, ComplaintStatus, ComplaintReason, ModerationAction };

export interface Complaint {
  id: ID;
  orderId?: ID;
  reporterId: ID;
  againstUserId: ID;
  reason: ComplaintReason;
  description: string;
  evidenceUrls: string[];
  status: ComplaintStatus;
  actionTaken?: ModerationAction;
  resolvedBy?: ID;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewComplaint {
  orderId?: ID;
  reporterId: ID;
  againstUserId: ID;
  reason: ComplaintReason;
  description: string;
  evidenceUrls?: string[];
}
