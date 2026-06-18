import { AdminAnalyticsBarChart, AdminAnalyticsTrendChart } from '@/components/admin/AdminAnalyticsChartPrimitives';
import type { AnalyticsComparisonDelta } from '@/lib/analytics/analytics-comparison';
import type { SiteAnalyticsSummary } from '@/lib/analytics/site-analytics-summary';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminLocale = 'en' | 'fa';

const copy = {
  en: {
    eyebrow: 'Site analytics',
    title: 'Storefront traffic and funnel',
    body: 'Privacy-safe first-party site events for page views, product/category views, search, cart, checkout, and payment-method selection. Admin routes are excluded.',
    totalEvents: 'Total site events',
    recentEvents: 'Selected range',
    uniquePaths: 'Unique paths',
    pageViews: 'Page views',
    productViews: 'Product views',
    eventTypes: 'Events by type',
    eventTypesBody: 'Shows which storefront interactions are being captured in the selected range.',
    topPages: 'Top pages',
    topPagesBody: 'Most-viewed storefront paths in the selected event sample.',
    dailyEvents: 'Site events over time',
    dailyEventsBody: 'Daily first-party site events for the selected analytics range.',
    checkoutFunnel: 'Checkout funnel',
    checkoutFunnelBody: 'High-level funnel from page/product views through cart and checkout completion.',
    topSearchTerms: 'Top search terms',
    topSearchTermsBody: 'Search terms submitted by customers, capped and normalized for safe reporting.',
    topProducts: 'Top product views',
    topProductsBody: 'Product detail views grouped by product slug from storefront traffic.',
    topCategories: 'Top category views',
    topCategoriesBody: 'Category detail views grouped by category slug from storefront traffic.',
    addToCart: 'Add to cart',
    checkoutStarted: 'Checkout started',
    checkoutCompleted: 'Checkout completed',
    noChartData: 'No site analytics events are available yet.',
    count: 'Count',
    vsPreviousRange: 'vs previous range',
    noChangeVsPreviousRange: 'No change vs previous range'
  },
  fa: {
    eyebrow: 'تحلیل سایت',
    title: 'ترافیک فروشگاه و قیف خرید',
    body: 'رویدادهای داخلی و حریم‌خصوصی‌محور برای بازدید صفحه، محصول/دسته، جستجو، سبد، پرداخت و انتخاب روش پرداخت. مسیرهای مدیریت ثبت نمی‌شوند.',
    totalEvents: 'کل رویدادهای سایت',
    recentEvents: 'بازه انتخاب‌شده',
    uniquePaths: 'مسیرهای یکتا',
    pageViews: 'بازدید صفحه',
    productViews: 'بازدید محصول',
    eventTypes: 'رویدادها بر اساس نوع',
    eventTypesBody: 'نشان می‌دهد کدام تعامل‌های فروشگاه در بازه انتخاب‌شده ثبت می‌شوند.',
    topPages: 'صفحه‌های برتر',
    topPagesBody: 'پربازدیدترین مسیرهای فروشگاه در نمونه رویدادهای انتخاب‌شده.',
    dailyEvents: 'رویدادهای سایت در طول زمان',
    dailyEventsBody: 'رویدادهای روزانه داخلی سایت برای بازه انتخاب‌شده.',
    checkoutFunnel: 'قیف پرداخت',
    checkoutFunnelBody: 'نمای کلی قیف از بازدید صفحه/محصول تا سبد و تکمیل پرداخت.',
    topSearchTerms: 'عبارت‌های جستجوی برتر',
    topSearchTermsBody: 'عبارت‌های جستجوی ارسال‌شده توسط مشتریان، محدود و نرمال‌شده برای گزارش امن.',
    topProducts: 'بازدید محصولات برتر',
    topProductsBody: 'بازدید صفحه محصول بر اساس اسلاگ محصول در ترافیک فروشگاه.',
    topCategories: 'بازدید دسته‌های برتر',
    topCategoriesBody: 'بازدید صفحه دسته بر اساس اسلاگ دسته در ترافیک فروشگاه.',
    addToCart: 'افزودن به سبد',
    checkoutStarted: 'شروع پرداخت',
    checkoutCompleted: 'تکمیل پرداخت',
    noChartData: 'هنوز رویداد تحلیل سایت موجود نیست.',
    count: 'تعداد',
    vsPreviousRange: 'نسبت به بازه قبلی',
    noChangeVsPreviousRange: 'بدون تغییر نسبت به بازه قبلی'
  }
} as const;

type SitePanelCopy = Record<string, string>;

