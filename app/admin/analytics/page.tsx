import Link from 'next/link';

import { AdminAnalyticsGuidancePanel } from '@/components/admin/AdminAnalyticsGuidancePanel';
import { AdminCategorySalesAnalyticsPanel } from '@/components/admin/AdminCategorySalesAnalyticsPanel';
import { AdminOrderRevenueSummaryPanel } from '@/components/admin/AdminOrderRevenueSummaryPanel';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { AdminProductSalesAnalyticsPanel } from '@/components/admin/AdminProductSalesAnalyticsPanel';
import { AdminSiteAnalyticsPanel } from '@/components/admin/AdminSiteAnalyticsPanel';
import { AdminSiteAnalyticsRetentionStatusPanel } from '@/components/admin/AdminSiteAnalyticsRetentionStatusPanel';
import { ADMIN_ANALYTICS_RANGE_DAYS, normalizeAdminAnalyticsRangeDays } from '@/lib/analytics/admin-analytics-range';
import { EMPTY_CATEGORY_SALES_ANALYTICS_SUMMARY, categorySalesAnalyticsService } from '@/lib/analytics/category-sales-analytics';
import { requireAdminRouteSession } from '@/lib/admin-page-auth-boundary';
import { getAdminIdentity, isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { EMPTY_ORDER_REVENUE_SUMMARY, orderRevenueSummaryService } from '@/lib/analytics/order-revenue-summary';
import { EMPTY_PRODUCT_SALES_ANALYTICS_SUMMARY, productSalesAnalyticsService } from '@/lib/analytics/product-sales-analytics';
import { EMPTY_SITE_ANALYTICS_SUMMARY, siteAnalyticsSummaryService } from '@/lib/analytics/site-analytics-summary';
import { emptySiteAnalyticsRetentionSummary, siteAnalyticsRetentionService } from '@/lib/analytics/site-analytics-retention';
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
    rangeSuffix: 'days',
    exportEyebrow: 'CSV exports',
    exportBody: 'Download aggregate analytics for the selected range. Exports use summaries and charts only; raw visitor sessions are not exported.',
    businessCsv: 'Download business CSV',
    siteCsv: 'Download site CSV',
    privacyEyebrow: 'Privacy and retention',
    privacyBody: 'First-party site analytics stay operational and privacy-safe: admin/API routes are excluded, Do Not Track is honored, exports remain aggregate-only, and raw event retention should stay limited.',
    privacyDoc: 'Read privacy and retention policy',
    disableLabel: 'Disable storefront analytics with NEXT_PUBLIC_SITE_ANALYTICS_ENABLED=false.',
    retentionLabel: 'Retention target: raw site events up to 180 days; prefer aggregate summaries for long-lived reporting.',
    sectionEyebrow: 'Analytics sections',
    sectionBody: 'Jump directly to the analytics area you need instead of scrolling through the full workspace.',
    sectionLabel: 'Jump to analytics section',
    guidanceCenter: 'Guidance',
    businessSummary: 'Business summary',
    businessCharts: 'Business charts',
    productSales: 'Product sales',
    categorySales: 'Category sales',
    siteFunnel: 'Site funnel',
    privacyControls: 'Privacy',
    retentionStatus: 'Retention status',
    productPerformance: 'Products',
    inventoryPressure: 'Inventory',
    fulfillmentOps: 'Fulfillment',
    paymentAlerts: 'Payments',
    inquiryOps: 'Inquiries',
    readinessHealth: 'Readiness'
  },
  fa: {
    eyebrow: 'مدیریت / تحلیل‌ها',
    title: 'فضای کاری تحلیل‌ها',
    body: 'تحلیل کسب‌وکار، تحلیل سایت، وضعیت سفارش، فشار موجودی، عملیات درخواست‌ها، فعالیت اخیر و سیگنال‌های آمادگی در یک صفحه.',
    badge: 'صفحه اختصاصی تحلیل‌ها',
    note: 'این فضا نمودارهای سبک کسب‌وکار و سایت را با جدول داده دسترس‌پذیر نمایش می‌دهد. تحلیل سایت از رویدادهای داخلی و حریم‌خصوصی‌محور استفاده می‌کند و مسیرهای مدیریت را ثبت نمی‌کند.',
    rangeEyebrow: 'بازه تحلیل',
    rangeBody: 'بازه گزارش نمودارهای کسب‌وکار و سایت را بدون خروج از فضای تحلیل تغییر دهید.',
    rangeSuffix: 'روز',
    exportEyebrow: 'خروجی CSV',
    exportBody: 'تحلیل‌های تجمیعی بازه انتخاب‌شده را دانلود کنید. خروجی‌ها فقط از خلاصه‌ها و نمودارها استفاده می‌کنند و نشست خام بازدیدکننده صادر نمی‌شود.',
    businessCsv: 'دانلود CSV کسب‌وکار',
    siteCsv: 'دانلود CSV سایت',
    privacyEyebrow: 'حریم خصوصی و نگهداری',
    privacyBody: 'تحلیل داخلی سایت عملیاتی و حریم‌خصوصی‌محور می‌ماند: مسیرهای مدیریت و API ثبت نمی‌شوند، Do Not Track رعایت می‌شود، خروجی‌ها تجمیعی هستند و نگهداری رویداد خام باید محدود بماند.',
    privacyDoc: 'خواندن سیاست حریم خصوصی و نگهداری',
    disableLabel: 'برای غیرفعال‌کردن تحلیل سایت، NEXT_PUBLIC_SITE_ANALYTICS_ENABLED=false را تنظیم کنید.',
    retentionLabel: 'هدف نگهداری: رویداد خام سایت حداکثر تا ۱۸۰ روز؛ برای گزارش‌های بلندمدت از خلاصه‌های تجمیعی استفاده شود.',
    sectionEyebrow: 'بخش‌های تحلیل',
    sectionBody: 'بدون پیمایش کل صفحه، مستقیم به بخش تحلیلی موردنیاز بروید.',
    sectionLabel: 'رفتن به بخش تحلیل',
    guidanceCenter: 'راهنما',
    businessSummary: 'خلاصه کسب‌وکار',
    businessCharts: 'نمودارهای کسب‌وکار',
    productSales: 'فروش محصول',
    categorySales: 'فروش دسته‌بندی',
    siteFunnel: 'قیف سایت',
    privacyControls: 'حریم خصوصی',
    retentionStatus: 'وضعیت نگهداری',
    productPerformance: 'محصولات',
    inventoryPressure: 'موجودی',
    fulfillmentOps: 'ارسال',
    paymentAlerts: 'پرداخت‌ها',
    inquiryOps: 'درخواست‌ها',
    readinessHealth: 'آمادگی'
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

function exportHref(report: 'business' | 'site', days: number) {
  return `/admin/analytics/export?report=${report}&range=${days}`;
}

function sectionHref(anchor: string, days: number) {
  return `${rangeHref(days)}#${anchor}`;
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  await requireAdminRouteSession();

  const locale = await resolveStorefrontLocale();
  const labels = copy[localeKey(locale)];
  const params = searchParams ? await searchParams : {};
  const rangeDays = normalizeAdminAnalyticsRangeDays(firstParam(params.range));
  const returnTo = rangeHref(rangeDays);
  const sectionLinks = [
    { href: sectionHref('analytics-guidance', rangeDays), label: labels.guidanceCenter },
    { href: sectionHref('order-analytics', rangeDays), label: labels.businessSummary },
    { href: sectionHref('business-analytics-charts', rangeDays), label: labels.businessCharts },
    { href: sectionHref('product-sales-analytics', rangeDays), label: labels.productSales },
    { href: sectionHref('category-sales-analytics', rangeDays), label: labels.categorySales },
    { href: sectionHref('site-analytics', rangeDays), label: labels.siteFunnel },
    { href: sectionHref('analytics-privacy-retention', rangeDays), label: labels.privacyControls },
    { href: sectionHref('site-analytics-retention-status', rangeDays), label: labels.retentionStatus },
    { href: sectionHref('product-analytics', rangeDays), label: labels.productPerformance },
    { href: sectionHref('inventory-analytics', rangeDays), label: labels.inventoryPressure },
    { href: sectionHref('fulfillment-analytics', rangeDays), label: labels.fulfillmentOps },
    { href: sectionHref('payment-analytics', rangeDays), label: labels.paymentAlerts },
    { href: sectionHref('inquiry-operations', rangeDays), label: labels.inquiryOps },
    { href: sectionHref('readiness-analytics', rangeDays), label: labels.readinessHealth }
  ];
  const authenticated = await isAdminAuthenticated();
  const authConfigured = isAdminAuthConfigured();
  const identity = await getAdminIdentity();
  const [
    products,
    categories,
    media,
    orderRevenueSummary,
    productSalesAnalyticsSummary,
    categorySalesAnalyticsSummary,
    siteAnalyticsSummary,
    siteAnalyticsRetentionSummary
  ] = await Promise.all([
    listAdminProducts(),
    listAdminCategories(),
    listMedia(),
    authenticated ? orderRevenueSummaryService.summary({ rangeDays }) : Promise.resolve({ ...EMPTY_ORDER_REVENUE_SUMMARY, analyticsRangeDays: rangeDays }),
    authenticated ? productSalesAnalyticsService.summary({ rangeDays }) : Promise.resolve({ ...EMPTY_PRODUCT_SALES_ANALYTICS_SUMMARY, analyticsRangeDays: rangeDays }),
    authenticated ? categorySalesAnalyticsService.summary({ rangeDays }) : Promise.resolve({ ...EMPTY_CATEGORY_SALES_ANALYTICS_SUMMARY, analyticsRangeDays: rangeDays }),
    authenticated ? siteAnalyticsSummaryService.summary({ rangeDays }) : Promise.resolve({ ...EMPTY_SITE_ANALYTICS_SUMMARY, analyticsRangeDays: rangeDays }),
    authenticated ? siteAnalyticsRetentionService.summary() : Promise.resolve(emptySiteAnalyticsRetentionSummary())
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
          <div id="analytics-csv-exports" className="mt-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{labels.exportEyebrow}</p>
            <p className="mt-1 text-sm leading-6 text-stone-600">{labels.exportBody}</p>
            <div className="mt-3 flex flex-wrap gap-2" aria-label={labels.exportEyebrow}>
              <Link
                href={exportHref('business', rangeDays)}
                className="rounded-full border border-olive bg-white px-4 py-2 text-sm font-bold text-olive hover:bg-olive hover:text-white"
              >
                {labels.businessCsv}
              </Link>
              <Link
                href={exportHref('site', rangeDays)}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:border-olive hover:text-olive"
              >
                {labels.siteCsv}
              </Link>
            </div>
          </div>
          <div id="analytics-privacy-retention" className="mt-4 scroll-mt-24 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-800">{labels.privacyEyebrow}</p>
            <p className="mt-1 text-sm leading-6 text-blue-950">{labels.privacyBody}</p>
            <ul className="mt-3 grid gap-2 text-sm text-blue-950 sm:grid-cols-2">
              <li>{labels.disableLabel}</li>
              <li>{labels.retentionLabel}</li>
            </ul>
            <Link
              href="/docs/site-analytics-privacy-retention-policy.md"
              className="mt-3 inline-flex rounded-full border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-800 hover:bg-blue-100"
            >
              {labels.privacyDoc}
            </Link>
          </div>
          <div id="analytics-section-index" className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{labels.sectionEyebrow}</p>
            <p className="mt-1 text-sm leading-6 text-stone-600">{labels.sectionBody}</p>
            <nav aria-label={labels.sectionLabel} className="mt-3 flex flex-wrap gap-2">
              {sectionLinks.map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:border-olive hover:text-olive"
                >
                  {section.label}
                </Link>
              ))}
            </nav>
          </div>
        </section>
        <AdminAnalyticsGuidancePanel
          orderSummary={orderRevenueSummary}
          productSalesSummary={productSalesAnalyticsSummary}
          categorySalesSummary={categorySalesAnalyticsSummary}
          siteSummary={siteAnalyticsSummary}
        />
        <AdminOrderRevenueSummaryPanel summary={orderRevenueSummary} />
        <AdminProductSalesAnalyticsPanel summary={productSalesAnalyticsSummary} />
        <AdminCategorySalesAnalyticsPanel summary={categorySalesAnalyticsSummary} />
        <AdminSiteAnalyticsPanel summary={siteAnalyticsSummary} />
        <AdminSiteAnalyticsRetentionStatusPanel summary={siteAnalyticsRetentionSummary} />
      </div>
    </AdminPageShell>
  );
}
