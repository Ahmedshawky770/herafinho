'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

const AuthContext = createContext<{
  user: { id: string; email: string; role: string } | null;
  isLoading: boolean;
}>({
  user: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const user = session?.user
    ? {
        id: (session.user as { id?: string }).id ?? '',
        email: session.user.email ?? '',
        role: (session.user as { role?: string }).role ?? 'client',
      }
    : null;

  return (
    <AuthContext.Provider value={{ user, isLoading: status === 'loading' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
