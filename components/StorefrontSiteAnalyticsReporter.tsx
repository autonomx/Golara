'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

type SiteAnalyticsEventType =
  | 'page_view'
  | 'product_view'
  | 'category_view'
  | 'search_submitted'
  | 'add_to_cart'
  | 'checkout_started'
  | 'checkout_completed'
  | 'payment_method_selected';

const SITE_ANALYTICS_ENDPOINT = '/api/site-analytics/events';
const ADMIN_OR_SYSTEM_PATH_PREFIXES = ['/admin', '/api', '/_next'];

function shouldReportSiteAnalytics(pathname: string | null) {
  if (process.env.NEXT_PUBLIC_SITE_ANALYTICS_ENABLED === 'false') return false;
  if (!pathname) return false;
  if (ADMIN_OR_SYSTEM_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return false;
  if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') return false;
  return true;
}

function getAnonymousSessionId() {
  if (typeof window === 'undefined') return undefined;
  try {
    const key = 'golara_site_analytics_sid';
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    const next = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `sid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(key, next);
    return next;
  } catch {
    return undefined;
  }
}

function sendSiteAnalyticsEvent(eventType: SiteAnalyticsEventType, path: string, search: string) {
  if (!shouldReportSiteAnalytics(path)) return;

  const payload = JSON.stringify({
    eventType,
    path,
    query: search,
    locale: typeof document === 'undefined' ? undefined : document.documentElement.lang,
    anonymousSessionId: getAnonymousSessionId(),
    timestamp: Date.now()
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(SITE_ANALYTICS_ENDPOINT, new Blob([payload], { type: 'application/json' }));
    return;
  }

  void fetch(SITE_ANALYTICS_ENDPOINT, {
    method: 'POST',
    body: payload,
    headers: { 'Content-Type': 'application/json' },
    keepalive: true
  }).catch(() => undefined);
}

export function StorefrontSiteAnalyticsReporter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() || '';

  useEffect(() => {
    if (!pathname) return;
    sendSiteAnalyticsEvent('page_view', pathname, search);
  }, [pathname, search]);

  return null;
}
