import Link from 'next/link';

import { AdminPaymentOperationProviderReadinessPanel } from '@/components/admin/AdminPaymentOperationProviderReadinessPanel';
import { getAdminIdentity, isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { buildPaymentOperationProviderReadinessRouteResult } from '@/lib/checkout/payment-operation-provider-readiness-route-core';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentOperationProvidersPage() {
  const authenticated = await isAdminAuthenticated();
  const authConfigured = isAdminAuthConfigured();
  const identity = await getAdminIdentity();
  const readinessResult = authenticated ? buildPaymentOperationProviderReadinessRouteResult() : null;

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Admin / Payments</p>
              <h1 className="mt-1 text-3xl font-bold text-stone-950">Payment provider readiness</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                Read-only Phase 33 diagnostics for refund and void provider readiness. This page reports credential environment variable names, endpoint-mapping evidence, and provider-validation evidence without executing adapters, calling providers, creating records, or mutating orders/payments.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/payments/operations/history" className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800">Operation history</Link>
              <Link href="/admin/payments/operations/preview" className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800">Preview operations</Link>
              <Link href="/admin/payments/settlement" className="rounded-md bg-rosewood px-4 py-2 text-sm font-semibold text-white">Back to settlement</Link>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
            {authConfigured ? authenticated ? `Signed in as ${identity.label ?? identity.email ?? 'admin'}.` : 'Admin authentication is required to view payment provider readiness.' : 'Admin authentication is not configured yet.'}
          </div>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
            Execution remains disabled. These diagnostics are informational only and do not submit refunds, void authorizations, provider requests, inventory/capacity release, or order/payment mutations.
          </div>
        </section>

        {authenticated && readinessResult?.status === 200 ? <AdminPaymentOperationProviderReadinessPanel summary={readinessResult.body.summary} /> : null}
      </div>
    </main>
  );
}
