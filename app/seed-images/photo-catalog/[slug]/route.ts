import { NextResponse } from 'next/server';

import { renderSeedProductPhotoSvg } from '@/lib/seed-product-images';

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const svg = renderSeedProductPhotoSvg(slug);

  if (!svg) {
    return new NextResponse('Not found', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8'
      }
    });
  }

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=31536000, immutable'
    }
  });
}
