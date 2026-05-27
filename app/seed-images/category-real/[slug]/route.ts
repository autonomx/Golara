import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

import { findHomepageCategoryTile } from '@/lib/homepage-category-tiles';

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type AssetCandidate = {
  extension: string;
  contentType: string;
};

const assetCandidates: AssetCandidate[] = [
  { extension: 'jpg', contentType: 'image/jpeg' },
  { extension: 'png', contentType: 'image/png' },
  { extension: 'webp', contentType: 'image/webp' }
];

function safeSlug(value: string) {
  return value.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

async function readGeneratedImage(slug: string) {
  const normalizedSlug = safeSlug(slug);

  for (const candidate of assetCandidates) {
    const filePath = path.join(process.cwd(), 'public', 'seed-images', 'category-real', `${normalizedSlug}.${candidate.extension}`);
    try {
      const image = await readFile(filePath);
      return { image, contentType: candidate.contentType };
    } catch {
      // Try the next supported image format.
    }
  }

  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const tile = findHomepageCategoryTile(slug);

  if (!tile) {
    return new NextResponse('Not found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' }
    });
  }

  const generatedImage = await readGeneratedImage(slug);
  if (generatedImage) {
    return new NextResponse(generatedImage.image, {
      status: 200,
      headers: {
        'content-type': generatedImage.contentType,
        'cache-control': 'public, max-age=31536000, immutable'
      }
    });
  }

  const fallbackUrl = new URL(`/seed-images/category/${safeSlug(slug)}`, _request.url);
  return NextResponse.redirect(fallbackUrl, 307);
}
