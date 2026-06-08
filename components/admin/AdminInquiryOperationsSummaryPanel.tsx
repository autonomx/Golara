import type { InquiryOperationsSummary } from '@/lib/analytics/inquiry-operations-summary';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminLocale = 'en' | 'fa';

const copy = {
  en: {
    eyebrow: 'Analytics',
    title: 'Inquiry operations summary',
    body: 'Daily support snapshot for inquiry volume, assignment load, recent requests, and resolution progress. This is not an order conversion metric.',
    resolved: 'resolved',
    totalInquiries: 'Total inquiries',
    newInquiries: 'New inquiries',
    openInquiries: 'Open inquiries',
    recentInquiries: 'Recent inquiries',
    last30Days: 'last 30 days',
    assigned: 'Assigned',
    unassigned: 'Unassigned',
    withFollowUp: 'With follow-up',
    closedResolved: 'Closed/resolved',
    status: 'Status',
    inquiries: 'Inquiries',
    source: 'Source'
  },
  fa: {
    eyebrow: 'تحلیل‌ها',
    title: 'خلاصه عملیات درخواست‌ها',
    body: 'نمای روزانه پشتیبانی برای حجم درخواست‌ها، بار تخصیص، درخواست‌های اخیر و روند حل‌شدن. این شاخص، نرخ تبدیل سفارش نیست.',
    resolved: 'حل‌شده',
    totalInquiries: 'کل درخواست‌ها',
    newInquiries: 'درخواست‌های جدید',
    openInquiries: 'درخواست‌های باز',
    recentInquiries: 'درخواست‌های اخیر',
    last30Days: '۳۰ روز گذشته',
    assigned: 'تخصیص‌یافته',
    unassigned: 'تخصیص‌نیافته',
    withFollowUp: 'دارای پیگیری',
    closedResolved: 'بسته یا حل‌شده',
    status: 'وضعیت',
    inquiries: 'درخواست‌ها',
    source: 'منبع'
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

export function AdminInquiryOperationsSummaryPanel({ summary, locale }: { summary: InquiryOperationsSummary; locale?: SupportedLocale | string | null }) {
  const labels = copy[localeKey(locale)];

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{labels.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">{labels.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{labels.body}</p>
        </div>
        <span className="rounded-full bg-olive/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-olive">
          {summary.resolutionRatePercent}% {labels.resolved}
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Metric label={labels.totalInquiries} value={summary.totalInquiries} />
        <Metric label={labels.newInquiries} value={summary.newInquiries} />
        <Metric label={labels.openInquiries} value={summary.openInquiries} />
        <Metric label={labels.recentInquiries} value={summary.recentInquiries} detail={labels.last30Days} />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <Metric label={labels.assigned} value={summary.assignedInquiries} />
        <Metric label={labels.unassigned} value={summary.unassignedInquiries} />
        <Metric label={labels.withFollowUp} value={summary.followUpInquiries} />
        <Metric label={labels.closedResolved} value={summary.closedInquiries} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {summary.byStatus.length ? (
          <div className="overflow-hidden rounded-md border border-stone-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                <tr>
                  <th className="px-3 py-2">{labels.status}</th>
                  <th className="px-3 py-2">{labels.inquiries}</th>
                </tr>
              </thead>
              <tbody>
                {summary.byStatus.map((row) => (
                  <tr key={row.status} className="border-t border-stone-200">
                    <td className="px-3 py-2 font-semibold text-stone-950">{row.status}</td>
                    <td className="px-3 py-2 text-stone-700">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {summary.bySource.length ? (
          <div className="overflow-hidden rounded-md border border-stone-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                <tr>
                  <th className="px-3 py-2">{labels.source}</th>
                  <th className="px-3 py-2">{labels.inquiries}</th>
                </tr>
              </thead>
              <tbody>
                {summary.bySource.map((row) => (
                  <tr key={row.source} className="border-t border-stone-200">
                    <td className="px-3 py-2 font-semibold text-stone-950">{row.source}</td>
                    <td className="px-3 py-2 text-stone-700">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}