function localeKey(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function formatDateLabel(value: string, locale: SupportedLocale | string | null | undefined) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(localeKey(locale) === 'fa' ? 'fa-IR' : 'en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

function formatRangeLabel(days: number, locale: SupportedLocale | string | null | undefined) {
  return localeKey(locale) === 'fa' ? `${days} روز گذشته` : `last ${days} days`;
}

function formatEventLabel(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Unknown';
}

function formatComparisonDelta(delta: AnalyticsComparisonDelta, labels: SitePanelCopy) {
  if (delta.direction === 'flat') return labels.noChangeVsPreviousRange;
  if (delta.percentChange === null) {
    const sign = delta.absoluteChange > 0 ? '+' : '-';
    return `${sign}${Math.abs(delta.absoluteChange)} ${labels.vsPreviousRange}`;
  }
  const sign = delta.percentChange > 0 ? '+' : '';
  return `${sign}${delta.percentChange.toFixed(1)}% ${labels.vsPreviousRange}`;
}

function comparisonTone(delta: AnalyticsComparisonDelta) {
  if (delta.direction === 'up') return 'text-emerald-700';
  if (delta.direction === 'down') return 'text-rose-700';
  return 'text-stone-500';
}

function Metric({ label, value, detail, delta, labels }: { label: string; value: string | number; detail?: string; delta?: AnalyticsComparisonDelta; labels: SitePanelCopy }) {
  const deltaLabel = delta ? formatComparisonDelta(delta, labels) : null;

  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
      <p className="font-bold text-stone-950">{value}</p>
      <p className="text-stone-600">{label}</p>
      {detail ? <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">{detail}</p> : null}
      {delta && deltaLabel ? <p className={`mt-1 text-xs font-bold ${comparisonTone(delta)}`}>{deltaLabel}</p> : null}
    </div>
  );
}

export async function AdminSiteAnalyticsPanel({ summary }: { summary: SiteAnalyticsSummary }) {
  const locale = await resolveStorefrontLocale();
  const labels = copy[localeKey(locale)];
  const rangeLabel = formatRangeLabel(summary.analyticsRangeDays, locale);
  const dailyRows = summary.recentDaily.map((point) => ({
    label: formatDateLabel(point.date, locale),
    value: point.eventCount,
    displayValue: String(point.eventCount)
  }));
  const eventTypeRows = summary.byEventType.map((row) => ({
    label: formatEventLabel(row.label),
    value: row.count,
    displayValue: String(row.count)
  }));
  const topPageRows = summary.topPages.map((row) => ({
    label: row.label,
    value: row.count,
    displayValue: String(row.count)
  }));
  const productRows = summary.topProductViews.map((row) => ({
    label: row.label,
    value: row.count,
    displayValue: String(row.count)
  }));
  const categoryRows = summary.topCategoryViews.map((row) => ({
    label: row.label,
    value: row.count,
    displayValue: String(row.count)
  }));
  const searchRows = summary.topSearchTerms.map((row) => ({
    label: row.label,
    value: row.count,
    displayValue: String(row.count)
  }));
  const funnelRows = [
    { label: labels.pageViews, value: summary.checkoutFunnel.pageViews, displayValue: String(summary.checkoutFunnel.pageViews) },
    { label: labels.productViews, value: summary.checkoutFunnel.productViews, displayValue: String(summary.checkoutFunnel.productViews) },
    { label: labels.addToCart, value: summary.checkoutFunnel.addToCart, displayValue: String(summary.checkoutFunnel.addToCart) },
    { label: labels.checkoutStarted, value: summary.checkoutFunnel.checkoutStarted, displayValue: String(summary.checkoutFunnel.checkoutStarted) },
    { label: labels.checkoutCompleted, value: summary.checkoutFunnel.checkoutCompleted, displayValue: String(summary.checkoutFunnel.checkoutCompleted) }
  ];

  return (
    <section id="site-analytics" className="scroll-mt-24 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{labels.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">{labels.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{labels.body}</p>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-stone-600">
          {rangeLabel}
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Metric label={labels.totalEvents} value={summary.totalEvents} detail={rangeLabel} delta={summary.comparison.totalEvents} labels={labels} />
        <Metric label={labels.recentEvents} value={summary.recentEvents} detail={rangeLabel} labels={labels} />
        <Metric label={labels.uniquePaths} value={summary.uniquePaths} detail={rangeLabel} delta={summary.comparison.uniquePaths} labels={labels} />
        <Metric label={labels.pageViews} value={summary.checkoutFunnel.pageViews} detail={rangeLabel} delta={summary.comparison.pageViews} labels={labels} />
        <Metric label={labels.productViews} value={summary.checkoutFunnel.productViews} detail={rangeLabel} delta={summary.comparison.productViews} labels={labels} />
        <Metric label={labels.checkoutCompleted} value={summary.checkoutFunnel.checkoutCompleted} detail={rangeLabel} delta={summary.comparison.checkoutCompleted} labels={labels} />
      </div>
      <div className="mt-6 rounded-lg border border-stone-200 bg-stone-50 p-4">
        <div className="grid gap-4 xl:grid-cols-3">
          <AdminAnalyticsTrendChart
            title={labels.dailyEvents}
            description={labels.dailyEventsBody}
            rows={dailyRows}
            emptyLabel={labels.noChartData}
            valueLabel={labels.count}
          />
          <AdminAnalyticsBarChart
            title={labels.eventTypes}
            description={labels.eventTypesBody}
            rows={eventTypeRows}
            emptyLabel={labels.noChartData}
            valueLabel={labels.count}
          />
          <AdminAnalyticsBarChart
            title={labels.checkoutFunnel}
            description={labels.checkoutFunnelBody}
            rows={funnelRows}
            emptyLabel={labels.noChartData}
            valueLabel={labels.count}
          />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <AdminAnalyticsBarChart
            title={labels.topPages}
            description={labels.topPagesBody}
            rows={topPageRows}
            emptyLabel={labels.noChartData}
            valueLabel={labels.count}
          />
          <AdminAnalyticsBarChart
            title={labels.topSearchTerms}
            description={labels.topSearchTermsBody}
            rows={searchRows}
            emptyLabel={labels.noChartData}
            valueLabel={labels.count}
          />
          <AdminAnalyticsBarChart
            title={labels.topProducts}
            description={labels.topProductsBody}
            rows={productRows}
            emptyLabel={labels.noChartData}
            valueLabel={labels.count}
          />
          <AdminAnalyticsBarChart
            title={labels.topCategories}
            description={labels.topCategoriesBody}
            rows={categoryRows}
            emptyLabel={labels.noChartData}
            valueLabel={labels.count}
          />
        </div>
      </div>
    </section>
  );
}
