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

const uploadedCategoryImageAliases: Record<string, AssetLookup[]> = {
  'available-today': [{ directory: 'photo-real', stem: 'bouquets' }],
  daily: [{ directory: 'photo-real', stem: 'birthday' }],
  'cacao-roses': [{ directory: 'photo-real', stem: 'rose-bag' }],
  'today-vip': [{ directory: 'photo-real', stem: 'vip-flower-box' }],
  'vip-boxes': [{ directory: 'photo-real', stem: 'vip-flower-box' }],
  'standard-boxes': [{ directory: 'photo-real', stem: 'standard-flower-box' }],
  'rose-envelope': [{ directory: 'photo-real', stem: 'rose-bag' }],
  'kids-boxes': [{ directory: 'photo-real', stem: 'kids-flower-box' }],
  'vip-bouquets': [{ directory: 'photo-real', stem: 'vip-bouquet' }],
  'standard-bouquets': [{ directory: 'photo-real', stem: 'standard-bouquet' }],
  royal: [{ directory: 'photo-real', stem: 'vip-flower-box' }],
  'chocolate-eternal-rose': [{ directory: 'photo-real', stem: 'rose-bag' }],
  'birthday-package': [{ directory: 'category-real', stem: 'birthday-packages' }, { directory: 'photo-real', stem: 'birthday' }],
  'birthday-box': [{ directory: 'category-real', stem: 'birthday-box' }, { directory: 'photo-real', stem: 'birthday' }],
  'birthday-ceremony-design': [{ directory: 'photo-real', stem: 'ceremony-design' }],
  surprise: [{ directory: 'category-real', stem: 'surprise' }, { directory: 'photo-real', stem: 'balloons-2' }],
  'cake-balloon': [{ directory: 'photo-real', stem: 'cakes-balloons' }],
  cakes: [{ directory: 'photo-real', stem: 'cakes' }],
  'birthday-cake': [{ directory: 'photo-real', stem: 'cakes-2' }],
  'wedding-ceremony-cake': [{ directory: 'photo-real', stem: 'wedding' }],
  'kids-cake': [{ directory: 'photo-real', stem: 'cakes-2' }],
  'classic-cake': [{ directory: 'photo-real', stem: 'cakes' }],
  'mini-cake-trio': [{ directory: 'photo-real', stem: 'cakes-2' }],
  pots: [{ directory: 'photo-real', stem: 'vases' }],
  'steel-vases': [{ directory: 'category-real', stem: 'steel-vase' }, { directory: 'photo-real', stem: 'vases' }],
  'glass-vases': [{ directory: 'category-real', stem: 'glass-vase' }, { directory: 'photo-real', stem: 'vases' }],
  orchids: [{ directory: 'category-real', stem: 'orchid-vase' }, { directory: 'photo-real', stem: 'vases' }],
  'flower-baskets': [{ directory: 'category-real', stem: 'flower-basket' }, { directory: 'photo-real', stem: 'vases' }],
  condolences: [{ directory: 'photo-real', stem: 'condolence' }],
  'proposal-ceremony': [{ directory: 'photo-real', stem: 'pre-weddings' }],
  proposal: [{ directory: 'photo-real', stem: 'pre-weddings' }],
  'bale-boroon': [{ directory: 'photo-real', stem: 'pre-weddings' }],
  'baby-flowers': [{ directory: 'photo-real', stem: 'first-bloom' }],
  'newborn-flowers': [{ directory: 'photo-real', stem: 'first-bloom' }],
  'gender-reveal': [{ directory: 'photo-real', stem: 'first-bloom' }],
  weddings: [{ directory: 'photo-real', stem: 'wedding' }],
  'bridal-bouquet': [{ directory: 'photo-real', stem: 'wedding' }],
  'bridal-car-design': [{ directory: 'photo-real', stem: 'wedding' }],
  'groom-boutonniere': [{ directory: 'photo-real', stem: 'wedding' }],
  'woshe-distance': [{ directory: 'photo-real', stem: 'bouquets' }]
};

function safeSlug(value: string) {
  return value.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

function lookupCandidates(slug: string): AssetLookup[] {
  const normalizedSlug = safeSlug(slug);
  return [
    { directory: 'category-real', stem: normalizedSlug },
    ...(uploadedCategoryImageAliases[normalizedSlug] ?? []),
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
