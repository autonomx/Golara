import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type WebVitalName = 'CLS' | 'FID' | 'FCP' | 'INP' | 'LCP' | 'TTFB';

type WebVitalPayload = {
  id?: unknown;
  name?: unknown;
  value?: unknown;
  rating?: unknown;
  delta?: unknown;
  navigationType?: unknown;
  pathname?: unknown;
  locale?: unknown;
  timestamp?: unknown;
};

const WEB_VITAL_NAMES = new Set<WebVitalName>(['CLS', 'FID', 'FCP', 'INP', 'LCP', 'TTFB']);
const MAX_BODY_BYTES = 4096;
const MAX_PATHNAME_LENGTH = 180;
const MAX_LOCALE_LENGTH = 16;
const MAX_NAVIGATION_TYPE_LENGTH = 48;

function normalizeString(value: unknown, maxLength: number) {
  if (typeof value !== 'string') {
    return undefined;
  }

  return value.slice(0, maxLength);
}

function normalizeNumber(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(0, Math.round(value));
}

function normalizeRating(value: unknown) {
  if (value === 'good' || value === 'needs-improvement' || value === 'poor') {
    return value;
  }

  return undefined;
}

function normalizePayload(payload: WebVitalPayload) {
  const name = normalizeString(payload.name, 8) as WebVitalName | undefined;
  const value = normalizeNumber(payload.value);

  if (!name || !WEB_VITAL_NAMES.has(name) || value === undefined) {
    return null;
  }

  return {
    id: normalizeString(payload.id, 128),
    name,
    value,
    rating: normalizeRating(payload.rating),
    delta: normalizeNumber(payload.delta),
    navigationType: normalizeString(payload.navigationType, MAX_NAVIGATION_TYPE_LENGTH),
    pathname: normalizeString(payload.pathname, MAX_PATHNAME_LENGTH),
    locale: normalizeString(payload.locale, MAX_LOCALE_LENGTH),
    timestamp: normalizeNumber(payload.timestamp),
  };
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? '0');

  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let payload: WebVitalPayload;

  try {
    payload = (await request.json()) as WebVitalPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const metric = normalizePayload(payload);

  if (!metric) {
    return NextResponse.json({ error: 'Invalid metric' }, { status: 400 });
  }

  // Keep the ingestion endpoint dependency-free for now. Production log drains or
  // platform observability can aggregate these structured events into dashboards.
  console.info('storefront_web_vital', metric);

  return new NextResponse(null, { status: 204 });
}
