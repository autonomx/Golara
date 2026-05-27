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

type AssetLookup = {
  directory: 'category-real' | 'photo-real';
  stem: string;
};

const assetCandidates: AssetCandidate[] = [
  { extension: 'jpg', contentType: 'image/jpeg' },
  { extension: 'png', contentType: 'image/png' },
  { extension: 'webp', contentType: 'image/webp' }
];

const uploadedCategoryImageAliases: Record<string, string> = {
  'available-today': 'bouquets',
  daily: 'birthday',
  'cacao-roses': 'rose-bag',
  'today-vip': 'woshe-royal',
  'vip-boxes': 'vip-flower-box',
  'standard-boxes': 'standard-flower-box',
  'rose-envelope': 'rose-bag',
  'kids-boxes': 'kids-flower-box',
  'vip-bouquets': 'vip-bouquet',
  'standard-bouquets': 'standard-bouquet',
  royal: 'woshe-royal',
  'chocolate-eternal-rose': 'rose-bag',
  'birthday-package': 'birthday',
  'birthday-box': 'birthday',
  'birthday-ceremony-design': 'ceremony-design',
  surprise: 'balloons-2',
  'cake-balloon': 'cakes-balloons',
  cakes: 'cakes',
  'birthday-cake': 'cakes-2',
  'wedding-ceremony-cake': 'wedding',
  'kids-cake': 'cakes-2',
  'classic-cake': 'cakes',
  'mini-cake-trio': 'cakes-2',
  pots: 'vases',
  'steel-vases': 'vases',
  'glass-vases': 'vases',
  orchids: 'vases',
  'flower-baskets': 'vases',
  condolences: 'condolence',
  'proposal-ceremony': 'pre-weddings',
  proposal: 'pre-weddings',
  'bale-boroon': 'pre-weddings',
  'baby-flowers': 'first-bloom',
  'newborn-flowers': 'first-bloom',
  'gender-reveal': 'first-bloom',
  weddings: 'wedding',
  'bridal-bouquet': 'wedding',
  'bridal-car-design': 'wedding',
  'groom-boutonniere': 'wedding',
  'woshe-distance': 'bouquets'
};

function safeSlug(value: string) {
  return value.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

function lookupCandidates(slug: string): AssetLookup[] {
  const normalizedSlug = safeSlug(slug);
  const alias = uploadedCategoryImageAliases[normalizedSlug];
  return [
    { directory: 'category-real', stem: normalizedSlug },
    ...(alias ? [{ directory: 'photo-real' as const, stem: alias }] : []),
    { directory: 'photo-real', stem: normalizedSlug }
  ];
}

async function readGeneratedImage(slug: string) {
  for (const lookup of lookupCandidates(slug)) {
    for (const candidate of assetCandidates) {
      const filePath = path.join(process.cwd(), 'public', 'seed-images', lookup.directory, `${lookup.stem}.${candidate.extension}`);
      try {
        const image = await readFile(filePath);
        return { image, contentType: candidate.contentType };
      } catch {
        // Try the next supported image format or lookup alias.
      }
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
