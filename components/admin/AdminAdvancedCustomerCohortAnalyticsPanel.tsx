import { AdminAnalyticsBarChart } from '@/components/admin/AdminAnalyticsChartPrimitives';
import { formatRevenueCents, type OrderRevenueSummary } from '@/lib/analytics/order-revenue-summary';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminLocale = 'en' | 'fa';

type AdvancedCohortCopy = {
  eyebrow: string;
  title: string;
  body: string;
  knownRevenueShare: string;
  aggregateOnly: string;
  aovByCohort: string;
  aovByCohortBody: string;
  revenueShareByCohort: string;
  revenueShareByCohortBody: string;
  orderCountBands: string;
  orderCountBandsBody: string;
  recencyBands: string;
  recencyBandsBody: string;
  noData: string;
  amount: string;
  percent: string;
  orders: string;
  customers: string;
  knownCustomers: string;
};

const copy: Record<AdminLocale, AdvancedCohortCopy> = {
  en: {
    eyebrow: 'Advanced cohorts',
    title: 'Aggregate customer cohort reporting',
    body: 'Privacy-safe cohort analytics for the selected range. These metrics expand customer insight with aggregate bands only; no names, emails, phone numbers, addresses, or per-customer rows are shown.',
    knownRevenueShare: 'Known-customer revenue share',
    aggregateOnly: 'Aggregate only',
    aovByCohort: 'Average order value by cohort',
    aovByCohortBody: 'Compares average order value for guest, known, first known-customer, and returning known-customer order buckets.',
    revenueShareByCohort: 'Revenue share by cohort',
    revenueShareByCohortBody: 'Shows how selected-range eligible revenue splits across aggregate customer buckets.',
    orderCountBands: 'Known-customer order-count bands',
    orderCountBandsBody: 'Buckets known customers by selected-range order count without exposing customer identities.',
    recencyBands: 'Known-customer recency bands',
    recencyBandsBody: 'Buckets known customers by the most recent selected-range order date, measured from the selected range end date.',
    noData: 'No aggregate cohort data is available for the selected range.',
    amount: 'Amount',
    percent: 'Percent',
    orders: 'orders',
    customers: 'customers',
    knownCustomers: 'known customers'
  },
  fa: {
    eyebrow: 'گروه‌های پیشرفته',
    title: 'گزارش تجمیعی گروه‌های مشتری',
    body: 'تحلیل حریم‌خصوصی‌محور گروه‌های مشتری برای بازه انتخاب‌شده. این معیارها فقط باندهای تجمیعی را نمایش می‌دهند و نام، ایمیل، تلفن، آدرس یا ردیف جداگانه مشتری نشان داده نمی‌شود.',
    knownRevenueShare: 'سهم درآمد مشتری شناخته‌شده',
    aggregateOnly: 'فقط تجمیعی',
    aovByCohort: 'میانگین ارزش سفارش بر اساس گروه',
    aovByCohortBody: 'میانگین ارزش سفارش را برای سفارش‌های مهمان، مشتری شناخته‌شده، اولین سفارش شناخته‌شده و سفارش بازگشتی مقایسه می‌کند.',
    revenueShareByCohort: 'سهم درآمد بر اساس گروه',
    revenueShareByCohortBody: 'نشان می‌دهد درآمد قابل محاسبه بازه انتخاب‌شده بین گروه‌های تجمیعی مشتری چگونه تقسیم شده است.',
    orderCountBands: 'باندهای تعداد سفارش مشتری شناخته‌شده',
    orderCountBandsBody: 'مشتریان شناخته‌شده را بر اساس تعداد سفارش در بازه انتخاب‌شده گروه‌بندی می‌کند، بدون نمایش هویت مشتری.',
    recencyBands: 'باندهای تازگی سفارش مشتری شناخته‌شده',
    recencyBandsBody: 'مشتریان شناخته‌شده را بر اساس آخرین سفارش در بازه انتخاب‌شده و نسبت به پایان بازه گروه‌بندی می‌کند.',
    noData: 'برای بازه انتخاب‌شده داده گروه‌بندی تجمیعی موجود نیست.',
    amount: 'مبلغ',
    percent: 'درصد',
    orders: 'سفارش',
    customers: 'مشتری',
    knownCustomers: 'مشتری شناخته‌شده'
  }
};

function localeKey(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function formatPercent(value: number) {
  return `${value.toFixed(1).replace(/\.0$/, '')}%`;
}

export async function AdminAdvancedCustomerCohortAnalyticsPanel({ summary }: { summary: OrderRevenueSummary }) {
  const locale = await resolveStorefrontLocale();
  const labels = copy[localeKey(locale)];
  const primaryCurrency = summary.primaryCurrency;
  const advanced = summary.customerCohorts.advanced;
  const aovRows = advanced.averageOrderValueByCohort.map((row) => ({
    label: row.label,
    value: row.averageOrderValueCents,
    displayValue: formatRevenueCents(row.averageOrderValueCents, primaryCurrency),
    detail: `${row.orderCount} ${labels.orders}`
  }));
  const revenueShareRows = advanced.averageOrderValueByCohort.map((row) => ({
    label: row.label,
    value: Math.round(row.revenueSharePercent * 10),
    displayValue: formatPercent(row.revenueSharePercent),
    detail: formatRevenueCents(row.revenueCents, primaryCurrency)
  }));
  const orderCountBandRows = advanced.orderCountBands.map((row) => ({
    label: row.label,
    value: row.orderCount,
    displayValue: String(row.orderCount),
    detail: `${row.knownCustomerCount} ${labels.customers} · ${formatRevenueCents(row.revenueCents, primaryCurrency)}`
  }));
  const recencyBandRows = advanced.recencyBands.map((row) => ({
    label: row.label,
    value: row.orderCount,
    displayValue: String(row.orderCount),
    detail: `${row.knownCustomerCount} ${labels.knownCustomers} · ${formatRevenueCents(row.revenueCents, primaryCurrency)}`
  }));

  return (
    <section id="customer-cohort-analytics" className="scroll-mt-24 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{labels.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">{labels.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{labels.body}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-olive/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-olive">
            {labels.knownRevenueShare}: {formatPercent(advanced.knownCustomerRevenueSharePercent)}
          </span>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-stone-600">
            {labels.aggregateOnly}
          </span>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AdminAnalyticsBarChart title={labels.aovByCohort} description={labels.aovByCohortBody} rows={aovRows} emptyLabel={labels.noData} valueLabel={labels.amount} />
        <AdminAnalyticsBarChart title={labels.revenueShareByCohort} description={labels.revenueShareByCohortBody} rows={revenueShareRows} emptyLabel={labels.noData} valueLabel={labels.percent} />
        <AdminAnalyticsBarChart title={labels.orderCountBands} description={labels.orderCountBandsBody} rows={orderCountBandRows} emptyLabel={labels.noData} valueLabel={labels.orders} />
        <AdminAnalyticsBarChart title={labels.recencyBands} description={labels.recencyBandsBody} rows={recencyBandRows} emptyLabel={labels.noData} valueLabel={labels.orders} />
      </div>
    </section>
  );
}
