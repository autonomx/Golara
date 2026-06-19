import Link from 'next/link';

import { AdminAnalyticsGuidancePanel } from '@/components/admin/AdminAnalyticsGuidancePanel';
import { AdminAnalyticsLayoutGroupHeaders } from '@/components/admin/AdminAnalyticsLayoutGroupHeaders';
import { AdminCategorySalesAnalyticsPanel } from '@/components/admin/AdminCategorySalesAnalyticsPanel';
import { AdminOrderRevenueSummaryPanel } from '@/components/admin/AdminOrderRevenueSummaryPanel';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { AdminProductSalesAnalyticsPanel } from '@/components/admin/AdminProductSalesAnalyticsPanel';
import { AdminSiteAnalyticsPanel } from '@/components/admin/AdminSiteAnalyticsPanel';
import { AdminSiteAnalyticsRetentionStatusPanel } from '@/components/admin/AdminSiteAnalyticsRetentionStatusPanel';
import { buildAdminAnalyticsLayoutPreview } from '@/lib/analytics/admin-analytics-layout';
import {
  ADMIN_ANALYTICS_RANGE_DAYS,
  adminAnalyticsRangeQueryString,
  resolveAdminAnalyticsRange,
  type AdminAnalyticsResolvedRange
} from '@/lib/analytics/admin-analytics-range';
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
    rangeActiveLabel: 'Selected range',
    rangeActiveBody: 'Charts, section links, and CSV exports use this selected reporting window.',
    rangeSuffix: 'days',
    customRangeEyebrow: 'Custom range',
    customRangeBody: 'Use exact UTC start and end dates when preset ranges are not specific enough.',
    customStartLabel: 'Start date',
    customEndLabel: 'End date',
    customApply: 'Apply custom range',
    customHint: 'Dates must use YYYY-MM-DD. Invalid or reversed dates fall back to the default preset.',
    exportEyebrow: 'CSV exports',
    exportBody: 'Download aggregate analytics for the selected range. Exports use the same summaries and charts shown on this page.',
    exportOwnerOnly: 'CSV exports are owner-only. Staff can view operational analytics here, but export links are hidden until an owner session is active.',
    businessCsv: 'Download business CSV',
    siteCsv: 'Download site CSV',
    privacyEyebrow: 'Privacy and retention',
    privacyBody: 'First-party site analytics stay operational and privacy-safe: admin/API routes are excluded, Do Not Track is honored, exports remain aggregate-only, and event retention should stay limited.',
    privacyDoc: 'Read privacy and retention policy',
    disableLabel: 'Disable storefront analytics with NEXT_PUBLIC_SITE_ANALYTICS_ENABLED=false.',
    retentionLabel: 'Retention target: site events up to 180 days; prefer aggregate summaries for long-lived reporting.',
    roleEyebrow: 'Role-aware visibility',
    roleOwnerBody: 'Owner session: full analytics visibility, aggregate CSV exports, privacy guidance, and event-retention status are available.',
    roleStaffBody: 'Staff session: operational analytics remain visible, while owner-only exports and retention details are hidden.',
    roleOwnerBadge: 'Owner controls active',
    roleStaffBadge: 'Staff view',
    retentionOwnerOnly: 'Event-retention status is owner-only. Staff can still review aggregate business and site analytics, but retention diagnostics require an owner session.',
    sectionEyebrow: 'Analytics sections',
    sectionBody: 'Jump directly to the analytics area you need instead of scrolling through the full workspace.',
    sectionLabel: 'Jump to analytics section',
    groupHeaders: 'Dashboard groups',
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
    rangeActiveLabel: 'بازه انتخاب‌شده',
    rangeActiveBody: 'نمودارها، لینک‌های بخش‌ها و خروجی‌های CSV از همین بازه گزارش استفاده می‌کنند.',
    rangeSuffix: 'روز',
    customRangeEyebrow: 'بازه سفارشی',
    customRangeBody: 'وقتی بازه‌های آماده کافی نیستند، تاریخ شروع و پایان UTC را دقیق وارد کنید.',
    customStartLabel: 'تاریخ شروع',
    customEndLabel: 'تاریخ پایان',
    customApply: 'اعمال بازه سفارشی',
    customHint: 'تاریخ‌ها باید با قالب YYYY-MM-DD باشند. تاریخ نامعتبر یا وارونه به بازه پیش‌فرض برمی‌گردد.',
    exportEyebrow: 'خروجی CSV',
    exportBody: 'تحلیل‌های تجمیعی بازه انتخاب‌شده را دانلود کنید. خروجی‌ها از همان خلاصه‌ها و نمودارهای این صفحه استفاده می‌کنند.',
    exportOwnerOnly: 'خروجی CSV فقط برای مالک است. کارکنان می‌توانند تحلیل‌های عملیاتی را ببینند، اما لینک‌های خروجی تا زمان ورود مالک پنهان می‌مانند.',
    businessCsv: 'دانلود CSV کسب‌وکار',
    siteCsv: 'دانلود CSV سایت',
    privacyEyebrow: 'حریم خصوصی و نگهداری',
    privacyBody: 'تحلیل داخلی سایت عملیاتی و حریم‌خصوصی‌محور می‌ماند: مسیرهای مدیریت و API ثبت نمی‌شوند، Do Not Track رعایت می‌شود، خروجی‌ها تجمیعی هستند و نگهداری رویداد باید محدود بماند.',
    privacyDoc: 'خواندن سیاست حریم خصوصی و نگهداری',
    disableLabel: 'برای غیرفعال‌کردن تحلیل سایت، NEXT_PUBLIC_SITE_ANALYTICS_ENABLED=false را تنظیم کنید.',
    retentionLabel: 'هدف نگهداری: رویدادهای سایت حداکثر تا ۱۸۰ روز؛ برای گزارش‌های بلندمدت از خلاصه‌های تجمیعی استفاده شود.',
    roleEyebrow: 'نمایش بر اساس نقش',
    roleOwnerBody: 'نشست مالک: دسترسی کامل به تحلیل‌ها، خروجی‌های CSV تجمیعی، راهنمای حریم خصوصی و وضعیت نگهداری رویداد فعال است.',
    roleStaffBody: 'نشست کارکنان: تحلیل عملیاتی قابل مشاهده است، اما خروجی‌های مالک و جزئیات نگهداری پنهان می‌مانند.',
    roleOwnerBadge: 'کنترل مالک فعال',
    roleStaffBadge: 'نمای کارکنان',
    retentionOwnerOnly: 'وضعیت نگهداری رویداد فقط برای مالک است. کارکنان همچنان می‌توانند تحلیل‌های تجمیعی کسب‌وکار و سایت را ببینند، اما تشخیص‌های نگهداری نیازمند نشست مالک است.',
    sectionEyebrow: 'بخش‌های تحلیل',
    sectionBody: 'بدون پیمایش کل صفحه، مستقیم به بخش تحلیلی موردنیاز بروید.',
    sectionLabel: 'رفتن به بخش تحلیل',
    groupHeaders: 'گروه‌های داشبورد',
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

