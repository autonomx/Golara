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

type SiteAnalyticsEventOptions = {
  productId?: string;
  categoryId?: string;
  searchTerm?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

const SITE_ANALYTICS_ENDPOINT = '/api/site-analytics/events';
const ADMIN_OR_SYSTEM_PATH_PREFIXES = ['/admin', '/api', '/_next'];
const MAX_ID_LENGTH = 80;
const MAX_SEARCH_TERM_LENGTH = 120;

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

function getLocationSearch(queryString?: string) {
  const value = queryString ?? (typeof window === 'undefined' ? '' : window.location.search);
  return value.replace(/^\?/, '').slice(0, 320);
}

function normalizeSlugSegment(value: string) {
  try {
    return decodeURIComponent(value).trim().slice(0, MAX_ID_LENGTH) || undefined;
  } catch {
    return value.trim().slice(0, MAX_ID_LENGTH) || undefined;
  }
}

function segmentAfter(pathname: string, prefix: string) {
  if (!pathname.startsWith(prefix)) return undefined;
  const segment = pathname.slice(prefix.length).split('/').filter(Boolean)[0];
  return segment ? normalizeSlugSegment(segment) : undefined;
}

function searchTermFromQuery(queryString: string) {
  const value = new URLSearchParams(queryString).get('q')?.trim().replace(/\s+/g, ' ');
  return value ? value.slice(0, MAX_SEARCH_TERM_LENGTH) : undefined;
}

function sendSiteAnalyticsEvent(eventType: SiteAnalyticsEventType, path: string, options: SiteAnalyticsEventOptions = {}, queryString?: string) {
  if (!shouldReportSiteAnalytics(path)) return;

  const payload = JSON.stringify({
    eventType,
    path,
    query: getLocationSearch(queryString),
    locale: typeof document === 'undefined' ? undefined : document.documentElement.lang,
    productId: options.productId,
    categoryId: options.categoryId,
    searchTerm: options.searchTerm,
    anonymousSessionId: getAnonymousSessionId(),
    timestamp: Date.now(),
    metadata: options.metadata
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

function reportPathDerivedSiteEvents(pathname: string, queryString: string) {
  sendSiteAnalyticsEvent('page_view', pathname, {}, queryString);

  const productSlug = segmentAfter(pathname, '/products/');
  if (productSlug) {
    sendSiteAnalyticsEvent('product_view', pathname, { productId: productSlug }, queryString);
  }

  const categorySlug = segmentAfter(pathname, '/categories/');
  if (categorySlug) {
    sendSiteAnalyticsEvent('category_view', pathname, { categoryId: categorySlug }, queryString);
  }

  if (pathname === '/products') {
    const searchTerm = searchTermFromQuery(queryString);
    if (searchTerm) {
      sendSiteAnalyticsEvent('search_submitted', pathname, { searchTerm }, queryString);
    }
  }

  if (pathname === '/cart' && new URLSearchParams(queryString).get('cart') === 'added') {
    sendSiteAnalyticsEvent('add_to_cart', pathname, {}, queryString);
  }

  if (pathname === '/cart/checkout') {
    sendSiteAnalyticsEvent('checkout_started', pathname, {}, queryString);
  }

  if (pathname.startsWith('/orders/')) {
    sendSiteAnalyticsEvent('checkout_completed', pathname, {}, queryString);
  }
}

export function StorefrontSiteAnalyticsReporter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  useEffect(() => {
    if (!pathname) return;
    reportPathDerivedSiteEvents(pathname, queryString);
  }, [pathname, queryString]);

  useEffect(() => {
    if (!pathname) return;

    function handlePaymentMethodSelection(event: Event) {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.name !== 'paymentMethodKey' || target.type !== 'radio' || !target.checked) return;
      sendSiteAnalyticsEvent('payment_method_selected', pathname, {
        metadata: { paymentMethodKey: target.value.slice(0, MAX_ID_LENGTH) }
      }, queryString);
    }

    document.addEventListener('change', handlePaymentMethodSelection);
    return () => document.removeEventListener('change', handlePaymentMethodSelection);
  }, [pathname, queryString]);

  return null;
}
