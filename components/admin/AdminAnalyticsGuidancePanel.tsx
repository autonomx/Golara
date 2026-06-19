import type { CategorySalesAnalyticsSummary } from '@/lib/analytics/category-sales-analytics';
import type { OrderRevenueSummary } from '@/lib/analytics/order-revenue-summary';
import type { ProductSalesAnalyticsSummary } from '@/lib/analytics/product-sales-analytics';
import type { SiteAnalyticsSummary } from '@/lib/analytics/site-analytics-summary';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminLocale = 'en' | 'fa';

const copy = {
  en: {
    eyebrow: 'Analytics guidance',
    title: 'What to look at next',
    body: 'Use this summary to understand which analytics are live, which panels need more data, and which roadmap items are still intentionally pending.',
    insightsTitle: 'Current signal summary',
    ordersLive: 'Order analytics are live for this range.',
    ordersEmpty: 'Order analytics are waiting for eligible checkout orders.',
    siteLive: 'Site analytics are receiving storefront events.',
    siteEmpty: 'Site analytics are waiting for storefront traffic and the production event table.',
    salesLive: 'Product/category sales analytics have eligible order-line data.',
    salesEmpty: 'Sales analytics will populate after eligible product order lines exist.',
    emptyTitle: 'When a chart is empty',
    emptyBody: 'Empty panels are expected before production traffic, migration evidence, or eligible orders exist. They are not treated as failures.',
    orderAction: 'Create or import checkout orders to populate business charts.',
    siteAction: 'Visit storefront product/category/checkout paths with analytics enabled to populate site charts.',
    salesAction: 'Complete eligible product orders to populate product and category sales charts.',
    statusTitle: 'Analytics implementation status',
    liveLabel: 'Live now',
    pendingLabel: 'Planned next',
    liveBusiness: 'Business charts and selected-range deltas',
    liveSite: 'First-party site funnel, attribution, and product view-to-cart analytics',
    liveSales: 'Product and category sales from checkout order lines',
    liveExports: 'Aggregate business/site CSV exports',
    livePrivacy: 'Privacy/retention policy and disable guidance',
    pendingCustomRange: 'Custom start/end date range selector',
    pendingRetentionJob: 'Automated raw-event retention cleanup job',
    pendingRoleViews: 'Role-specific analytics visibility',
    statusLive: 'Live',
    statusNeedsData: 'Needs data',
    statusPlanned: 'Planned'
  },
  fa: {
    eyebrow: 'راهنمای تحلیل‌ها',
    title: 'بعد چه چیزی را بررسی کنید',
    body: 'از این خلاصه برای دیدن بخش‌های فعال، پنل‌های نیازمند داده و موارد برنامه‌ریزی‌شده بعدی استفاده کنید.',
    insightsTitle: 'خلاصه سیگنال فعلی',
    ordersLive: 'تحلیل سفارش‌ها برای این بازه فعال است.',
    ordersEmpty: 'تحلیل سفارش‌ها منتظر سفارش‌های معتبر پرداخت است.',
    siteLive: 'تحلیل سایت رویدادهای فروشگاه را دریافت می‌کند.',
    siteEmpty: 'تحلیل سایت منتظر ترافیک فروشگاه و جدول رویداد تولید است.',
    salesLive: 'تحلیل فروش محصول/دسته‌بندی داده ردیف سفارش معتبر دارد.',
    salesEmpty: 'تحلیل فروش پس از ایجاد سفارش‌های محصول معتبر پر می‌شود.',
    emptyTitle: 'وقتی نمودار خالی است',
    emptyBody: 'خالی بودن پنل‌ها پیش از ترافیک تولید، اعمال migration یا سفارش معتبر طبیعی است و خطا محسوب نمی‌شود.',
    orderAction: 'برای پر شدن نمودارهای کسب‌وکار، سفارش‌های پرداخت ایجاد یا وارد کنید.',
    siteAction: 'برای پر شدن نمودارهای سایت، مسیرهای محصول/دسته/پرداخت فروشگاه را با تحلیل فعال بازدید کنید.',
    salesAction: 'برای پر شدن نمودارهای فروش، سفارش‌های محصول معتبر را تکمیل کنید.',
    statusTitle: 'وضعیت پیاده‌سازی تحلیل‌ها',
    liveLabel: 'اکنون فعال',
    pendingLabel: 'برنامه بعدی',
    liveBusiness: 'نمودارهای کسب‌وکار و مقایسه بازه انتخاب‌شده',
    liveSite: 'قیف سایت، انتساب ترافیک و تبدیل بازدید محصول به سبد',
    liveSales: 'فروش محصول و دسته‌بندی از ردیف‌های سفارش',
    liveExports: 'خروجی CSV تجمیعی کسب‌وکار و سایت',
    livePrivacy: 'سیاست حریم خصوصی/نگهداری و راهنمای غیرفعال‌سازی',
    pendingCustomRange: 'انتخابگر بازه تاریخ شروع/پایان سفارشی',
    pendingRetentionJob: 'کار خودکار پاک‌سازی رویدادهای خام پس از دوره نگهداری',
    pendingRoleViews: 'نمایش تحلیل‌ها بر اساس نقش کاربر',
    statusLive: 'فعال',
    statusNeedsData: 'نیازمند داده',
    statusPlanned: 'برنامه‌ریزی‌شده'
  }
} as const;

