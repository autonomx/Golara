import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { assertAdminRole } from '@/lib/admin-auth';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { listManualTransferReviewQueue, type ManualTransferReviewQueueItem } from '@/lib/checkout/manual-transfer-verification';
import { verifyManualTransferPaymentAction } from './actions';

export const dynamic = 'force-dynamic';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

function StatusBanner({ status }: { status?: string }) {
  if (status === 'manual-transfer-received') {
    return <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">Manual transfer marked received and payment moved forward.</div>;
  }
  if (status === 'manual-transfer-rejected') {
    return <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">Manual transfer rejected and payment marked failed.</div>;
  }
  if (status === 'manual-transfer-follow-up') {
    return <div className="mb-6 rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-900">Manual transfer marked for follow-up.</div>;
  }
  return null;
}

function ReviewForm({ attempt, outcome, label, tone }: { attempt: ManualTransferReviewQueueItem; outcome: 'received' | 'rejected' | 'needs_follow_up'; label: string; tone: string }) {
  const action = verifyManualTransferPaymentAction.bind(null, attempt.orderId, attempt.id);
  return (
    <form action={action} className="grid gap-3 rounded-2xl border border-rosewood/10 bg-white/80 p-3">
      <input type="hidden" name="outcome" value={outcome} />
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-rosewood/70">
        Received amount
        <input name="receivedAmountCents" type="number" min={0} defaultValue={attempt.amountCents} className="rounded-xl border border-rosewood/15 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-800 outline-none focus:border-rosewood" />
      </label>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-rosewood/70">
        Bank/reference code
        <input name="providerReference" defaultValue={attempt.providerReference ?? attempt.manualPaymentReference ?? ''} className="rounded-xl border border-rosewood/15 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-800 outline-none focus:border-rosewood" />
      </label>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-rosewood/70">
        Verification note
        <textarea name="note" defaultValue={attempt.verificationNote ?? ''} className="min-h-20 rounded-xl border border-rosewood/15 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-800 outline-none focus:border-rosewood" />
      </label>
      <button type="submit" className={`rounded-full px-4 py-2 text-xs font-semibold ${tone}`}>{label}</button>
    </form>
  );
}

function ReviewCard({ attempt }: { attempt: ManualTransferReviewQueueItem }) {
  return (
    <article className="rounded-[2rem] border border-rosewood/10 bg-cream p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive">Manual transfer</p>
          <h2 className="mt-2 font-display text-3xl text-rosewood">{attempt.orderNumber}</h2>
          <p className="mt-2 text-sm text-stone-600">{attempt.paymentMethodLabel ?? 'Bank transfer / card-to-card'} · {attempt.status}</p>
        </div>
        <time className="rounded-full border border-rosewood/10 bg-white px-3 py-1 text-xs font-semibold text-stone-500">{formatDate(attempt.createdAt)}</time>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-stone-700 md:grid-cols-2">
        <p><strong>Customer:</strong> {attempt.customerName || 'Guest'}{attempt.customerPhone ? ` · ${attempt.customerPhone}` : ''}</p>
        <p><strong>Amount:</strong> {formatMinorUnitAmount(attempt.amountCents, attempt.currency)}</p>
        <p className="break-all"><strong>Customer reference:</strong> {attempt.manualPaymentReference || 'Not provided'}</p>
        <p className="break-all"><strong>Proof URL:</strong> {attempt.manualPaymentProofUrl ? <a className="text-rosewood underline" href={attempt.manualPaymentProofUrl}>{attempt.manualPaymentProofUrl}</a> : 'Not provided'}</p>
        <p><strong>Verification:</strong> {attempt.verificationStatus || 'Not reviewed'}</p>
        <p><strong>Provider reference:</strong> {attempt.providerReference || 'Not set'}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/admin/orders/${attempt.orderId}`} className="rounded-full border border-rosewood/20 bg-white px-4 py-2 text-xs font-semibold text-rosewood">Open order</Link>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <ReviewForm attempt={attempt} outcome="received" label="Mark received" tone="bg-emerald-700 text-white" />
        <ReviewForm attempt={attempt} outcome="needs_follow_up" label="Needs follow-up" tone="border border-blue-200 bg-blue-50 text-blue-900" />
        <ReviewForm attempt={attempt} outcome="rejected" label="Reject transfer" tone="border border-red-200 bg-red-50 text-red-800" />
      </div>
    </article>
  );
}

export default async function ManualTransferReviewPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await assertAdminRole('staff');
  const [{ status }, attempts] = await Promise.all([searchParams, listManualTransferReviewQueue()]);

  return (
    <main id="main-content" tabIndex={-1}>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <StatusBanner status={status} />
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Payments</p>
            <h1 className="mt-3 font-display text-5xl text-rosewood">Manual transfer review</h1>
            <p className="mt-4 max-w-3xl text-stone-600">Review bank-transfer and card-to-card payment attempts, confirm received funds, reject bad references, or send orders back for staff follow-up.</p>
          </div>
          <Link href="/admin/orders" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood">Back to orders</Link>
        </div>

        {attempts.length === 0 ? (
          <div className="rounded-[2rem] border border-rosewood/10 bg-cream p-6 text-sm text-stone-700">No manual-transfer payment attempts need review.</div>
        ) : (
          <div className="grid gap-5">
            {attempts.map((attempt) => <ReviewCard key={attempt.id} attempt={attempt} />)}
          </div>
        )}
      </section>
    </main>
  );
}
