import { CreditCard } from 'lucide-react';
import { AdminActionBanner } from '@/components/admin/AdminActionBanner';
import { requireAdminRouteSession } from '@/lib/admin-page-auth-boundary';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { listInstallmentReviewQueue } from '@/lib/checkout/installment-review';
import { reviewInstallmentAction } from './actions';

export const dynamic = 'force-dynamic';

type PageSearchParams = Promise<{ status?: string; message?: string }>;

function money(amount: number, currency: string) {
  return formatMinorUnitAmount(amount, currency, currency === 'IRR' ? 'fa-IR' : 'en-CA');
}

function hiddenFields(item: { orderId: string; id: string }, outcome: string) {
  return (
    <>
      <input type="hidden" name="orderId" value={item.orderId} />
      <input type="hidden" name="paymentAttemptId" value={item.id} />
      <input type="hidden" name="outcome" value={outcome} />
    </>
  );
}

export default async function AdminInstallmentPaymentsPage({ searchParams }: { searchParams: PageSearchParams }) {
  const admin = await requireAdminRouteSession();
  const { status, message } = await searchParams;
  const items = await listInstallmentReviewQueue();
  const canReview = admin.role === 'owner';

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 text-stone-900 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        <a href="/admin/orders" className="text-sm font-semibold text-rosewood underline-offset-4 hover:underline">← Back to orders</a>
        <header className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-rosewood">Payments / Installments</p>
              <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold text-stone-950"><CreditCard aria-hidden="true" className="h-7 w-7" /> Installment review queue</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Review installment and credit purchase requests captured during checkout. Approval marks the request as approved and keeps the payment pending for schedule setup; rejection fails the payment attempt.</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-700">{items.length} pending/reviewable</div>
          </div>
        </header>

        <AdminActionBanner status={status} message={message} />

        {!canReview ? <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Only owners can approve or reject installment requests. This queue is visible for operational awareness.</section> : null}

        <section className="grid gap-4">
          {items.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">No installment requests are waiting for review.</div> : null}
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="grid gap-5 lg:grid-cols-[1fr_26rem]">
                <div className="grid gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">Order {item.orderNumber}</p>
                    <h2 className="mt-1 text-xl font-bold text-stone-950">{item.customerName ?? 'Customer'} · {money(item.amountCents, item.currency)}</h2>
                    <p className="mt-1 text-sm text-stone-500">{item.customerPhone ?? 'No phone on file'} · {item.paymentMethodLabel ?? 'Installment / credit'} · payment {item.status}</p>
                  </div>
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3"><dt className="font-semibold text-stone-500">Requested term</dt><dd className="mt-1 text-stone-900">{item.requestedTermMonths ? `${item.requestedTermMonths} months` : 'Not specified'}</dd></div>
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3"><dt className="font-semibold text-stone-500">Approval status</dt><dd className="mt-1 text-stone-900">{item.approvalStatus ?? 'pending_review'}</dd></div>
                    {item.requestNote ? <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 sm:col-span-2"><dt className="font-semibold text-stone-500">Customer note</dt><dd className="mt-1 whitespace-pre-wrap text-stone-900">{item.requestNote}</dd></div> : null}
                    {item.reviewNote ? <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 sm:col-span-2"><dt className="font-semibold text-stone-500">Review note</dt><dd className="mt-1 whitespace-pre-wrap text-stone-900">{item.reviewNote}</dd></div> : null}
                  </dl>
                </div>

                <div className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <form action={reviewInstallmentAction} className="grid gap-3 rounded-xl bg-white p-3">
                    {hiddenFields(item, 'approved')}
                    <label className="grid gap-1 text-sm font-semibold text-stone-700">Approved term
                      <select name="approvedTermMonths" defaultValue={item.requestedTermMonths ?? 6} className="rounded-lg border border-stone-200 px-3 py-2">
                        {[3, 6, 12, 18].map((term) => <option key={term} value={term}>{term} months</option>)}
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-stone-700">Down payment cents
                      <input name="downPaymentCents" inputMode="numeric" placeholder="0" className="rounded-lg border border-stone-200 px-3 py-2" />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-stone-700">Approval note
                      <textarea name="note" rows={2} className="rounded-lg border border-stone-200 px-3 py-2" />
                    </label>
                    <button disabled={!canReview} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:bg-stone-300">Approve request</button>
                  </form>

                  <form action={reviewInstallmentAction} className="grid gap-3 rounded-xl bg-white p-3">
                    {hiddenFields(item, 'needs_follow_up')}
                    <label className="grid gap-1 text-sm font-semibold text-stone-700">Follow-up note
                      <textarea name="note" rows={2} className="rounded-lg border border-stone-200 px-3 py-2" />
                    </label>
                    <button disabled={!canReview} className="rounded-full bg-amber-600 px-4 py-2 text-sm font-bold text-white disabled:bg-stone-300">Request follow-up</button>
                  </form>

                  <form action={reviewInstallmentAction} className="grid gap-3 rounded-xl bg-white p-3">
                    {hiddenFields(item, 'rejected')}
                    <label className="grid gap-1 text-sm font-semibold text-stone-700">Rejection note
                      <textarea name="note" rows={2} className="rounded-lg border border-stone-200 px-3 py-2" />
                    </label>
                    <button disabled={!canReview} className="rounded-full bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:bg-stone-300">Reject request</button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
