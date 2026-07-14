'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';

export function TopBar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-bold text-primary">حرفينو</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{session?.user?.name}</span>
          <Avatar className="size-8">
            <img src={session?.user?.image ?? ''} alt={session?.user?.name ?? ''} />
          </Avatar>
          <form action="/auth/signout" method="POST">
            <Button variant="ghost" size="icon" type="submit">
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
