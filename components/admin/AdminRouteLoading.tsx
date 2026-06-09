'use client';

import { useEffect, useMemo, useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { STOREFRONT_LOCALE_COOKIE } from '@/lib/i18n/locale-cookie';
import { createAdminRouteLoadingTranslator } from '@/lib/localization/admin-route-loading-copy';

function readClientLocale() {
  if (typeof document === 'undefined') return undefined;

  const cookieLocale = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${STOREFRONT_LOCALE_COOKIE}=`))
    ?.split('=')[1];

  if (cookieLocale) return decodeURIComponent(cookieLocale);
  if (typeof navigator !== 'undefined') return navigator.language;
  return undefined;
}

export function AdminRouteLoading({ title = 'Admin', eyebrow = 'Loading module' }: { title?: string; eyebrow?: string }) {
  const [locale, setLocale] = useState<string | undefined>();

  useEffect(() => {
    setLocale(readClientLocale());
  }, []);

  const t = useMemo(() => createAdminRouteLoadingTranslator(locale), [locale]);

  return (
    <main className="min-h-screen bg-stone-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-stone-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-stone-200 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-rosewood font-display text-xl text-white">G</span>
            <span>
              <span className="block text-sm font-bold text-stone-950">Golara</span>
              <span className="block text-xs font-medium text-stone-500">{t('Operations console')}</span>
            </span>
          </div>
        </div>
        <div className="grid gap-5 px-3 py-4">
          {Array.from({ length: 4 }).map((_, sectionIndex) => (
            <div key={sectionIndex}>
              <div className="mx-3 mb-3 h-3 w-24 rounded bg-stone-100" />
              <div className="grid gap-2">
                <div className="h-10 rounded-md bg-stone-100" />
                <div className="h-10 rounded-md bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      </aside>
      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95">
          <div className="flex min-h-16 items-center gap-3 px-4 py-3 lg:px-6">
            <span className="grid h-9 w-9 place-items-center rounded-md border border-stone-200 bg-stone-50 text-stone-700">
              <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400">{t(eyebrow)}</p>
              <h1 className="text-lg font-bold text-stone-950">{t(title)}</h1>
            </div>
          </div>
        </header>
        <section className="grid gap-6 px-4 py-6 lg:px-6">
          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div className="h-4 w-40 rounded bg-stone-100" />
            <div className="mt-4 h-8 w-72 max-w-full rounded bg-stone-100" />
            <div className="mt-3 h-4 w-full max-w-2xl rounded bg-stone-100" />
          </div>
          <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
            <div className="grid gap-3 p-5">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_8rem]">
                  <div className="h-10 rounded bg-stone-100" />
                  <div className="h-10 rounded bg-stone-100" />
                  <div className="h-10 rounded bg-stone-100" />
                  <div className="h-10 rounded bg-stone-100" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