function localeKey(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function StatusPill({ children, tone }: { children: string; tone: 'live' | 'needs-data' | 'planned' }) {
  const classes = tone === 'live'
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
    : tone === 'needs-data'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-stone-50 text-stone-700 border-stone-200';

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] ${classes}`}>{children}</span>;
}

function GuidanceCard({ label, status, tone }: { label: string; status: string; tone: 'live' | 'needs-data' | 'planned' }) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-md border border-stone-200 bg-white p-3 text-sm">
      <span className="leading-6 text-stone-700">{label}</span>
      <StatusPill tone={tone}>{status}</StatusPill>
    </li>
  );
}

export async function AdminAnalyticsGuidancePanel({
  orderSummary,
  productSalesSummary,
  categorySalesSummary,
  siteSummary
}: {
  orderSummary: OrderRevenueSummary;
  productSalesSummary: ProductSalesAnalyticsSummary;
  categorySalesSummary: CategorySalesAnalyticsSummary;
  siteSummary: SiteAnalyticsSummary;
}) {
  const locale = await resolveStorefrontLocale();
  const labels = copy[localeKey(locale)];
  const hasOrderData = orderSummary.totalOrders > 0 || orderSummary.recentOrders > 0 || orderSummary.recentRevenueCents > 0;
  const hasSiteData = siteSummary.totalEvents > 0 || siteSummary.recentEvents > 0;
  const hasSalesData = productSalesSummary.rows.length > 0 || categorySalesSummary.rows.length > 0;

  return (
    <section id="analytics-guidance" className="scroll-mt-24 rounded-lg border border-olive/20 bg-olive/5 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-olive">{labels.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">{labels.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{labels.body}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <h3 className="text-sm font-bold text-stone-950">{labels.insightsTitle}</h3>
          <ul className="mt-3 grid gap-3">
            <GuidanceCard
              label={hasOrderData ? labels.ordersLive : labels.ordersEmpty}
              status={hasOrderData ? labels.statusLive : labels.statusNeedsData}
              tone={hasOrderData ? 'live' : 'needs-data'}
            />
            <GuidanceCard
              label={hasSiteData ? labels.siteLive : labels.siteEmpty}
              status={hasSiteData ? labels.statusLive : labels.statusNeedsData}
              tone={hasSiteData ? 'live' : 'needs-data'}
            />
            <GuidanceCard
              label={hasSalesData ? labels.salesLive : labels.salesEmpty}
              status={hasSalesData ? labels.statusLive : labels.statusNeedsData}
              tone={hasSalesData ? 'live' : 'needs-data'}
            />
          </ul>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <h3 className="text-sm font-bold text-stone-950">{labels.emptyTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">{labels.emptyBody}</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-stone-600">
            <li>{labels.orderAction}</li>
            <li>{labels.siteAction}</li>
            <li>{labels.salesAction}</li>
          </ul>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <h3 className="text-sm font-bold text-stone-950">{labels.liveLabel}</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-stone-600">
            <li>{labels.liveBusiness}</li>
            <li>{labels.liveSite}</li>
            <li>{labels.liveSales}</li>
            <li>{labels.liveExports}</li>
            <li>{labels.livePrivacy}</li>
          </ul>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <h3 className="text-sm font-bold text-stone-950">{labels.pendingLabel}</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-stone-600">
            <li>{labels.pendingCustomRange}</li>
            <li>{labels.pendingRetentionJob}</li>
            <li>{labels.pendingRoleViews}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
