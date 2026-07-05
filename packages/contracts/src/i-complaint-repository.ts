import type {
  ID,
  NewComplaint,
  Complaint,
  ComplaintStatus,
  ModerationAction,
} from '@herafino/types';

export interface IComplaintRepository {
  findById(id: ID): Promise<Complaint | null>;
  findByReporterId(reporterId: ID): Promise<Complaint[]>;
  findByAgainstUserId(againstUserId: ID): Promise<Complaint[]>;
  findPending(): Promise<Complaint[]>;
  create(complaint: NewComplaint): Promise<Complaint>;
  updateStatus(id: ID, status: ComplaintStatus): Promise<Complaint>;
  resolve(id: ID, action: ModerationAction, resolvedBy: ID): Promise<Complaint>;
}
