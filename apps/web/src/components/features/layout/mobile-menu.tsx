'use client';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { SidebarContent } from './sidebar';
import { useAuth } from '@/components/providers/auth-provider';
import type { UserRole } from '@herafino/types';

export function MobileMenu() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="القائمة">
              <Menu className="size-5" />
            </Button>
          }
        />
        <SheetContent side="right" className="w-72 p-0">
          <SidebarContent role={user.role as UserRole} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
