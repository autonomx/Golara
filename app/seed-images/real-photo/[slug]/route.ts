import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

import { renderSeedProductPhotoSvg } from '@/lib/seed-product-images';

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

function safeSlug(value: string) {
  return value.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

async function readGeneratedPng(slug: string) {
  const filePath = path.join(process.cwd(), 'public', 'seed-images', 'photo-real', `${safeSlug(slug)}.png`);
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const image = await readGeneratedPng(slug);

  if (image) {
    return new NextResponse(image, {
      status: 200,
      headers: {
        'content-type': 'image/png',
        'cache-control': 'public, max-age=31536000, immutable'
      }
    });
  }

  const fallbackSvg = renderSeedProductPhotoSvg(slug);
  if (!fallbackSvg) {
    return new NextResponse('Not found', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8'
      }
    });
  }

  return new NextResponse(fallbackSvg, {
    status: 200,
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=300'
    }
  });
}
