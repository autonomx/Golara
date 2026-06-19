import Link from 'next/link';

import type { AdminAnalyticsLayoutPreview } from '@/lib/analytics/admin-analytics-layout';

type AdminAnalyticsLayoutGroupHeadersProps = {
  preview: AdminAnalyticsLayoutPreview;
};

export function AdminAnalyticsLayoutGroupHeaders({ preview }: AdminAnalyticsLayoutGroupHeadersProps) {
  return (
    <section id="analytics-layout-groups" className="scroll-mt-24 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Dashboard groups</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Analytics at a glance</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Static group headers organize the analytics workspace by purpose while preserving the selected range, existing anchors,
            section index, and accessible chart table fallbacks.
          </p>
        </div>
        <span className="rounded-full border border-olive/30 bg-olive/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-olive">
          {preview.rangeLabel}
        </span>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {preview.groups.map((group) => (
          <article key={group.key} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-950">{group.label}</h3>
                <p className="mt-1 text-sm leading-6 text-stone-600">{group.description}</p>
              </div>
              <Link
                href={group.href}
                className="shrink-0 rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-stone-700 hover:border-olive hover:text-olive"
              >
                Open
              </Link>
            </div>
            <nav aria-label={`${group.label} analytics links`} className="mt-3 flex flex-wrap gap-2">
              {group.sections.map((section) => (
                <Link
                  key={section.anchor}
                  href={section.href}
                  className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700 hover:border-olive hover:text-olive"
                >
                  {section.label}
                </Link>
              ))}
            </nav>
          </article>
        ))}
      </div>
      <p className="mt-4 rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-xs leading-5 text-stone-600">
        Collapsible groups and tabs remain disabled; this pass adds readable group headers only.
      </p>
    </section>
  );
}
