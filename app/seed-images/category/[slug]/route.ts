import { NextResponse } from 'next/server';

import { findHomepageCategoryTile, getCategoryPalette } from '@/lib/homepage-category-tiles';

type RouteContext = { params: Promise<{ slug: string }> };

function labelFromSlug(slug: string) {
  return slug.split('-').map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' ');
}

function flowerCluster(main: string, light: string, background: string) {
  return `<circle cx="410" cy="455" r="86" fill="${main}" opacity=".95"/><circle cx="505" cy="375" r="108" fill="${light}" opacity=".95"/><circle cx="625" cy="395" r="116" fill="${main}" opacity=".9"/><circle cx="750" cy="480" r="94" fill="${light}" opacity=".95"/><circle cx="535" cy="555" r="86" fill="${background}" opacity=".95"/><circle cx="675" cy="575" r="78" fill="${background}" opacity=".9"/>`;
}

function sceneShape(slug: string, dark: string, main: string) {
  if (slug.includes('cake') || slug.includes('balloon')) return `<circle cx="420" cy="360" r="68" fill="${main}" opacity=".7"/><circle cx="495" cy="320" r="54" fill="#fff" opacity=".82"/><line x1="420" y1="428" x2="520" y2="680" stroke="${dark}" stroke-width="4" opacity=".35"/><rect x="455" y="690" width="300" height="170" rx="34" fill="#fff" opacity=".94"/><rect x="490" y="650" width="230" height="70" rx="28" fill="${main}" opacity=".28"/>`;
  if (slug.includes('wedding') || slug.includes('proposal') || slug.includes('ceremony') || slug.includes('bridal')) return `<path d="M345 860 C430 655 520 560 600 520 C680 560 770 655 855 860 Z" fill="#fff" opacity=".86"/><path d="M410 845 C470 690 540 610 600 585 C660 610 730 690 790 845 Z" fill="${main}" opacity=".14"/><circle cx="600" cy="455" r="76" fill="#fff" opacity=".9"/>`;
  if (slug.includes('pot') || slug.includes('vase') || slug.includes('orchid') || slug.includes('basket')) return `<path d="M420 610 H780 L720 900 H480 Z" fill="#fff" opacity=".94"/><rect x="460" y="580" width="280" height="40" rx="20" fill="${dark}" opacity=".18"/>`;
  if (slug.includes('royal') || slug.includes('vip')) return `<rect x="385" y="560" width="430" height="310" rx="44" fill="#fff" opacity=".9"/><path d="M450 560 L505 465 L560 560 L615 455 L670 560 L725 465 L780 560 Z" fill="${dark}" opacity=".25"/><rect x="455" y="800" width="290" height="78" rx="28" fill="${dark}" opacity=".66"/>`;
  return `<rect x="385" y="570" width="430" height="300" rx="42" fill="#fff" opacity=".9"/><rect x="455" y="800" width="290" height="78" rx="28" fill="${dark}" opacity=".62"/>`;
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const tile = findHomepageCategoryTile(slug);
  const { dark, main, light, background } = tile?.palette ?? getCategoryPalette(slug);
  const label = tile?.subtitle ?? labelFromSlug(slug);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><defs><radialGradient id="bg" cx="45%" cy="32%" r="70%"><stop offset="0%" stop-color="${light}"/><stop offset="68%" stop-color="${background}"/><stop offset="100%" stop-color="${dark}" stop-opacity=".18"/></radialGradient><filter id="shadow"><feDropShadow dx="0" dy="28" stdDeviation="28" flood-color="${dark}" flood-opacity=".22"/></filter><filter id="blur"><feGaussianBlur stdDeviation="12"/></filter></defs><rect width="1200" height="900" fill="url(#bg)"/><circle cx="1040" cy="150" r="170" fill="#fff" opacity=".22" filter="url(#blur)"/><circle cx="170" cy="205" r="110" fill="#fff" opacity=".25" filter="url(#blur)"/><ellipse cx="600" cy="820" rx="360" ry="58" fill="${dark}" opacity=".13" filter="url(#blur)"/><g filter="url(#shadow)">${flowerCluster(main, light, background)}${sceneShape(slug, dark, main)}</g><rect x="56" y="54" width="1088" height="792" rx="44" fill="none" stroke="#fff" stroke-width="8" stroke-opacity=".58"/><text x="88" y="800" fill="${dark}" font-size="40" font-family="Arial,Helvetica,sans-serif" font-weight="700">${label}</text></svg>`;
  return new NextResponse(svg, { status: 200, headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'public, max-age=31536000, immutable' } });
}
