import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { assertAdminRole } from '@/lib/admin-auth';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { listCustomerWalletSummaries, type CustomerWalletSummary } from '@/lib/checkout/customer-wallet-ledger';
import { adjustCustomerWalletAction } from './actions';

export const dynamic = 'force-dynamic';

function formatDate(value: Date | null) {
  if (!value) return 'No ledger entries yet';
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

function StatusBanner({ status }: { status?: string }) {
  if (status === 'wallet-credited') {
    return <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">Wallet credit posted and ledger entry recorded.</div>;
  }
  if (status === 'wallet-debited') {
    return <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">Wallet debit posted and ledger entry recorded.</div>;
  }
  return null;
}

function WalletAdjustmentForm() {
  return (
    <form action={adjustCustomerWalletAction} className="grid gap-4 rounded-[2rem] border border-rosewood/10 bg-cream p-5 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive">Owner controls</p>
        <h2 className="mt-2 font-display text-3xl text-rosewood">Post wallet adjustment</h2>
        <p className="mt-2 text-sm text-stone-600">Credit or debit a customer wallet with an immutable ledger entry. Debits are blocked when they exceed the available balance.</p>
      </div>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-rosewood/70">
        Customer ID
        <input name="customerId" required className="rounded-xl border border-rosewood/15 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-800 outline-none focus:border-rosewood" />
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-rosewood/70">
          Direction
          <select name="direction" defaultValue="credit" className="rounded-xl border border-rosewood/15 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-800 outline-none focus:border-rosewood">
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-rosewood/70">
          Amount (minor units)
          <input name="amountCents" type="number" min={1} required className="rounded-xl border border-rosewood/15 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-800 outline-none focus:border-rosewood" />
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-rosewood/70">
          Currency
          <input name="currency" defaultValue="TOMAN" className="rounded-xl border border-rosewood/15 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-800 outline-none focus:border-rosewood" />
        </label>
      </div>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-rosewood/70">
        Idempotency key <span className="normal-case tracking-normal text-stone-500">optional</span>
        <input name="idempotencyKey" className="rounded-xl border border-rosewood/15 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-800 outline-none focus:border-rosewood" />
      </label>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-rosewood/70">
        Note
        <textarea name="note" className="min-h-24 rounded-xl border border-rosewood/15 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-800 outline-none focus:border-rosewood" />
      </label>
      <button type="submit" className="w-fit rounded-full bg-rosewood px-5 py-3 text-sm font-semibold text-white shadow-sm">Post ledger entry</button>
    </form>
  );
}

function WalletCard({ wallet }: { wallet: CustomerWalletSummary }) {
  return (
    <article className="rounded-[2rem] border border-rosewood/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive">Wallet / store credit</p>
          <h2 className="mt-2 font-display text-3xl text-rosewood">{wallet.customerName || wallet.customerPhone || wallet.customerId}</h2>
          <p className="mt-2 text-sm text-stone-600">{wallet.customerPhone || 'No phone'}{wallet.customerEmail ? ` · ${wallet.customerEmail}` : ''}</p>
        </div>
        <span className="rounded-full border border-rosewood/10 bg-cream px-3 py-1 text-xs font-semibold text-stone-600">{wallet.currency}</span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-rosewood/10 bg-cream p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Available</p>
          <p className="mt-2 text-lg font-bold text-rosewood">{formatMinorUnitAmount(wallet.availableBalanceCents, wallet.currency)}</p>
        </div>
        <div className="rounded-2xl border border-rosewood/10 bg-cream p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Reserved</p>
          <p className="mt-2 text-lg font-bold text-rosewood">{formatMinorUnitAmount(wallet.reservedBalanceCents, wallet.currency)}</p>
        </div>
        <div className="rounded-2xl border border-rosewood/10 bg-cream p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Lifetime credit</p>
          <p className="mt-2 text-lg font-bold text-rosewood">{formatMinorUnitAmount(wallet.lifetimeCreditCents, wallet.currency)}</p>
        </div>
        <div className="rounded-2xl border border-rosewood/10 bg-cream p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Lifetime debit</p>
          <p className="mt-2 text-lg font-bold text-rosewood">{formatMinorUnitAmount(wallet.lifetimeDebitCents, wallet.currency)}</p>
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold text-stone-500">{wallet.entryCount} ledger entries · Last activity: {formatDate(wallet.lastEntryAt)}</p>
    </article>
  );
}

export default async function AdminWalletLedgerPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await assertAdminRole('staff');
  const [{ status }, wallets] = await Promise.all([searchParams, listCustomerWalletSummaries()]);

  return (
    <main id="main-content" tabIndex={-1}>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <StatusBanner status={status} />
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Payments</p>
            <h1 className="mt-3 font-display text-5xl text-rosewood">Wallet ledger</h1>
            <p className="mt-4 max-w-3xl text-stone-600">Track customer wallet/store-credit balances with immutable ledger entries. This phase enables staff-controlled credits/debits before automated wallet checkout capture is connected.</p>
          </div>
          <Link href="/admin/payment-methods" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood">Payment methods</Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="grid gap-5">
            {wallets.length === 0 ? (
              <div className="rounded-[2rem] border border-rosewood/10 bg-cream p-6 text-sm text-stone-700">No wallet balances have been created yet.</div>
            ) : (
              wallets.map((wallet) => <WalletCard key={wallet.id} wallet={wallet} />)
            )}
          </div>
          <WalletAdjustmentForm />
        </div>
      </section>
    </main>
  );
}
