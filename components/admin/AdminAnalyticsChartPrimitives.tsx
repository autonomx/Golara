export type AdminAnalyticsChartDatum = {
  label: string;
  value: number;
  displayValue?: string;
  detail?: string;
};

type AdminAnalyticsChartProps = {
  title: string;
  description?: string;
  rows: AdminAnalyticsChartDatum[];
  emptyLabel: string;
  valueLabel: string;
};

function normalizeChartValue(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
}

function chartPercent(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((normalizeChartValue(value) / max) * 100)));
}

function normalizeRows(rows: AdminAnalyticsChartDatum[]) {
  return rows.map((row) => ({ ...row, value: normalizeChartValue(row.value) }));
}

function hasPositiveChartData(rows: AdminAnalyticsChartDatum[]) {
  return rows.some((row) => row.value > 0);
}

function EmptyChartState({ emptyLabel }: { emptyLabel: string }) {
  return (
    <p className="mt-4 rounded-md border border-dashed border-stone-200 bg-stone-50 px-3 py-4 text-sm text-stone-500" role="status">
      {emptyLabel}
    </p>
  );
}

function AdminAnalyticsDataTable({ title, rows, valueLabel }: { title: string; rows: AdminAnalyticsChartDatum[]; valueLabel: string }) {
  return (
    <details className="mt-4 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm">
      <summary className="cursor-pointer font-semibold text-stone-700">{valueLabel}</summary>
      <div className="mt-3 overflow-hidden rounded-md border border-stone-200 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
            <tr>
              <th className="px-3 py-2">{title}</th>
              <th className="px-3 py-2">{valueLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-stone-200">
                <td className="px-3 py-2 font-semibold text-stone-950">{row.label}</td>
                <td className="px-3 py-2 text-stone-700">{row.displayValue ?? row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function AdminAnalyticsBarChart({ title, description, rows, emptyLabel, valueLabel }: AdminAnalyticsChartProps) {
  const normalizedRows = normalizeRows(rows);
  const maxValue = Math.max(0, ...normalizedRows.map((row) => row.value));
  const hasData = hasPositiveChartData(normalizedRows);

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm" aria-label={title}>
      <div>
        <h3 className="text-base font-bold text-stone-950">{title}</h3>
        {description ? <p className="mt-1 text-sm leading-6 text-stone-600">{description}</p> : null}
      </div>

      {hasData ? (
        <>
          <div className="mt-4 grid gap-3" role="list" aria-label={title}>
            {normalizedRows.map((row) => {
              const percent = chartPercent(row.value, maxValue);
              return (
                <div key={row.label} role="listitem">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <div>
                      <span className="font-semibold text-stone-950">{row.label}</span>
                      {row.detail ? <span className="ml-2 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">{row.detail}</span> : null}
                    </div>
                    <span className="font-bold text-stone-700">{row.displayValue ?? row.value}</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
                    <div className="h-full rounded-full bg-olive" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="sr-only">
                    {row.label}: {row.displayValue ?? row.value}
                  </span>
                </div>
              );
            })}
          </div>

          <AdminAnalyticsDataTable title={title} rows={normalizedRows} valueLabel={valueLabel} />
        </>
      ) : (
        <EmptyChartState emptyLabel={emptyLabel} />
      )}
    </article>
  );
}

export function AdminAnalyticsTrendChart({ title, description, rows, emptyLabel, valueLabel }: AdminAnalyticsChartProps) {
  const normalizedRows = normalizeRows(rows);
  const maxValue = Math.max(0, ...normalizedRows.map((row) => row.value));
  const hasData = hasPositiveChartData(normalizedRows);
  const points = normalizedRows.map((row, index) => {
    const x = normalizedRows.length <= 1 ? 50 : Math.round((index / (normalizedRows.length - 1)) * 100);
    const y = maxValue <= 0 ? 90 : 90 - Math.round((row.value / maxValue) * 80);
    return `${x},${y}`;
  }).join(' ');
  const firstLabel = normalizedRows[0]?.label;
  const lastLabel = normalizedRows[normalizedRows.length - 1]?.label;

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm" aria-label={title}>
      <div>
        <h3 className="text-base font-bold text-stone-950">{title}</h3>
        {description ? <p className="mt-1 text-sm leading-6 text-stone-600">{description}</p> : null}
      </div>

      {hasData ? (
        <>
          <div className="mt-4 rounded-md border border-stone-200 bg-stone-50 p-3" role="img" aria-label={`${title}: ${normalizedRows.map((row) => `${row.label} ${row.displayValue ?? row.value}`).join(', ')}`}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-40 w-full overflow-visible text-olive" aria-hidden="true">
              <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">
              <span>{firstLabel}</span>
              <span>{lastLabel}</span>
            </div>
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3" role="list" aria-label={title}>
            {normalizedRows.slice(-3).map((row) => (
              <div key={row.label} role="listitem" className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">{row.label}</p>
                <p className="mt-1 font-bold text-stone-950">{row.displayValue ?? row.value}</p>
              </div>
            ))}
          </div>
          <AdminAnalyticsDataTable title={title} rows={normalizedRows} valueLabel={valueLabel} />
        </>
      ) : (
        <EmptyChartState emptyLabel={emptyLabel} />
      )}
    </article>
  );
}
