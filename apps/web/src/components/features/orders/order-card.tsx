'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock } from 'lucide-react';

export function OrderCard({
  title,
  status,
  location,
  createdAt,
}: {
  title: string;
  status: string;
  location?: string;
  createdAt?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between text-right">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="secondary">{status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-right text-sm text-gray-600">
        {location && (
          <div className="flex items-center gap-1">
            <MapPin className="size-4" />
            <span>{location}</span>
          </div>
        )}
        {createdAt && (
          <div className="flex items-center gap-1">
            <Clock className="size-4" />
            <span>{createdAt}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
