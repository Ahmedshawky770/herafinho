import type { ID, NewUser, User } from '@herafino/types';

export interface IUserRepository {
  findById(id: ID): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: NewUser): Promise<User>;
  update(id: ID, data: Partial<User>): Promise<User>;
  softDelete(id: ID): Promise<void>;
  exists(id: ID): Promise<boolean>;
}