function analyticsHref(range: AdminAnalyticsResolvedRange, extra: Record<string, string> = {}) {
  return `/admin/analytics?${adminAnalyticsRangeQueryString(range, extra)}`;
}

function exportHref(report: 'business' | 'site', range: AdminAnalyticsResolvedRange) {
  return `/admin/analytics/export?${adminAnalyticsRangeQueryString(range, { report })}`;
}

function sectionHref(anchor: string, range: AdminAnalyticsResolvedRange) {
  return `${analyticsHref(range)}#${anchor}`;
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  await requireAdminRouteSession();

  const locale = await resolveStorefrontLocale();
  const labels = copy[localeKey(locale)];
  const params = searchParams ? await searchParams : {};
  const analyticsRange = resolveAdminAnalyticsRange(new Date(), {
    range: firstParam(params.range),
    start: firstParam(params.start),
    end: firstParam(params.end)
  });
  const rangeDays = analyticsRange.rangeDays;
  const returnTo = analyticsHref(analyticsRange);
  const layoutPreview = buildAdminAnalyticsLayoutPreview(analyticsRange);
  const sectionLinks = [
    { href: sectionHref('analytics-layout-groups', analyticsRange), label: labels.groupHeaders },
    { href: sectionHref('analytics-guidance', analyticsRange), label: labels.guidanceCenter },
    { href: sectionHref('order-analytics', analyticsRange), label: labels.businessSummary },
    { href: sectionHref('business-analytics-charts', analyticsRange), label: labels.businessCharts },
    { href: sectionHref('product-sales-analytics', analyticsRange), label: labels.productSales },
    { href: sectionHref('category-sales-analytics', analyticsRange), label: labels.categorySales },
    { href: sectionHref('site-analytics', analyticsRange), label: labels.siteFunnel },
    { href: sectionHref('analytics-privacy-retention', analyticsRange), label: labels.privacyControls },
    { href: sectionHref('site-analytics-retention-status', analyticsRange), label: labels.retentionStatus },
    { href: sectionHref('product-analytics', analyticsRange), label: labels.productPerformance },
    { href: sectionHref('inventory-analytics', analyticsRange), label: labels.inventoryPressure },
    { href: sectionHref('fulfillment-analytics', analyticsRange), label: labels.fulfillmentOps },
    { href: sectionHref('payment-analytics', analyticsRange), label: labels.paymentAlerts },
    { href: sectionHref('inquiry-operations', analyticsRange), label: labels.inquiryOps },
    { href: sectionHref('readiness-analytics', analyticsRange), label: labels.readinessHealth }
  ];
  const authenticated = await isAdminAuthenticated();
  const authConfigured = isAdminAuthConfigured();
  const identity = await getAdminIdentity();
  const ownerOnlyAnalyticsControls = identity.role === 'owner';
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
    authenticated ? orderRevenueSummaryService.summary({ analyticsRange }) : Promise.resolve({ ...EMPTY_ORDER_REVENUE_SUMMARY, analyticsRangeDays: rangeDays, analyticsRangeLabel: analyticsRange.label, analyticsRangeMode: analyticsRange.mode, analyticsRangeStart: analyticsRange.startDate, analyticsRangeEnd: analyticsRange.endDate }),
    authenticated ? productSalesAnalyticsService.summary({ analyticsRange }) : Promise.resolve({ ...EMPTY_PRODUCT_SALES_ANALYTICS_SUMMARY, analyticsRangeDays: rangeDays, analyticsRangeLabel: analyticsRange.label, analyticsRangeMode: analyticsRange.mode, analyticsRangeStart: analyticsRange.startDate, analyticsRangeEnd: analyticsRange.endDate }),
    authenticated ? categorySalesAnalyticsService.summary({ analyticsRange }) : Promise.resolve({ ...EMPTY_CATEGORY_SALES_ANALYTICS_SUMMARY, analyticsRangeDays: rangeDays, analyticsRangeLabel: analyticsRange.label, analyticsRangeMode: analyticsRange.mode, analyticsRangeStart: analyticsRange.startDate, analyticsRangeEnd: analyticsRange.endDate }),
    authenticated ? siteAnalyticsSummaryService.summary({ analyticsRange }) : Promise.resolve({ ...EMPTY_SITE_ANALYTICS_SUMMARY, analyticsRangeDays: rangeDays, analyticsRangeLabel: analyticsRange.label, analyticsRangeMode: analyticsRange.mode, analyticsRangeStart: analyticsRange.startDate, analyticsRangeEnd: analyticsRange.endDate }),
    authenticated && ownerOnlyAnalyticsControls ? siteAnalyticsRetentionService.summary() : Promise.resolve(emptySiteAnalyticsRetentionSummary())
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
          <div id="analytics-role-visibility" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">{labels.roleEyebrow}</p>
                <p className="mt-1 text-sm leading-6 text-amber-950">
                  {ownerOnlyAnalyticsControls ? labels.roleOwnerBody : labels.roleStaffBody}
                </p>
              </div>
              <span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-amber-800">
                {ownerOnlyAnalyticsControls ? labels.roleOwnerBadge : labels.roleStaffBadge}
              </span>
            </div>
          </div>
          <div id="analytics-range" className="mt-4 scroll-mt-24 rounded-lg border border-olive/20 bg-olive/5 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-olive">{labels.rangeEyebrow}</p>
            <p className="mt-1 text-sm leading-6 text-stone-600">{labels.rangeBody}</p>
            <div className="mt-3 flex flex-wrap gap-2" aria-label={labels.rangeEyebrow}>
              {ADMIN_ANALYTICS_RANGE_DAYS.map((days) => {
                const active = analyticsRange.mode === 'preset' && days === rangeDays;
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
            <form action="/admin/analytics" className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{labels.customRangeEyebrow}</p>
              <p className="mt-1 text-sm leading-6 text-stone-600">{labels.customRangeBody}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <label className="grid gap-1 text-sm font-semibold text-stone-700">
                  {labels.customStartLabel}
                  <input
                    type="date"
                    name="start"
                    defaultValue={analyticsRange.query.start ?? ''}
                    className="rounded-md border border-stone-300 px-3 py-2 text-sm font-normal text-stone-900"
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-stone-700">
                  {labels.customEndLabel}
                  <input
                    type="date"
                    name="end"
                    defaultValue={analyticsRange.query.end ?? ''}
                    className="rounded-md border border-stone-300 px-3 py-2 text-sm font-normal text-stone-900"
                  />
                </label>
                <button type="submit" className="rounded-full bg-olive px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-olive/90">
                  {labels.customApply}
                </button>
              </div>
              <p className="mt-2 text-xs leading-5 text-stone-500">{labels.customHint}</p>
            </form>
            <p className="mt-3 rounded-md border border-olive/20 bg-white px-4 py-3 text-sm leading-6 text-stone-700">
              <span className="font-bold text-stone-950">{labels.rangeActiveLabel}: </span>
              {analyticsRange.label}. {labels.rangeActiveBody}
            </p>
          </div>
          <div id="analytics-csv-exports" className="mt-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{labels.exportEyebrow}</p>
            <p className="mt-1 text-sm leading-6 text-stone-600">{labels.exportBody}</p>
            {ownerOnlyAnalyticsControls ? (
              <div className="mt-3 flex flex-wrap gap-2" aria-label={labels.exportEyebrow}>
                <Link
                  href={exportHref('business', analyticsRange)}
                  className="rounded-full border border-olive bg-white px-4 py-2 text-sm font-bold text-olive hover:bg-olive hover:text-white"
                >
                  {labels.businessCsv}
                </Link>
                <Link
                  href={exportHref('site', analyticsRange)}
                  className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:border-olive hover:text-olive"
                >
                  {labels.siteCsv}
                </Link>
              </div>
            ) : (
              <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">{labels.exportOwnerOnly}</p>
            )}
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
        <AdminAnalyticsLayoutGroupHeaders preview={layoutPreview} />
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
        {ownerOnlyAnalyticsControls ? (
          <AdminSiteAnalyticsRetentionStatusPanel summary={siteAnalyticsRetentionSummary} />
        ) : (
          <section id="site-analytics-retention-status" className="scroll-mt-24 rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">{labels.retentionStatus}</p>
            <p className="mt-2 text-sm leading-6 text-amber-950">{labels.retentionOwnerOnly}</p>
          </section>
        )}
      </div>
    </AdminPageShell>
  );
}
