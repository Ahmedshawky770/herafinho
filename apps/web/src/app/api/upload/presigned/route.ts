import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { StorageService } from '@/lib/storage/storage-service';
import { logger } from '@herafino/shared/logger/factory';

const storage = new StorageService();

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { fileType, contentType } = body as {
      fileType?: string;
      contentType?: string;
    };

    if (!fileType || typeof fileType !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing fileType' }, { status: 400 });
    }

    if (!contentType || typeof contentType !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid contentType' }, { status: 400 });
    }

    const key = `uploads/${session.user.id}/${Date.now()}`;
    const signedUrl = await storage.getUploadUrl(key, contentType);
    const fileUrl = `${process.env.AWS_CDN_URL}/${key}`;

    return NextResponse.json({
      uploadUrl: signedUrl,
      fileKey: key,
      fileUrl,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    });
  } catch {
    logger.error({}, 'POST /api/upload/presigned failed');
    return NextResponse.json({ error: 'Failed to generate presigned URL' }, { status: 500 });
  }
}
