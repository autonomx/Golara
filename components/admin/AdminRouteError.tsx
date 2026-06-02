'use client';

import { AlertTriangle } from 'lucide-react';

export function AdminRouteError({ title = 'Admin module error', error, reset }: { title?: string; error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen bg-stone-50 lg:pl-72">
      <section className="grid min-h-screen place-items-center px-4 py-10">
        <div className="w-full max-w-2xl rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-red-50 text-red-700">
            <AlertTriangle aria-hidden="true" className="h-5 w-5" />
          </span>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-red-700">Module error</p>
          <h1 className="mt-2 text-2xl font-bold text-stone-950">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            This admin section could not load. Try again, or check the server logs if the problem repeats.
          </p>
          <div className="mt-4 rounded-md border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
            {error.message || error.digest || 'Unknown error'}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={reset} className="rounded-md bg-rosewood px-4 py-2 text-sm font-semibold text-white">
              Retry
            </button>
            <a href="/admin" className="rounded-md border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700">
              Back to overview
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
