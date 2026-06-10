import type { RecentActivitySummary } from '@/lib/analytics/recent-activity-summary';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { createAdminRecentActivityTranslator, translateRecentActivitySource } from '@/lib/localization/admin-recent-activity-copy';

function Metric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
      <p className="font-bold text-stone-950">{value}</p>
      <p className="text-stone-600">{label}</p>
      {detail ? <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">{detail}</p> : null}
    </div>
  );
}

function actorLabel(value: string, locale?: SupportedLocale | string | null) {
  const t = createAdminRecentActivityTranslator(locale);
  return value === 'System activity' ? t('System activity') : value;
}

export function AdminRecentActivitySummaryPanel({ summary, locale }: { summary: RecentActivitySummary; locale?: SupportedLocale | string | null }) {
  const t = createAdminRecentActivityTranslator(locale);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{t('Analytics')}</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">{t('Recent activity timeline')}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            {t('Unified operational feed from order timeline events, customer timeline events, and admin audit logs.')}
          </p>
        </div>
        <span className="rounded-full bg-olive/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-olive">
          {summary.entries.length} {t('shown')}
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Metric label={t('Activities reviewed')} value={summary.totalActivities} />
        <Metric label={t('Staff activities')} value={summary.staffActivities} />
        <Metric label={t('System activities')} value={summary.systemActivities} />
        <Metric label={t('Sources')} value={summary.bySource.length} />
      </div>
      {summary.entries.length ? (
        <div className="mt-6 overflow-hidden rounded-md border border-stone-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
              <tr>
                <th className="px-3 py-2">{t('Activity')}</th>
                <th className="px-3 py-2">{t('Source')}</th>
                <th className="px-3 py-2">{t('Actor')}</th>
                <th className="px-3 py-2">{t('Entity')}</th>
              </tr>
            </thead>
            <tbody>
              {summary.entries.map((row) => (
                <tr key={row.id} className="border-t border-stone-200">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-stone-950">{row.title}</p>
                    <p className="text-xs text-stone-500">{row.type}{row.note ? ` · ${row.note}` : ''}</p>
                  </td>
                  <td className="px-3 py-2 text-stone-700">{translateRecentActivitySource(row.source, locale)}</td>
                  <td className="px-3 py-2 text-stone-700">{actorLabel(row.actorLabel, locale)}</td>
                  <td className="px-3 py-2 text-stone-700">{row.entityLabel ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
          {t('No recent order, customer, or admin activity has been recorded yet.')}
        </div>
      )}
    </section>
  );
}
