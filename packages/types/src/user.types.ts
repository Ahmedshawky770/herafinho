export type ID = string;

export type UserRole = 'client' | 'craftsman' | 'admin' | 'super_admin';

export type CraftType =
  | 'carpenter'
  | 'plumber'
  | 'painter'
  | 'electrician'
  | 'welder'
  | 'tiler'
  | 'ceramicist'
  | 'whitewasher'
  | 'hvac'
  | 'satellite'
  | 'aluminum';

export type TransportType = 'bike' | 'walking' | 'car' | 'minivan';

export type CraftsmanStatus = 'pending' | 'approved' | 'rejected' | 'frozen' | 'banned';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type ComplaintStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

export type ComplaintReason =
  | 'no_show'
  | 'bad_service'
  | 'overpriced'
  | 'harassment'
  | 'fraud'
  | 'other';

export type ModerationAction = 'warning' | 'freeze' | 'permanent_ban';

export type NotificationType = 'email' | 'in_app' | 'push';

export interface User {
  id: ID;
  email: string;
  emailVerified: boolean;
  name: string;
  image: string;
  googleId: string;
  role: UserRole;
  phone?: string;
  age?: number;
  bannedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewUser {
  email: string;
  emailVerified?: boolean;
  name: string;
  image: string;
  googleId: string;
  role?: UserRole;
  phone?: string;
  age?: number;
}
