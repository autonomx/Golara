'use client';

import { useMemo, useState } from 'react';

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
  locale?: string | null;
};

type TrendDisplayMode = 'line' | 'area' | 'bars';
type TrendScope = 'all' | 'recent' | 'nonZero';
type TrendScaleMode = 'zero' | 'tight';

type TrendChartPoint = AdminAnalyticsChartDatum & {
  x: number;
  y: number;
  barX: number;
  barWidth: number;
  barHeight: number;
};

const interactiveCopy = {
  en: {
    options: 'Chart options',
    displayMode: 'Display',
    line: 'Line',
    area: 'Area',
    bars: 'Bars',
    scope: 'Range',
    all: 'All',
    recent: 'Last 7',
    nonZero: 'Active only',
    scale: 'Scale',
    zeroScale: 'From zero',
    tightScale: 'Tight',
    selectedPoint: 'Selected point',
    latest: 'Latest',
    peak: 'Peak',
    average: 'Average',
    minimum: 'Minimum',
    noFilteredData: 'No chart data matches this option.'
  },
  fa: {
    options: 'گزینه‌های نمودار',
    displayMode: 'نمایش',
    line: 'خطی',
    area: 'ناحیه‌ای',
    bars: 'ستونی',
    scope: 'بازه',
    all: 'همه',
    recent: '۷ مورد آخر',
    nonZero: 'فقط فعال',
    scale: 'مقیاس',
    zeroScale: 'از صفر',
    tightScale: 'فشرده',
    selectedPoint: 'نقطه انتخاب‌شده',
    latest: 'آخرین',
    peak: 'بیشینه',
    average: 'میانگین',
    minimum: 'کمینه',
    noFilteredData: 'داده‌ای با این گزینه برای نمودار موجود نیست.'
  }
} as const;

function localeKey(locale?: string | null) {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

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

function SegmentedControl<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<{ value: T; label: string }>; onChange: (value: T) => void }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-stone-400">{label}</legend>
      <div className="flex flex-wrap gap-1 rounded-md border border-stone-200 bg-stone-50 p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`rounded px-2 py-1 text-xs font-bold transition ${value === option.value ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500 hover:bg-white/70 hover:text-stone-800'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function rowsForScope(rows: AdminAnalyticsChartDatum[], scope: TrendScope) {
  if (scope === 'recent') return rows.slice(-7);
  if (scope === 'nonZero') return rows.filter((row) => row.value > 0);
  return rows;
}

function formatAverageValue(rows: AdminAnalyticsChartDatum[], formatLike?: AdminAnalyticsChartDatum) {
  if (!rows.length) return '0';
  const average = Math.round(rows.reduce((total, row) => total + row.value, 0) / rows.length);
  if (!formatLike?.displayValue) return String(average);
  const displayValue = formatLike.displayValue;
  const numericPart = displayValue.match(/[\d,.]+(?:\.\d+)?/);
  if (!numericPart) return String(average);
  return displayValue.replace(numericPart[0], average.toLocaleString());
}

function buildTrendPoints(rows: AdminAnalyticsChartDatum[], scaleMode: TrendScaleMode): TrendChartPoint[] {
  if (!rows.length) return [];
  const values = rows.map((row) => row.value);
  const maxValue = Math.max(0, ...values);
  const minValue = scaleMode === 'tight' ? Math.min(...values) : 0;
  const span = Math.max(1, maxValue - minValue);
  const slotWidth = 100 / Math.max(1, rows.length);
  const barWidth = Math.max(3, Math.min(16, slotWidth * 0.55));

  return rows.map((row, index) => {
    const x = rows.length <= 1 ? 50 : Math.round((index / (rows.length - 1)) * 100);
    const y = maxValue === minValue ? 50 : 90 - Math.round(((row.value - minValue) / span) * 80);
    const barHeight = Math.max(2, 90 - y);
    const barX = Math.max(0, Math.min(100 - barWidth, x - barWidth / 2));
    return { ...row, x, y, barX, barWidth, barHeight };
  });
}

