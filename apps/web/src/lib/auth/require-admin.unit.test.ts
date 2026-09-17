import { describe, it, expect, vi } from 'vitest';
import { requireAdmin } from './require-admin';
import { UnauthorizedError, ForbiddenError } from '@herafino/shared/errors/app-error';

describe('requireAdmin', () => {
  it('should throw UnauthorizedError when no session', () => {
    expect(() => requireAdmin(null)).toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError when no user', () => {
    expect(() => requireAdmin({})).toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError when user is undefined', () => {
    expect(() => requireAdmin({ user: undefined })).toThrow(UnauthorizedError);
  });

  it('should throw ForbiddenError for non-admin role', () => {
    expect(() => requireAdmin({ user: { id: 'user-1', role: 'client' } })).toThrow(ForbiddenError);
  });

  it('should throw ForbiddenError for craftsman role', () => {
    expect(() => requireAdmin({ user: { id: 'user-1', role: 'craftsman' } })).toThrow(ForbiddenError);
  });

  it('should throw ForbiddenError for empty role', () => {
    expect(() => requireAdmin({ user: { id: 'user-1', role: '' } })).toThrow(ForbiddenError);
  });

  it('should pass for admin role', () => {
    const session = { user: { id: 'admin-1', role: 'admin' } };
    expect(() => requireAdmin(session)).not.toThrow();
  });

  it('should pass for super_admin role', () => {
    const session = { user: { id: 'admin-1', role: 'super_admin' } };
    expect(() => requireAdmin(session)).not.toThrow();
  });

  it('should pass for admin role with email', () => {
    const session = { user: { id: 'admin-1', role: 'admin', email: 'admin@example.com' } };
    expect(() => requireAdmin(session)).not.toThrow();
  });
});
