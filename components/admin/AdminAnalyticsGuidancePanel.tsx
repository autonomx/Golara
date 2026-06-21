import Link from 'next/link';

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
    actionableTitle: 'Actionable insights',
    revenueInsight: 'Revenue and order trend',
    productInsight: 'Best-selling product',
    categoryInsight: 'Strongest category',
    funnelInsight: 'Storefront funnel',
    reviewOrders: 'Review business charts',
    reviewProducts: 'Review product sales',
    reviewCategories: 'Review category sales',
    reviewFunnel: 'Review site funnel',
    noProductData: 'No product sales yet',
    noCategoryData: 'No category sales yet',
    noFunnelData: 'No storefront events yet',
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
    validationTitle: 'Production validation checklist',
    validationBody: 'Before treating the dashboard as source-of-truth, validate the production analytics path end to end.',
    validationMigration: 'Confirm the SiteAnalyticsEvent migration/table exists in the production database.',
    validationEvents: 'Visit storefront product, category, search, cart, checkout, and order-confirmation paths and confirm events appear in the selected range.',
    validationFunnel: 'Confirm checkout started, payment method selected, and checkout completed events are visible after a real or staging checkout.',
    validationExports: 'Download Business CSV and Site CSV as an owner and confirm they contain aggregate rows for the selected range.',
    validationRetention: 'Review raw-event retention status and stale-event counts before enabling any future cleanup job.',
    validationRunbookLabel: 'Open production validation runbook',
    exportTitle: 'Using CSV exports',
    exportBody: 'Owner CSV exports are designed for reporting and reconciliation. Use Business CSV for order, revenue, product, category, payment, discount, and operations summaries. Use Site CSV for aggregate traffic, funnel, attribution, product-view, category-view, and search signals.',
    exportSafety: 'Exports stay aggregate-only: they do not include raw visitor sessions, full referrer URLs, or raw analytics event payloads.',
    docsIndexLabel: 'Open analytics docs index',
    checklistLabel: 'Open analytics operator checklist',
    roadmapLabel: 'Open analytics roadmap status',
    statusTitle: 'Analytics implementation status',
    liveLabel: 'Live now',
    pendingLabel: 'Planned next',
    liveBusiness: 'Business charts and selected-range deltas',
    liveCustomRange: 'Preset and custom start/end date range resolution',
    liveSite: 'First-party site funnel, attribution, and product view-to-cart analytics',
    liveSales: 'Product and category sales from checkout order lines',
    liveCustomerCohorts: 'Aggregate customer cohort order/revenue buckets and advanced cohort reporting',
    liveExports: 'Aggregate business/site CSV exports',
    liveScheduledReports: 'Scheduled analytics reports preview and config-plan foundation',
    liveSavedViews: 'Saved dashboard views preset and persistence-plan foundation',
    liveLayoutGroups: 'Dashboard group header UI',
    livePrivacy: 'Privacy/retention policy and disable guidance',
    liveRoleVisibility: 'Role-specific analytics visibility for owner-only exports and retention diagnostics',
    pendingRetentionJob: 'Automated raw-event retention cleanup job',
    pendingScheduledDelivery: 'Scheduled report storage and delivery execution',
    pendingSavedViewManagement: 'Saved view active persistence and management UI',
    pendingLayoutTabs: 'Collapsible groups or tabbed workspace behavior',
    statusLive: 'Live',
    statusNeedsData: 'Needs data',
    statusPlanned: 'Planned'
  },
  fa: {
    eyebrow: 'راهنمای تحلیل‌ها',
    title: 'بعد چه چیزی را بررسی کنید',
    body: 'از این خلاصه برای دیدن بخش‌های فعال، پنل‌های نیازمند داده و موارد برنامه‌ریزی‌شده بعدی استفاده کنید.',
    actionableTitle: 'بینش‌های قابل اقدام',
    revenueInsight: 'روند درآمد و سفارش',
    productInsight: 'پرفروش‌ترین محصول',
    categoryInsight: 'قوی‌ترین دسته‌بندی',
    funnelInsight: 'قیف فروشگاه',
    reviewOrders: 'بررسی نمودارهای کسب‌وکار',
    reviewProducts: 'بررسی فروش محصول',
    reviewCategories: 'بررسی فروش دسته‌بندی',
    reviewFunnel: 'بررسی قیف سایت',
    noProductData: 'هنوز فروش محصول وجود ندارد',
    noCategoryData: 'هنوز فروش دسته‌بندی وجود ندارد',
    noFunnelData: 'هنوز رویداد فروشگاه وجود ندارد',
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
    validationTitle: 'چک‌لیست اعتبارسنجی تولید',
    validationBody: 'پیش از تکیه بر داشبورد به عنوان منبع حقیقت، مسیر تحلیل تولید را انتها به انتها بررسی کنید.',
    validationMigration: 'وجود جدول و migration مربوط به SiteAnalyticsEvent را در پایگاه داده تولید تأیید کنید.',
    validationEvents: 'مسیرهای محصول، دسته‌بندی، جست‌وجو، سبد، پرداخت و تأیید سفارش را در فروشگاه بازدید کنید و نمایش رویدادها را در بازه انتخاب‌شده بررسی کنید.',
    validationFunnel: 'پس از پرداخت واقعی یا staging، نمایش رویدادهای شروع پرداخت، انتخاب روش پرداخت و تکمیل پرداخت را تأیید کنید.',
    validationExports: 'به عنوان مالک CSV کسب‌وکار و CSV سایت را دانلود کنید و ردیف‌های تجمیعی بازه انتخاب‌شده را بررسی کنید.',
    validationRetention: 'پیش از فعال‌سازی هر کار پاک‌سازی آینده، وضعیت نگهداری رویداد خام و تعداد رویدادهای قدیمی را بررسی کنید.',
    validationRunbookLabel: 'باز کردن راهنمای اعتبارسنجی تولید',
    exportTitle: 'استفاده از خروجی‌های CSV',
    exportBody: 'خروجی‌های CSV مالک برای گزارش‌گیری و تطبیق هستند. از CSV کسب‌وکار برای خلاصه سفارش، درآمد، محصول، دسته‌بندی، پرداخت، تخفیف و عملیات استفاده کنید. از CSV سایت برای سیگنال‌های تجمیعی ترافیک، قیف، انتساب، بازدید محصول، بازدید دسته‌بندی و جست‌وجو استفاده کنید.',
    exportSafety: 'خروجی‌ها فقط تجمیعی می‌مانند: نشست خام بازدیدکننده، URL کامل ارجاع‌دهنده یا payload خام رویداد تحلیل صادر نمی‌شود.',
    docsIndexLabel: 'باز کردن فهرست اسناد تحلیل‌ها',
    checklistLabel: 'باز کردن چک‌لیست عملیاتی تحلیل‌ها',
    roadmapLabel: 'باز کردن وضعیت نقشه راه تحلیل‌ها',
    statusTitle: 'وضعیت پیاده‌سازی تحلیل‌ها',
    liveLabel: 'اکنون فعال',
    pendingLabel: 'برنامه بعدی',
    liveBusiness: 'نمودارهای کسب‌وکار و مقایسه بازه انتخاب‌شده',
    liveCustomRange: 'حل بازه‌های پیش‌فرض و تاریخ شروع/پایان سفارشی',
    liveSite: 'قیف سایت، انتساب ترافیک و تبدیل بازدید محصول به سبد',
    liveSales: 'فروش محصول و دسته‌بندی از ردیف‌های سفارش',
    liveCustomerCohorts: 'گزارش تجمیعی و پیشرفته گروه‌های مشتری',
    liveExports: 'خروجی CSV تجمیعی کسب‌وکار و سایت',
    liveScheduledReports: 'پایه پیش‌نمایش و طرح پیکربندی گزارش زمان‌بندی‌شده',
    liveSavedViews: 'پایه پیش‌نمایش و طرح ماندگاری نمای داشبورد',
    liveLayoutGroups: 'رابط سربرگ گروه‌های داشبورد',
    livePrivacy: 'سیاست حریم خصوصی/نگهداری و راهنمای غیرفعال‌سازی',
    liveRoleVisibility: 'نمایش تحلیل‌ها بر اساس نقش برای خروجی‌های مالک و وضعیت نگهداری',
    pendingRetentionJob: 'کار خودکار پاک‌سازی رویدادهای خام پس از دوره نگهداری',
    pendingScheduledDelivery: 'ذخیره و ارسال گزارش‌های زمان‌بندی‌شده',
    pendingSavedViewManagement: 'ماندگاری فعال و مدیریت نماهای ذخیره‌شده',
    pendingLayoutTabs: 'گروه‌های جمع‌شونده یا فضای کاری تب‌دار',
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

function InsightCard({ title, body, href, action }: { title: string; body: string; href: string; action: string }) {
  return (
    <Link href={href} className="rounded-md border border-stone-200 bg-white p-3 text-sm hover:border-olive/40">
      <span className="block font-bold text-stone-950">{title}</span>
      <span className="mt-2 block leading-6 text-stone-600">{body}</span>
      <span className="mt-2 block text-xs font-bold uppercase tracking-[0.14em] text-olive">{action}</span>
    </Link>
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
  const topProduct = productSalesSummary.rows[0];
  const topCategory = categorySalesSummary.rows[0];

  return (
    <section id="analytics-guidance" className="scroll-mt-24 rounded-lg border border-olive/20 bg-olive/5 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-olive">{labels.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">{labels.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{labels.body}</p>
        </div>
      </div>
      <div className="mt-5 rounded-lg border border-olive/20 bg-white p-4">
        <h3 className="text-sm font-bold text-stone-950">{labels.actionableTitle}</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InsightCard title={labels.revenueInsight} body={`${orderSummary.totalOrders} orders · ${orderSummary.openOrders} open`} href="#order-analytics" action={labels.reviewOrders} />
          <InsightCard title={labels.productInsight} body={topProduct ? `${topProduct.label} · ${topProduct.quantitySold} sold` : labels.noProductData} href="#product-sales-analytics" action={labels.reviewProducts} />
          <InsightCard title={labels.categoryInsight} body={topCategory ? `${topCategory.label} · ${topCategory.quantitySold} sold` : labels.noCategoryData} href="#category-sales-analytics" action={labels.reviewCategories} />
          <InsightCard title={labels.funnelInsight} body={hasSiteData ? `${siteSummary.totalEvents} events · ${siteSummary.recentEvents} recent` : labels.noFunnelData} href="#site-analytics" action={labels.reviewFunnel} />
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <h3 className="text-sm font-bold text-stone-950">{labels.insightsTitle}</h3>
          <ul className="mt-3 grid gap-3">
            <GuidanceCard label={hasOrderData ? labels.ordersLive : labels.ordersEmpty} status={hasOrderData ? labels.statusLive : labels.statusNeedsData} tone={hasOrderData ? 'live' : 'needs-data'} />
            <GuidanceCard label={hasSiteData ? labels.siteLive : labels.siteEmpty} status={hasSiteData ? labels.statusLive : labels.statusNeedsData} tone={hasSiteData ? 'live' : 'needs-data'} />
            <GuidanceCard label={hasSalesData ? labels.salesLive : labels.salesEmpty} status={hasSalesData ? labels.statusLive : labels.statusNeedsData} tone={hasSalesData ? 'live' : 'needs-data'} />
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
      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <h3 className="text-sm font-bold text-emerald-950">{labels.validationTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-emerald-950">{labels.validationBody}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-emerald-950">
          <li>{labels.validationMigration}</li>
          <li>{labels.validationEvents}</li>
          <li>{labels.validationFunnel}</li>
          <li>{labels.validationExports}</li>
          <li>{labels.validationRetention}</li>
        </ul>
        <Link href="/docs/admin-analytics-production-validation-runbook.md" className="mt-3 inline-flex rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-100">{labels.validationRunbookLabel}</Link>
      </div>
      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="text-sm font-bold text-blue-950">{labels.exportTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-blue-950">{labels.exportBody}</p>
        <p className="mt-2 text-sm leading-6 text-blue-950">{labels.exportSafety}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/docs/admin-analytics-docs-index.md" className="inline-flex rounded-full border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-800 hover:bg-blue-100">{labels.docsIndexLabel}</Link>
          <Link href="/docs/admin-analytics-operator-checklist.md" className="inline-flex rounded-full border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-800 hover:bg-blue-100">{labels.checklistLabel}</Link>
          <Link href="/docs/admin-analytics-roadmap-status.md" className="inline-flex rounded-full border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-800 hover:bg-blue-100">{labels.roadmapLabel}</Link>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <h3 className="text-sm font-bold text-stone-950">{labels.liveLabel}</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-stone-600">
            <li>{labels.liveBusiness}</li><li>{labels.liveCustomRange}</li><li>{labels.liveSite}</li><li>{labels.liveSales}</li><li>{labels.liveCustomerCohorts}</li><li>{labels.liveExports}</li><li>{labels.liveScheduledReports}</li><li>{labels.liveSavedViews}</li><li>{labels.liveLayoutGroups}</li><li>{labels.livePrivacy}</li><li>{labels.liveRoleVisibility}</li>
          </ul>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <h3 className="text-sm font-bold text-stone-950">{labels.pendingLabel}</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-stone-600"><li>{labels.pendingRetentionJob}</li><li>{labels.pendingScheduledDelivery}</li><li>{labels.pendingSavedViewManagement}</li><li>{labels.pendingLayoutTabs}</li></ul>
        </div>
      </div>
    </section>
  );
}
