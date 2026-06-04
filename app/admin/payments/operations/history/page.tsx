import Link from 'next/link';

import { AdminPaymentOperationHistoryPanel } from '@/components/admin/AdminPaymentOperationHistoryPanel';
import { getAdminIdentity, isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { buildPaymentOperationHistoryRouteResult } from '@/lib/checkout/payment-operation-history-route-core';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPaymentOperationHistoryPage({ searchParams }: { searchParams?: Promise<SearchParams> | SearchParams }) {
  const authenticated = await isAdminAuthenticated();
  const authConfigured = isAdminAuthConfigured();
  const identity = await getAdminIdentity();
  const params = searchParams ? await searchParams : {};
  const historyResult = authenticated
    ? await buildPaymentOperationHistoryRouteResult({
        orderId: firstParam(params.orderId),
        limit: firstParam(params.limit)
      })
    : null;

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Admin / Payments</p>
              <h1 className="mt-1 text-3xl font-bold text-stone-950">Payment operation history</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                Read-only Phase 33 operation history entry point for persisted refund and void records. Provide an orderId query parameter to review migration-gated operation records without creating records, calling providers, or mutating orders/payments.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/payments/operations/preview" className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800">Preview operations</Link>
              <Link href="/admin/payments/settlement" className="rounded-md bg-rosewood px-4 py-2 text-sm font-semibold text-white">Back to settlement</Link>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
            {authConfigured ? authenticated ? `Signed in as ${identity.label ?? identity.email ?? 'admin'}.` : 'Admin authentication is required to view payment operation history.' : 'Admin authentication is not configured yet.'}
          </div>
        </section>

        {authenticated && historyResult?.status === 200 ? <AdminPaymentOperationHistoryPanel view={historyResult.body.history} /> : null}
        {authenticated && historyResult?.status === 400 ? (
          <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-950 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em]">History request validation failed</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">
              {historyResult.body.errors.map((error) => <li key={`${error.field}-${error.code}`}>{error.field}: {error.message}</li>)}
            </ul>
          </section>
        ) : null}
        {authenticated && historyResult?.status === 503 ? (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em]">Payment operation records unavailable</p>
            <h2 className="mt-2 text-xl font-bold">Migration confirmation required</h2>
            <p className="mt-2 text-sm leading-6">{historyResult.body.message}</p>
            <dl className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-amber-200 bg-white/70 p-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em]">Flag</dt>
                <dd className="mt-2 break-words text-sm font-semibold">{historyResult.body.migrationStatus.flagName}</dd>
              </div>
              <div className="rounded-lg border border-amber-200 bg-white/70 p-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em]">Migration</dt>
                <dd className="mt-2 break-words text-sm font-semibold">{historyResult.body.migrationStatus.migrationPath}</dd>
              </div>
            </dl>
          </section>
        ) : null}
      </div>
    </main>
  );
}
