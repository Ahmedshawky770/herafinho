'use client';

import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';
import { ToastProvider } from './toast-provider';
import { SessionProvider, useSession } from 'next-auth/react';
import { AuthProvider } from './auth-provider';
import { WSProvider } from './ws-provider';

function WSBridge({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  return (
    <WSProvider userId={session?.user?.id}>{children}</WSProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <SessionProvider>
          <AuthProvider>
            <WSBridge>{children}</WSBridge>
          </AuthProvider>
        </SessionProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

export { QueryProvider, ThemeProvider, ToastProvider, AuthProvider, WSProvider };
