import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { eq } from 'drizzle-orm';
import { logger } from '../logger/factory';
import type { UserRole } from '@herafino/types';

// Lazy import database to avoid Edge runtime issues
async function getUserRepository() {
  const { db } = await import('../db');
  const { users } = await import('../db/schema');
  return { db, users };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const { db, users } = await getUserRepository();
        const googleId = profile.sub as string;

        let user = await db.query.users.findFirst({
          where: eq(users.googleId, googleId),
        });

        if (!user) {
          const role: UserRole = (process.env.FIRST_USER_ADMIN === 'true')
            ? 'admin'
            : 'client';

          [user] = await db.insert(users).values({
            email: profile.email as string,
            emailVerified: true,
            name: profile.name as string,
            image: (profile as { picture?: string }).picture || '',
            googleId,
            role,
          }).returning();

          logger.info({ userId: user.id, role }, 'Created new user via Google OAuth');
        }

        token.userId = user.id;
        token.googleId = user.googleId;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.userId as string;
        (session.user as Record<string, unknown>).googleId = token.googleId as string;
        (session.user as Record<string, unknown>).role = token.role as UserRole;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
});

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