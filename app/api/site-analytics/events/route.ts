import { NextResponse } from 'next/server';

import { assertSameOriginServerAction } from '@/lib/server-action-origin';
import { SITE_ANALYTICS_EVENT_TYPES, type SiteAnalyticsEventType } from '@/lib/analytics/site-analytics-summary';
import { hasDatabase, prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

type SiteAnalyticsPayload = {
  eventType?: unknown;
  path?: unknown;
  query?: unknown;
  locale?: unknown;
  productId?: unknown;
  categoryId?: unknown;
  searchTerm?: unknown;
  anonymousSessionId?: unknown;
  timestamp?: unknown;
  metadata?: unknown;
};

const MAX_BODY_BYTES = 4096;
const MAX_PATH_LENGTH = 180;
const MAX_QUERY_LENGTH = 320;
const MAX_LOCALE_LENGTH = 16;
const MAX_ID_LENGTH = 80;
const MAX_SEARCH_TERM_LENGTH = 120;
const MAX_SESSION_LENGTH = 96;

function normalizeString(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function normalizePath(value: unknown) {
  const path = normalizeString(value, MAX_PATH_LENGTH);
  if (!path || !path.startsWith('/')) return undefined;
  if (path === '/admin' || path.startsWith('/admin/') || path === '/api' || path.startsWith('/api/')) return undefined;
  return path;
}

function normalizeEventType(value: unknown): SiteAnalyticsEventType | undefined {
  const eventType = normalizeString(value, 48)?.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return SITE_ANALYTICS_EVENT_TYPES.has(eventType as SiteAnalyticsEventType) ? eventType as SiteAnalyticsEventType : undefined;
}

function normalizePayload(payload: SiteAnalyticsPayload) {
  const eventType = normalizeEventType(payload.eventType);
  const path = normalizePath(payload.path);

  if (!eventType || !path) return null;

  return {
    eventType,
    path,
    query: normalizeString(payload.query, MAX_QUERY_LENGTH),
    locale: normalizeString(payload.locale, MAX_LOCALE_LENGTH),
    productId: normalizeString(payload.productId, MAX_ID_LENGTH),
    categoryId: normalizeString(payload.categoryId, MAX_ID_LENGTH),
    searchTerm: normalizeString(payload.searchTerm, MAX_SEARCH_TERM_LENGTH),
    anonymousSessionId: normalizeString(payload.anonymousSessionId, MAX_SESSION_LENGTH),
    metadata: {
      capturedBy: 'first_party_site_analytics',
      timestamp: typeof payload.timestamp === 'number' && Number.isFinite(payload.timestamp) ? Math.max(0, Math.round(payload.timestamp)) : null
    }
  };
}

function isMissingSiteAnalyticsTableError(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
  const message = error instanceof Error ? error.message : '';
  return code === 'P2021' || code === 'P2022' || /SiteAnalyticsEvent|site analytics/i.test(message);
}

export async function POST(request: Request) {
  try {
    // Same-origin CSRF boundary for browser-sent first-party site analytics writes.
    await assertSameOriginServerAction();
  } catch {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let payload: SiteAnalyticsPayload;
  try {
    payload = (await request.json()) as SiteAnalyticsPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = normalizePayload(payload);
  if (!event) {
    return NextResponse.json({ error: 'Invalid site analytics event' }, { status: 400 });
  }

  if (!hasDatabase()) {
    console.info('site_analytics_event', event);
    return new NextResponse(null, { status: 204 });
  }

  try {
    await prisma.siteAnalyticsEvent.create({ data: event });
  } catch (error) {
    if (isMissingSiteAnalyticsTableError(error)) {
      console.info('site_analytics_event_table_missing', event);
      return new NextResponse(null, { status: 204 });
    }
    throw error;
  }

  return new NextResponse(null, { status: 204 });
}
