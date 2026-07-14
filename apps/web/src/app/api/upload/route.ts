import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { StorageService } from '@/lib/storage/storage-service';
import { logger } from '@herafino/shared/logger/factory';

const storage = new StorageService();

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    const key = url.split('/').pop();
    if (key) {
      await storage.delete(key);
    }

    return NextResponse.json({ success: true });
  } catch {
    logger.error({}, 'DELETE /api/upload failed');
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
