import Link from 'next/link';

import { AdminOrderRevenueSummaryPanel } from '@/components/admin/AdminOrderRevenueSummaryPanel';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { AdminSiteAnalyticsPanel } from '@/components/admin/AdminSiteAnalyticsPanel';
import { ADMIN_ANALYTICS_RANGE_DAYS, normalizeAdminAnalyticsRangeDays } from '@/lib/analytics/admin-analytics-range';
import { requireAdminRouteSession } from '@/lib/admin-page-auth-boundary';
import { getAdminIdentity, isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { EMPTY_ORDER_REVENUE_SUMMARY, orderRevenueSummaryService } from '@/lib/analytics/order-revenue-summary';
import { EMPTY_SITE_ANALYTICS_SUMMARY, siteAnalyticsSummaryService } from '@/lib/analytics/site-analytics-summary';
import { listAdminCategories, listAdminProducts, listMedia } from '@/lib/cms/catalog-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import type { SupportedLocale } from '@/lib/i18n/locales';

export const dynamic = 'force-dynamic';

type AdminAnalyticsLocale = 'en' | 'fa';
type SearchParams = Record<string, string | string[] | undefined>;

const copy = {
  en: {
    eyebrow: 'Admin / Analytics',
    title: 'Analytics workspace',
    body: 'Business analytics, site analytics, order health, inventory pressure, inquiry operations, recent activity, and readiness signals in one place.',
    badge: 'Dedicated analytics page',
    note: 'This workspace includes lightweight server-rendered business and site charts with accessible data-table fallbacks. Site analytics uses privacy-safe first-party events and excludes admin routes.',
    rangeEyebrow: 'Analytics range',
    rangeBody: 'Change the reporting window for business and site charts without leaving the analytics workspace.',
    rangeSuffix: 'days'
  },
  fa: {
    eyebrow: 'مدیریت / تحلیل‌ها',
    title: 'فضای کاری تحلیل‌ها',
    body: 'تحلیل کسب‌وکار، تحلیل سایت، وضعیت سفارش، فشار موجودی، عملیات درخواست‌ها، فعالیت اخیر و سیگنال‌های آمادگی در یک صفحه.',
    badge: 'صفحه اختصاصی تحلیل‌ها',
    note: 'این فضا نمودارهای سبک کسب‌وکار و سایت را با جدول داده دسترس‌پذیر نمایش می‌دهد. تحلیل سایت از رویدادهای داخلی و حریم‌خصوصی‌محور استفاده می‌کند و مسیرهای مدیریت را ثبت نمی‌کند.',
    rangeEyebrow: 'بازه تحلیل',
    rangeBody: 'بازه گزارش نمودارهای کسب‌وکار و سایت را بدون خروج از فضای تحلیل تغییر دهید.',
    rangeSuffix: 'روز'
  }
} as const;

function localeKey(locale?: SupportedLocale | string | null): AdminAnalyticsLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function rangeHref(days: number) {
  return `/admin/analytics?range=${days}`;
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  await requireAdminRouteSession();

  const locale = await resolveStorefrontLocale();
  const labels = copy[localeKey(locale)];
  const params = searchParams ? await searchParams : {};
  const rangeDays = normalizeAdminAnalyticsRangeDays(firstParam(params.range));
  const returnTo = rangeHref(rangeDays);
  const authenticated = await isAdminAuthenticated();
  const authConfigured = isAdminAuthConfigured();
  const identity = await getAdminIdentity();
  const [products, categories, media, orderRevenueSummary, siteAnalyticsSummary] = await Promise.all([
    listAdminProducts(),
    listAdminCategories(),
    listMedia(),
    authenticated ? orderRevenueSummaryService.summary({ rangeDays }) : Promise.resolve({ ...EMPTY_ORDER_REVENUE_SUMMARY, analyticsRangeDays: rangeDays }),
    authenticated ? siteAnalyticsSummaryService.summary({ rangeDays }) : Promise.resolve({ ...EMPTY_SITE_ANALYTICS_SUMMARY, analyticsRangeDays: rangeDays })
  ]);

  return (
    <AdminPageShell
      activeTab="analytics"
      activeNavKey="analytics"
      authenticated={authenticated}
      authConfigured={authConfigured}
      adminLabel={identity.label ?? identity.email}
      locale={locale}
      returnTo={returnTo}
      productCount={products.length}
      categoryCount={categories.length}
      mediaCount={media.length}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{labels.eyebrow}</p>
              <h1 className="mt-1 text-3xl font-bold text-stone-950">{labels.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{labels.body}</p>
            </div>
            <span className="rounded-full bg-olive/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-olive">{labels.badge}</span>
          </div>
          <p className="mt-4 rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-600">{labels.note}</p>
          <div className="mt-4 rounded-lg border border-olive/20 bg-olive/5 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-olive">{labels.rangeEyebrow}</p>
            <p className="mt-1 text-sm leading-6 text-stone-600">{labels.rangeBody}</p>
            <div className="mt-3 flex flex-wrap gap-2" aria-label={labels.rangeEyebrow}>
              {ADMIN_ANALYTICS_RANGE_DAYS.map((days) => {
                const active = days === rangeDays;
                return (
                  <Link
                    key={days}
                    href={rangeHref(days)}
                    aria-current={active ? 'page' : undefined}
                    className={active
                      ? 'rounded-full bg-olive px-4 py-2 text-sm font-bold text-white shadow-sm'
                      : 'rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:border-olive hover:text-olive'}
                  >
                    {days} {labels.rangeSuffix}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
        <AdminSiteAnalyticsPanel summary={siteAnalyticsSummary} />
        <AdminOrderRevenueSummaryPanel summary={orderRevenueSummary} />
      </div>
    </AdminPageShell>
  );
}
