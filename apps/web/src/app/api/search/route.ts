import { NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/http/error-handler';
import { auth } from '@/app/auth';
import { CraftsmanRepository } from '@herafino/shared/repositories/craftsman.repository';
import { logger } from '@herafino/shared/logger/factory';
import type { ID, CraftType } from '@herafino/types';

const craftsmanRepository = new CraftsmanRepository();

interface AuthSession {
  user?: {
    id?: ID;
    role?: string;
  };
}

export async function GET(request: Request) {
  try {
    const session = (await auth()) as AuthSession | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get('q') ?? '';
    const craftType = url.searchParams.get('craftType') as CraftType | null;
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    const radius = parseInt(url.searchParams.get('radius') || '10', 10);

    if (craftType && lat && lng) {
      const nearby = await craftsmanRepository.searchNearbyCraftsmen(
        craftType,
        lat,
        lng,
        radius
      );
      return NextResponse.json({ data: nearby.map((n) => ({ ...n.profile, name: n.name })) });
    }

    if (query) {
      const results = await craftsmanRepository.searchByNameOrCraft(query, craftType ?? undefined);
      return NextResponse.json({ data: results });
    }

    const profiles = await craftsmanRepository.findApprovedByCraftType(
      (craftType ?? 'carpenter') as CraftType,
      '0',
      '0',
      50,
    );
    return NextResponse.json({ data: profiles });
  } catch (error) {
    logger.error({ error }, 'GET /api/search failed');
    return createErrorResponse(error);
  }
}