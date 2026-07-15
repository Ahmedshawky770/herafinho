'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ellipsis } from 'lucide-react';

export function UserManagementTable({
  users,
}: {
  users: { id: string; name: string; email: string; role: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">إدارة المستخدمين</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-auto text-right">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-right font-medium">الاسم</th>
                <th className="pb-2 text-right font-medium">البريد</th>
                <th className="pb-2 text-right font-medium">الدور</th>
                <th className="pb-2 text-right font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="py-3">{user.name}</td>
                  <td className="py-3 text-gray-600">{user.email}</td>
                  <td className="py-3">
                    <Badge variant="outline">{user.role}</Badge>
                  </td>
                  <td className="py-3">
                    <Button size="icon" variant="ghost">
                      <Ellipsis className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
