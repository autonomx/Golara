import type { FulfillmentQueueSummary } from '@/lib/analytics/fulfillment-queue-summary';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { createAdminFulfillmentQueueTranslator } from '@/lib/localization/admin-fulfillment-copy';

type AdminLocale = 'en' | 'fa';

const copy = {
  en: {
    eyebrow: 'Analytics',
    title: 'Fulfillment queue',
    body: 'Open fulfillment work for non-cancelled orders that are not fulfilled, delivered, or completed.',
    queued: 'queued',
    queuedOrders: 'Queued orders',
    overdue: 'Overdue',
    old: '2+ days old',
    newToday: 'New today',
    inProgress: 'In progress',
    readyScheduled: 'Ready/scheduled',
    order: 'Order',
    customer: 'Customer',
    fulfillment: 'Fulfillment',
    items: 'Items',
    age: 'Age',
    days: 'd',
    empty: 'No open fulfillment queue items need attention right now.'
  },
  fa: {
    eyebrow: 'تحلیل‌ها',
    title: 'صف اجرای سفارش',
    body: 'کارهای باز اجرای سفارش برای سفارش‌هایی که لغو نشده‌اند و هنوز ارسال، تحویل یا تکمیل نشده‌اند.',
    queued: 'در صف',
    queuedOrders: 'سفارش‌های در صف',
    overdue: 'معوق',
    old: 'بیش از ۲ روز',
    newToday: 'جدید امروز',
    inProgress: 'در حال انجام',
    readyScheduled: 'آماده یا زمان‌بندی‌شده',
    order: 'سفارش',
    customer: 'مشتری',
    fulfillment: 'اجرا',
    items: 'اقلام',
    age: 'سن',
    days: 'روز',
    empty: 'در حال حاضر هیچ مورد باز اجرای سفارش نیازمند توجه نیست.'
  }
} as const;

function localeKey(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
      <p className="font-bold text-stone-950">{value}</p>
      <p className="text-stone-600">{label}</p>
      {detail ? <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">{detail}</p> : null}
    </div>
  );
}

export function AdminFulfillmentQueueSummaryPanel({ summary, locale }: { summary: FulfillmentQueueSummary; locale?: SupportedLocale | string | null }) {
  const labels = copy[localeKey(locale)];
  const rowCopy = createAdminFulfillmentQueueTranslator(locale);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{labels.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">{labels.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{labels.body}</p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-800">
          {summary.queueCount} {labels.queued}
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-5">
        <Metric label={labels.queuedOrders} value={summary.queueCount} />
        <Metric label={labels.overdue} value={summary.overdueCount} detail={labels.old} />
        <Metric label={labels.newToday} value={summary.dueTodayCount} />
        <Metric label={labels.inProgress} value={summary.inProgressCount} />
        <Metric label={labels.readyScheduled} value={summary.readyOrScheduledCount} />
      </div>
      {summary.queuedOrders.length ? (
        <div className="mt-6 overflow-hidden rounded-md border border-stone-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
              <tr>
                <th className="px-3 py-2">{labels.order}</th>
                <th className="px-3 py-2">{labels.customer}</th>
                <th className="px-3 py-2">{labels.fulfillment}</th>
                <th className="px-3 py-2">{labels.items}</th>
                <th className="px-3 py-2">{labels.age}</th>
              </tr>
            </thead>
            <tbody>
              {summary.queuedOrders.map((row) => (
                <tr key={row.id} className="border-t border-stone-200">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-stone-950">{row.orderNumber}</p>
                    <p className="text-xs text-stone-500">{rowCopy.orderStatus(row.orderStatus)} · {rowCopy.checkoutMode(row.checkoutMode)}</p>
                  </td>
                  <td className="px-3 py-2 text-stone-700">{rowCopy.customerLabel(row.customerLabel)}</td>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-stone-900">{rowCopy.fulfillmentStatus(row.fulfillmentStatus)}</p>
                    <p className="text-xs text-stone-500">{rowCopy.priority(row.priority)}</p>
                  </td>
                  <td className="px-3 py-2 text-stone-700">{row.itemCount}</td>
                  <td className="px-3 py-2 text-stone-700">{row.ageDays}{labels.days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
          {labels.empty}
        </div>
      )}
    </section>
  );
}
