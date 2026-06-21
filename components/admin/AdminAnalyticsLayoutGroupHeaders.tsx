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
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Analytics workspace tabs</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Server-rendered workspace tabs provide fast jumps between analytics groups while preserving the selected range,
            native collapsible sections, existing anchors, section index, and accessible chart table fallbacks.
          </p>
        </div>
        <span className="rounded-full border border-olive/30 bg-olive/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-olive">
          {preview.rangeLabel}
        </span>
      </div>
      <nav aria-label="Analytics workspace tabs" role="tablist" className="mt-5 flex flex-wrap gap-2">
        {preview.groups.map((group) => (
          <Link
            key={group.key}
            href={group.tabHref}
            role="tab"
            aria-selected={group.defaultOpen ? true : undefined}
            className={group.defaultOpen
              ? 'rounded-full bg-olive px-4 py-2 text-sm font-bold text-white shadow-sm'
              : 'rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:border-olive hover:text-olive'}
          >
            {group.tabLabel}
          </Link>
        ))}
      </nav>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {preview.groups.map((group) => (
          <details key={group.key} open={group.defaultOpen} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <summary className="cursor-pointer list-none rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-olive focus-visible:ring-offset-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-stone-950">{group.label}</h3>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{group.description}</p>
                </div>
                <span className="shrink-0 rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-stone-700">
                  Toggle
                </span>
              </div>
            </summary>
            <div className="mt-3 border-t border-stone-200 pt-3">
              <Link
                href={group.href}
                className="inline-flex rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-stone-700 hover:border-olive hover:text-olive"
              >
                Open first section
              </Link>
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
            </div>
          </details>
        ))}
      </div>
      <p className="mt-4 rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-xs leading-5 text-stone-600">
        Workspace tabs are native links, so the dashboard stays server-rendered and mobile-readable while collapsible groups remain available below.
      </p>
    </section>
  );
}
