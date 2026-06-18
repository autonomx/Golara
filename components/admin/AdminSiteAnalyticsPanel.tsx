import { AdminAnalyticsBarChart, AdminAnalyticsTrendChart } from '@/components/admin/AdminAnalyticsChartPrimitives';
import type { SiteAnalyticsSummary } from '@/lib/analytics/site-analytics-summary';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminLocale = 'en' | 'fa';

const copy = {
  en: {
    eyebrow: 'Site analytics',
    title: 'Storefront traffic and funnel',
    body: 'Privacy-safe first-party site events for page views, product views, search, cart, and checkout activity. Admin routes are excluded.',
    totalEvents: 'Total site events',
    recentEvents: 'Last 30 days',
    uniquePaths: 'Unique paths',
    pageViews: 'Page views',
    eventTypes: 'Events by type',
    eventTypesBody: 'Shows which storefront interactions are being captured.',
    topPages: 'Top pages',
    topPagesBody: 'Most-viewed storefront paths in the event sample.',
    dailyEvents: 'Site events over time',
    dailyEventsBody: 'Daily first-party site events for the latest rolling 30-day window.',
    checkoutFunnel: 'Checkout funnel',
    checkoutFunnelBody: 'High-level funnel from page/product views through cart and checkout completion.',
    topSearchTerms: 'Top search terms',
    topSearchTermsBody: 'Search terms submitted by customers, capped and normalized for safe reporting.',
    productViews: 'Product views',
    addToCart: 'Add to cart',
    checkoutStarted: 'Checkout started',
    checkoutCompleted: 'Checkout completed',
    noChartData: 'No site analytics events are available yet.',
    count: 'Count'
  },
  fa: {
    eyebrow: 'تحلیل سایت',
    title: 'ترافیک فروشگاه و قیف خرید',
    body: 'رویدادهای داخلی و حریم‌خصوصی‌محور برای بازدید صفحه، بازدید محصول، جستجو، سبد و پرداخت. مسیرهای مدیریت ثبت نمی‌شوند.',
    totalEvents: 'کل رویدادهای سایت',
    recentEvents: '۳۰ روز گذشته',
    uniquePaths: 'مسیرهای یکتا',
    pageViews: 'بازدید صفحه',
    eventTypes: 'رویدادها بر اساس نوع',
    eventTypesBody: 'نشان می‌دهد کدام تعامل‌های فروشگاه ثبت می‌شوند.',
    topPages: 'صفحه‌های برتر',
    topPagesBody: 'پربازدیدترین مسیرهای فروشگاه در نمونه رویدادها.',
    dailyEvents: 'رویدادهای سایت در طول زمان',
    dailyEventsBody: 'رویدادهای روزانه داخلی سایت برای بازه ۳۰ روزه اخیر.',
    checkoutFunnel: 'قیف پرداخت',
    checkoutFunnelBody: 'نمای کلی قیف از بازدید صفحه/محصول تا سبد و تکمیل پرداخت.',
    topSearchTerms: 'عبارت‌های جستجوی برتر',
    topSearchTermsBody: 'عبارت‌های جستجوی ارسال‌شده توسط مشتریان، محدود و نرمال‌شده برای گزارش امن.',
    productViews: 'بازدید محصول',
    addToCart: 'افزودن به سبد',
    checkoutStarted: 'شروع پرداخت',
    checkoutCompleted: 'تکمیل پرداخت',
    noChartData: 'هنوز رویداد تحلیل سایت موجود نیست.',
    count: 'تعداد'
  }
} as const;

function localeKey(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function formatDateLabel(value: string, locale: SupportedLocale | string | null | undefined) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(localeKey(locale) === 'fa' ? 'fa-IR' : 'en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

function formatEventLabel(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Unknown';
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
      <p className="font-bold text-stone-950">{value}</p>
      <p className="text-stone-600">{label}</p>
    </div>
  );
}

export async function AdminSiteAnalyticsPanel({ summary }: { summary: SiteAnalyticsSummary }) {
  const locale = await resolveStorefrontLocale();
  const labels = copy[localeKey(locale)];
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
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Metric label={labels.totalEvents} value={summary.totalEvents} />
        <Metric label={labels.recentEvents} value={summary.recentEvents} />
        <Metric label={labels.uniquePaths} value={summary.uniquePaths} />
        <Metric label={labels.pageViews} value={summary.checkoutFunnel.pageViews} />
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
        </div>
      </div>
    </section>
  );
}