function selectedIndexForRows(rows: AdminAnalyticsChartDatum[]) {
  return Math.max(0, rows.length - 1);
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-stone-200 bg-white px-3 py-2">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-stone-400">{label}</p>
      <p className="mt-1 font-bold text-stone-950">{value}</p>
    </div>
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

export function AdminAnalyticsTrendChart({ title, description, rows, emptyLabel, valueLabel, locale }: AdminAnalyticsChartProps) {
  const labels = interactiveCopy[localeKey(locale)];
  const [displayMode, setDisplayMode] = useState<TrendDisplayMode>('line');
  const [scope, setScope] = useState<TrendScope>('all');
  const [scaleMode, setScaleMode] = useState<TrendScaleMode>('zero');
  const [selectedIndex, setSelectedIndex] = useState(() => selectedIndexForRows(rows));
  const normalizedRows = useMemo(() => normalizeRows(rows), [rows]);
  const hasData = hasPositiveChartData(normalizedRows);
  const visibleRows = useMemo(() => rowsForScope(normalizedRows, scope), [normalizedRows, scope]);
  const trendPoints = useMemo(() => buildTrendPoints(visibleRows, scaleMode), [visibleRows, scaleMode]);
  const selectedPoint = trendPoints[Math.min(selectedIndex, Math.max(0, trendPoints.length - 1))];
  const firstLabel = visibleRows[0]?.label;
  const lastLabel = visibleRows[visibleRows.length - 1]?.label;
  const points = trendPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPoints = trendPoints.length ? `0,90 ${points} 100,90` : '';
  const latestRow = visibleRows[visibleRows.length - 1];
  const peakRow = visibleRows.reduce<AdminAnalyticsChartDatum | null>((peak, row) => (!peak || row.value > peak.value ? row : peak), null);
  const minRow = visibleRows.reduce<AdminAnalyticsChartDatum | null>((minimum, row) => (!minimum || row.value < minimum.value ? row : minimum), null);

  const updateScope = (nextScope: TrendScope) => {
    const nextRows = rowsForScope(normalizedRows, nextScope);
    setScope(nextScope);
    setSelectedIndex(selectedIndexForRows(nextRows));
  };

  const selectPoint = (index: number) => {
    setSelectedIndex(index);
  };

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm" aria-label={title}>
      <div>
        <h3 className="text-base font-bold text-stone-950">{title}</h3>
        {description ? <p className="mt-1 text-sm leading-6 text-stone-600">{description}</p> : null}
      </div>

      {hasData ? (
        <>
          <div className="mt-4 rounded-lg border border-stone-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">{labels.options}</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <SegmentedControl
                label={labels.displayMode}
                value={displayMode}
                onChange={setDisplayMode}
                options={[
                  { value: 'line', label: labels.line },
                  { value: 'area', label: labels.area },
                  { value: 'bars', label: labels.bars }
                ]}
              />
              <SegmentedControl
                label={labels.scope}
                value={scope}
                onChange={updateScope}
                options={[
                  { value: 'all', label: labels.all },
                  { value: 'recent', label: labels.recent },
                  { value: 'nonZero', label: labels.nonZero }
                ]}
              />
              <SegmentedControl
                label={labels.scale}
                value={scaleMode}
                onChange={setScaleMode}
                options={[
                  { value: 'zero', label: labels.zeroScale },
                  { value: 'tight', label: labels.tightScale }
                ]}
              />
            </div>
          </div>

          {visibleRows.length ? (
            <>
              <div className="mt-4 rounded-md border border-stone-200 bg-stone-50 p-3" role="img" aria-label={`${title}: ${visibleRows.map((row) => `${row.label} ${row.displayValue ?? row.value}`).join(', ')}`}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-44 w-full overflow-visible text-olive" aria-hidden="true">
                  <line x1="0" y1="90" x2="100" y2="90" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" />
                  <line x1="0" y1="10" x2="100" y2="10" stroke="currentColor" strokeOpacity="0.10" strokeWidth="1" />
                  {displayMode === 'area' ? <polygon points={areaPoints} fill="currentColor" fillOpacity="0.16" /> : null}
                  {displayMode === 'bars'
                    ? trendPoints.map((point, index) => (
                        <rect
                          key={`${point.label}-bar`}
                          x={point.barX}
                          y={90 - point.barHeight}
                          width={point.barWidth}
                          height={point.barHeight}
                          rx="1.5"
                          fill="currentColor"
                          opacity={selectedPoint?.label === point.label ? 0.95 : 0.55}
                          onMouseEnter={() => selectPoint(index)}
                        />
                      ))
                    : <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                  {trendPoints.map((point, index) => (
                    <circle
                      key={`${point.label}-point`}
                      cx={point.x}
                      cy={point.y}
                      r={selectedPoint?.label === point.label ? 2.8 : 2}
                      fill="currentColor"
                      stroke="white"
                      strokeWidth="1.3"
                      opacity={selectedPoint?.label === point.label ? 1 : 0.82}
                      onMouseEnter={() => selectPoint(index)}
                    />
                  ))}
                </svg>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">
                  <span>{firstLabel}</span>
                  <span>{lastLabel}</span>
                </div>
              </div>

              <div className="mt-3 rounded-md border border-olive/20 bg-olive/5 px-3 py-2 text-sm" role="status" aria-live="polite">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-olive">{labels.selectedPoint}</p>
                <p className="mt-1 font-bold text-stone-950">
                  {selectedPoint?.label}: {selectedPoint?.displayValue ?? selectedPoint?.value ?? 0}
                </p>
              </div>

              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
                <StatCard label={labels.latest} value={latestRow?.displayValue ?? latestRow?.value ?? 0} />
                <StatCard label={labels.peak} value={peakRow?.displayValue ?? peakRow?.value ?? 0} />
                <StatCard label={labels.average} value={formatAverageValue(visibleRows, latestRow)} />
                <StatCard label={labels.minimum} value={minRow?.displayValue ?? minRow?.value ?? 0} />
              </div>

              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3" role="list" aria-label={title}>
                {visibleRows.slice(-3).map((row) => (
                  <div key={row.label} role="listitem" className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">{row.label}</p>
                    <p className="mt-1 font-bold text-stone-950">{row.displayValue ?? row.value}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChartState emptyLabel={labels.noFilteredData} />
          )}

          <AdminAnalyticsDataTable title={title} rows={visibleRows.length ? visibleRows : normalizedRows} valueLabel={valueLabel} />
        </>
      ) : (
        <EmptyChartState emptyLabel={emptyLabel} />
      )}
    </article>
  );
}
