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

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      googleId: string;
      role: UserRole;
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
    email?: string;
    name?: string;
    image?: string;
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
    async jwt({ token, user, profile }: any) {
      if (user) {
        const googleId = (profile as { sub?: string } | undefined)?.sub ?? user.id;
        const { db, users } = await getUserRepository();

        const [dbUser] = await db.select().from(users).where(eq(users.googleId, googleId ?? ''));

        if (!dbUser) {
          const role: UserRole = (process.env.FIRST_USER_ADMIN === 'true') ? 'admin' : 'client';

          const [created] = await db.insert(users).values({
            email: user.email ?? '',
            emailVerified: true,
            name: user.name ?? '',
            image: user.image ?? '',
            googleId: googleId ?? '',
            role,
          }).returning();

          logger.info({ userId: created.id, role }, 'Created new user via Google OAuth');

          token.userId = created.id;
          token.googleId = googleId;
          token.role = created.role;
          token.email = user.email ?? '';
          token.name = user.name ?? '';
          token.image = user.image ?? '';
        } else {
          token.userId = dbUser.id;
          token.googleId = googleId;
          token.role = dbUser.role;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.image = dbUser.image;
        }
      }

      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      session.user.id = token.userId ?? '';
      session.user.googleId = token.googleId ?? '';
      session.user.role = token.role ?? 'client';
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