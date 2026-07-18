import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { getServerSession } from 'next-auth';
import { logger } from '@herafino/shared/logger/factory';
import { eq } from 'drizzle-orm';
import type { UserRole } from '@herafino/types';

async function getUserRepository() {
  const { db } = await import('@herafino/shared/db');
  const { users } = await import('@herafino/shared/db/schema');
  return { db, users };
}

// Determines whether a user has completed onboarding based on their actual
// state. Admins are exempt. A craftsman is only considered done once an admin
// has reviewed and accepted their profile. A pending/rejected craftsman stays
// incomplete so they remain on the waiting screen and cannot reach the
// dashboard. A frozen craftsman was already approved before being temporarily
// penalised, so they keep dashboard access (their ability to receive orders is
// restricted elsewhere). The persisted flag is kept in sync with this state.
async function resolveOnboardingComplete(
  dbUser: { id: string; role: UserRole; onboardingComplete: boolean },
): Promise<boolean> {
  if (dbUser.role === 'admin' || dbUser.role === 'super_admin') {
    return true;
  }

  if (dbUser.role === 'craftsman') {
    const { CraftsmanRepository } = await import('@herafino/shared/repositories/craftsman.repository');
    const craftsmanRepository = new CraftsmanRepository();
    const profile = await craftsmanRepository.findProfileByUserId(dbUser.id);
    // 'frozen' means the craftsman was approved earlier and is only temporarily
    // penalised, so they retain dashboard access. 'banned' maps to a 'rejected'
    // status in the repository, so it is handled by the default (incomplete).
    const reviewedAndAccepted = profile?.status === 'approved' || profile?.status === 'frozen';

    // Keep the persisted flag aligned with the current review state.
    if (reviewedAndAccepted !== dbUser.onboardingComplete) {
      const { db } = await getUserRepository();
      const { users } = await import('@herafino/shared/db/schema');
      await db.update(users).set({ onboardingComplete: reviewedAndAccepted }).where(eq(users.id, dbUser.id));
    }

    return reviewedAndAccepted;
  }

  return dbUser.onboardingComplete;
}

// How often (ms) the JWT re-reads the user's state from the database. This keeps
// long-lived tokens (including ones minted before the onboarding column existed)
// automatically in sync without forcing a re-login. It is independent of the
// session `maxAge`, so users are not signed out early.
const TOKEN_SYNC_INTERVAL_MS = 60 * 1000;

// Re-reads the user's current role/onboarding state from the database and writes
// it back onto the JWT. Safe to call on every request; it no-ops on failure so a
// transient DB issue never logs the user out.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncTokenFromDatabase(token: any): Promise<void> {
  if (!token.userId) return;
  try {
    const { db, users } = await getUserRepository();
    const [dbUser] = await db.select().from(users).where(eq(users.id, token.userId));
    if (dbUser) {
      token.role = dbUser.role;
      token.onboardingComplete = await resolveOnboardingComplete(dbUser);
      token.email = dbUser.email;
      token.name = dbUser.name;
      token.image = dbUser.image;
    }
  } catch (error) {
    logger.error({ error }, 'Failed to sync JWT from database');
  } finally {
    token.onboardingSyncedAt = Date.now();
  }
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      googleId: string;
      role: UserRole;
      onboardingComplete: boolean;
      email: string;
      name: string;
      image: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    googleId?: string;
    role?: UserRole;
    onboardingComplete?: boolean;
    email?: string;
    name?: string;
    image?: string;
    onboardingSyncedAt?: number;
  }
}

export const authOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user, profile, trigger }: any) {
      if (user) {
        const googleId = (profile as { sub?: string } | undefined)?.sub ?? user.id;
        const { db, users } = await getUserRepository();

        const [dbUser] = await db.select().from(users).where(eq(users.googleId, googleId ?? ''));

        if (!dbUser) {
          const isFirstAdmin = process.env.FIRST_USER_ADMIN === 'true';
          const role: UserRole = isFirstAdmin ? 'admin' : 'client';

          const [created] = await db.insert(users).values({
            email: user.email ?? '',
            emailVerified: true,
            name: user.name ?? '',
            image: user.image ?? '',
            googleId: googleId ?? '',
            role,
            onboardingComplete: isFirstAdmin,
          }).returning();

          logger.info({ userId: created.id, role }, 'Created new user via Google OAuth');

          token.userId = created.id;
          token.googleId = googleId;
          token.role = created.role;
          token.onboardingComplete = created.onboardingComplete;
          token.email = user.email ?? '';
          token.name = user.name ?? '';
          token.image = user.image ?? '';
        } else {
          const onboardingComplete = await resolveOnboardingComplete(dbUser);

          token.userId = dbUser.id;
          token.googleId = googleId;
          token.role = dbUser.role;
          token.onboardingComplete = onboardingComplete;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.image = dbUser.image;
        }
        token.onboardingSyncedAt = Date.now();
      }

      // Keep existing tokens in sync automatically, without ever forcing a
      // re-login:
      //  - `trigger === 'update'`: an explicit `useSession().update()` call
      //    (e.g. right after finishing onboarding) refreshes immediately.
      //  - Legacy tokens minted before onboarding tracking existed have no
      //    `onboardingSyncedAt`, so they are refreshed on their next request.
      //  - Otherwise refresh periodically so DB changes propagate on their own.
      if (!user && token.userId) {
        const needsSync =
          trigger === 'update' ||
          token.onboardingSyncedAt === undefined ||
          Date.now() - token.onboardingSyncedAt > TOKEN_SYNC_INTERVAL_MS;

        if (needsSync) {
          await syncTokenFromDatabase(token);
        }
      }

      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      session.user.id = token.userId ?? '';
      session.user.googleId = token.googleId ?? '';
      session.user.role = token.role ?? 'client';
      session.user.onboardingComplete = token.onboardingComplete ?? false;
      session.user.email = token.email ?? '';
      session.user.name = token.name ?? '';
      session.user.image = token.image ?? '';

      return session;
    },
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const auth = async () => getServerSession(authOptions);
export const handlers = NextAuth(authOptions);
export { signIn, signOut } from 'next-auth/react';