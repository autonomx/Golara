'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

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

type SiteAnalyticsAttributionMetadata = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrerDomain?: string;
};

const SITE_ANALYTICS_ENDPOINT = '/api/site-analytics/events';
const ADMIN_OR_SYSTEM_PATH_PREFIXES = ['/admin', '/api', '/_next'];
const MAX_ID_LENGTH = 80;
const MAX_SEARCH_TERM_LENGTH = 120;
const MAX_ATTRIBUTION_LENGTH = 80;
const ATTRIBUTION_SESSION_KEY = 'golara_site_analytics_attribution';

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
      : `sid-${Date.now().toString(36)}`;
    window.sessionStorage.setItem(key, next);
    return next;
  } catch {
    return undefined;
  }
}

function getLocationSearch() {
  if (typeof window === 'undefined') return '';
  return window.location.search.replace(/^\?/, '').slice(0, 320);
}

function normalizeSlugSegment(value: string) {
  try {
    return decodeURIComponent(value).trim().slice(0, MAX_ID_LENGTH) || undefined;
  } catch {
    return value.trim().slice(0, MAX_ID_LENGTH) || undefined;
  }
}

function normalizeAttributionValue(value: string | null | undefined) {
  const trimmed = value?.trim().replace(/\s+/g, ' ');
  return trimmed ? trimmed.slice(0, MAX_ATTRIBUTION_LENGTH) : undefined;
}

function segmentAfter(pathname: string, prefix: string) {
  if (!pathname.startsWith(prefix)) return undefined;
  const segment = pathname.slice(prefix.length).split('/').filter(Boolean)[0];
  return segment ? normalizeSlugSegment(segment) : undefined;
}

function currentSearchTerm() {
  const value = new URLSearchParams(getLocationSearch()).get('q')?.trim().replace(/\s+/g, ' ');
  return value ? value.slice(0, MAX_SEARCH_TERM_LENGTH) : undefined;
}

function getExternalReferrerDomain() {
  if (typeof document === 'undefined' || typeof window === 'undefined' || !document.referrer) return undefined;
  try {
    const referrer = new URL(document.referrer);
    if (referrer.hostname === window.location.hostname) return undefined;
    return normalizeAttributionValue(referrer.hostname.toLowerCase());
  } catch {
    return undefined;
  }
}

function readStoredAttribution(): SiteAnalyticsAttributionMetadata {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SiteAnalyticsAttributionMetadata;
    return {
      utmSource: normalizeAttributionValue(parsed.utmSource),
      utmMedium: normalizeAttributionValue(parsed.utmMedium),
      utmCampaign: normalizeAttributionValue(parsed.utmCampaign),
      referrerDomain: normalizeAttributionValue(parsed.referrerDomain)
    };
  } catch {
    return {};
  }
}

function writeStoredAttribution(metadata: SiteAnalyticsAttributionMetadata) {
  if (typeof window === 'undefined') return;
  const hasAttribution = Boolean(metadata.utmSource || metadata.utmMedium || metadata.utmCampaign || metadata.referrerDomain);
  if (!hasAttribution) return;
  try {
    window.sessionStorage.setItem(ATTRIBUTION_SESSION_KEY, JSON.stringify(metadata));
  } catch {
    // Ignore storage failures; attribution must never block analytics reporting.
  }
}

function getAttributionMetadata(): SiteAnalyticsAttributionMetadata {
  const params = new URLSearchParams(getLocationSearch());
  const stored = readStoredAttribution();
  const current: SiteAnalyticsAttributionMetadata = {
    utmSource: normalizeAttributionValue(params.get('utm_source')),
    utmMedium: normalizeAttributionValue(params.get('utm_medium')),
    utmCampaign: normalizeAttributionValue(params.get('utm_campaign')),
    referrerDomain: getExternalReferrerDomain()
  };
  const next = { ...stored, ...current };
  writeStoredAttribution(next);
  return next;
}

function sendSiteAnalyticsEvent(eventType: SiteAnalyticsEventType, path: string, options: SiteAnalyticsEventOptions = {}) {
  if (!shouldReportSiteAnalytics(path)) return;

  const payload = JSON.stringify({
    eventType,
    path,
    query: getLocationSearch(),
    locale: typeof document === 'undefined' ? undefined : document.documentElement.lang,
    productId: options.productId,
    categoryId: options.categoryId,
    searchTerm: options.searchTerm,
    anonymousSessionId: getAnonymousSessionId(),
    timestamp: Date.now(),
    metadata: {
      ...getAttributionMetadata(),
      ...options.metadata
    }
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

function reportPathDerivedSiteEvents(pathname: string) {
  sendSiteAnalyticsEvent('page_view', pathname);

  const productSlug = segmentAfter(pathname, '/products/');
  if (productSlug) {
    sendSiteAnalyticsEvent('product_view', pathname, { productId: productSlug });
  }

  const categorySlug = segmentAfter(pathname, '/categories/');
  if (categorySlug) {
    sendSiteAnalyticsEvent('category_view', pathname, { categoryId: categorySlug });
  }

  if (pathname === '/products') {
    const searchTerm = currentSearchTerm();
    if (searchTerm) {
      sendSiteAnalyticsEvent('search_submitted', pathname, { searchTerm });
    }
  }

  if (pathname === '/cart' && new URLSearchParams(getLocationSearch()).get('cart') === 'added') {
    sendSiteAnalyticsEvent('add_to_cart', pathname);
  }

  if (pathname === '/cart/checkout') {
    sendSiteAnalyticsEvent('checkout_started', pathname);
  }

  if (pathname.startsWith('/orders/')) {
    sendSiteAnalyticsEvent('checkout_completed', pathname);
  }
}

export function StorefrontSiteAnalyticsReporter() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    reportPathDerivedSiteEvents(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!pathname) return;

    function handlePaymentMethodSelection(event: Event) {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.name !== 'paymentMethodKey' || target.type !== 'radio' || !target.checked) return;
      sendSiteAnalyticsEvent('payment_method_selected', pathname, {
        metadata: { paymentMethodKey: target.value.slice(0, MAX_ID_LENGTH) }
      });
    }

    document.addEventListener('change', handlePaymentMethodSelection);
    return () => document.removeEventListener('change', handlePaymentMethodSelection);
  }, [pathname]);

  return null;
}
