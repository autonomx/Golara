import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { assertAdminRole } from '@/lib/admin-auth';
import { refundPaymentToWalletAction } from './actions';

export const dynamic = 'force-dynamic';

function StatusBanner({ status }: { status?: string }) {
  if (status === 'wallet-refunded') {
    return <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">Refund was credited to the customer wallet and recorded in the ledger.</div>;
  }
  return null;
}

function WalletRefundForm() {
  return (
    <form action={refundPaymentToWalletAction} className="grid gap-5 rounded-[2rem] border border-rosewood/10 bg-cream p-6 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive">Owner controls</p>
        <h2 className="mt-2 font-display text-3xl text-rosewood">Refund payment to wallet</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">Credit a paid payment attempt back into the customer wallet with an idempotent refund ledger entry. Full refunds transition the payment attempt to refunded; partial refunds preserve the paid payment state with refund metadata.</p>
      </div>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-rosewood/70">
        Payment attempt ID
        <input name="paymentAttemptId" required className="rounded-xl border border-rosewood/15 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-800 outline-none focus:border-rosewood" />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-rosewood/70">
          Amount minor units <span className="normal-case tracking-normal text-stone-500">optional; empty refunds full amount</span>
          <input name="amountCents" type="number" min={1} className="rounded-xl border border-rosewood/15 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-800 outline-none focus:border-rosewood" />
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-rosewood/70">
          Idempotency key <span className="normal-case tracking-normal text-stone-500">optional</span>
          <input name="idempotencyKey" className="rounded-xl border border-rosewood/15 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-800 outline-none focus:border-rosewood" />
        </label>
      </div>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-rosewood/70">
        Refund note
        <textarea name="note" className="min-h-28 rounded-xl border border-rosewood/15 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-800 outline-none focus:border-rosewood" />
      </label>
      <button type="submit" className="w-fit rounded-full bg-rosewood px-5 py-3 text-sm font-semibold text-white shadow-sm">Credit refund to wallet</button>
    </form>
  );
}

export default async function AdminWalletRefundPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await assertAdminRole('staff');
  const { status } = await searchParams;

  return (
    <main id="main-content" tabIndex={-1}>
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-5 py-14">
        <StatusBanner status={status} />
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Payments</p>
            <h1 className="mt-3 font-display text-5xl text-rosewood">Wallet refunds</h1>
            <p className="mt-4 max-w-3xl text-stone-600">Method-aware refund support for the wallet/store-credit lane. Use this page to credit paid payment attempts back into a customer wallet while preserving idempotency, audit, and order timeline evidence.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/payments/wallets" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood">Wallet ledger</Link>
            <Link href="/admin/orders" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood">Orders</Link>
          </div>
        </div>
        <WalletRefundForm />
      </section>
    </main>
  );
}
