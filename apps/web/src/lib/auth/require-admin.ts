import { UnauthorizedError, ForbiddenError } from "@herafino/shared/errors/app-error";
import type { ID, UserRole } from "@herafino/types";

export interface AuthUser {
  id?: ID;
  role?: UserRole | string;
  email?: string;
  name?: string;
}

export interface AuthSession {
  user?: AuthUser;
}

/**
 * Guards an admin-only route handler.
 *
 * - No session / no user  -> 401 Unauthorized
 * - Authenticated non-admin -> 403 Forbidden
 *
 * Keeping these distinct matters: a missing session is an authentication problem
 * (401) while a logged-in client hitting an admin surface is an authorization
 * problem (403).
 */
export function requireAdmin(
  session: AuthSession | null
): asserts session is { user: { id: ID; role: UserRole } } {
  if (!session?.user) {
    throw new UnauthorizedError("Authentication required");
  }
  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new ForbiddenError("Admin access required");
  }
}
