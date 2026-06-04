import Link from 'next/link';

import { AdminPaymentSettlementSummaryPanel } from '@/components/admin/AdminPaymentSettlementSummaryPanel';
import { getAdminIdentity, isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { paymentSettlementService } from '@/lib/checkout/payment-settlement-service';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentSettlementPage() {
  const authenticated = await isAdminAuthenticated();
  const authConfigured = isAdminAuthConfigured();
  const identity = await getAdminIdentity();
  const summary = authenticated ? await paymentSettlementService.summary(50) : { total: 0, settled: 0, amountMismatch: 0, currencyMismatch: 0, pending: 0, needsAttention: 0, recent: [] };

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Admin / Payments</p>
              <h1 className="mt-1 text-3xl font-bold text-stone-950">Payment settlement</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Review recent payment webhook events and compare provider-reported settlement data against checkout orders.</p>
            </div>
            <Link href="/admin/orders" className="rounded-md bg-rosewood px-4 py-2 text-sm font-semibold text-white">Back to orders</Link>
          </div>
          <div className="mt-4 rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
            {authConfigured ? authenticated ? `Signed in as ${identity.label ?? identity.email ?? 'admin'}.` : 'Admin authentication is required to view settlement data.' : 'Admin authentication is not configured yet.'}
          </div>
        </section>

        {authenticated ? <AdminPaymentSettlementSummaryPanel summary={summary} /> : null}
      </div>
    </main>
  );
}
