import { CreditCard } from 'lucide-react';
import { AdminActionBanner } from '@/components/admin/AdminActionBanner';
import { getAdminIdentity } from '@/lib/admin-auth';
import { requireAdminRouteSession } from '@/lib/admin-page-auth-boundary';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { listInstallmentCollectionQueue } from '@/lib/checkout/installment-collection';
import { listInstallmentReviewQueue } from '@/lib/checkout/installment-review';
import { collectInstallmentScheduleEntryAction, reviewInstallmentAction } from './actions';

export const dynamic = 'force-dynamic';

type PageSearchParams = Promise<{ status?: string; message?: string }>;

function money(amount: number, currency: string) {
  return formatMinorUnitAmount(amount, currency, currency === 'IRR' ? 'fa-IR' : 'en-CA');
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(value);
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

function hiddenCollectionFields(item: { id: string }, outcome: string) {
  return (
    <>
      <input type="hidden" name="entryId" value={item.id} />
      <input type="hidden" name="outcome" value={outcome} />
    </>
  );
}

export default async function AdminInstallmentPaymentsPage({ searchParams }: { searchParams: PageSearchParams }) {
  await requireAdminRouteSession();
  const admin = await getAdminIdentity();
  const { status, message } = await searchParams;
  const [items, collectionItems] = await Promise.all([
    listInstallmentReviewQueue(),
    listInstallmentCollectionQueue()
  ]);
  const canReview = admin.role === 'owner';
  const canCollect = admin.authenticated;

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 text-stone-900 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        <a href="/admin/orders" className="text-sm font-semibold text-rosewood underline-offset-4 hover:underline">← Back to orders</a>
        <header className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-rosewood">Payments / Installments</p>
              <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold text-stone-950"><CreditCard aria-hidden="true" className="h-7 w-7" /> Installment operations</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Review installment and credit purchase requests, then track staff collection state against approved schedule entries. Approval creates the schedule from the approved term and first-due date; collection actions update schedule entries, plan state, order timeline, and audit evidence.</p>
            </div>
            <div className="grid gap-2 text-sm font-semibold text-stone-700">
              <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">{items.length} pending/reviewable</div>
              <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">{collectionItems.length} scheduled collections</div>
            </div>
          </div>
        </header>

        <AdminActionBanner status={status} message={message} />

        {!canReview ? <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Only owners can approve or reject installment requests. This queue is visible for operational awareness.</section> : null}

        <section className="grid gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400">Approval queue</p>
            <h2 className="mt-1 text-2xl font-bold text-stone-950">Installment requests</h2>
          </div>
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
                    <label className="grid gap-1 text-sm font-semibold text-stone-700">First due date
                      <input name="firstDueAt" type="date" className="rounded-lg border border-stone-200 px-3 py-2" />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-stone-700">Approval note
                      <textarea name="note" rows={2} className="rounded-lg border border-stone-200 px-3 py-2" />
                    </label>
                    <p className="text-xs leading-5 text-stone-500">Approving creates the installment plan and scheduled receivable entries immediately. Leave first due date blank to default to one month from now.</p>
                    <button disabled={!canReview} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:bg-stone-300">Approve and create schedule</button>
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

        <section className="grid gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400">Collection queue</p>
            <h2 className="mt-1 text-2xl font-bold text-stone-950">Scheduled installment payments</h2>
            <p className="mt-1 text-sm text-stone-600">Staff can mark scheduled receivables as paid, failed, or waived. Paid/waived entries become final; failed entries remain visible for follow-up.</p>
          </div>
          {collectionItems.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">No installment schedule entries are awaiting collection.</div> : null}
          {collectionItems.map((entry) => (
            <article key={entry.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
                <div className="grid gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">Order {entry.orderNumber} · payment {entry.sequence}/{entry.installmentCount}</p>
                    <h3 className="mt-1 text-xl font-bold text-stone-950">{entry.customerName ?? 'Customer'} · {money(entry.totalCents, entry.currency)}</h3>
                    <p className="mt-1 text-sm text-stone-500">Due {formatDate(entry.dueAt)} · entry {entry.status} · plan {entry.planStatus}</p>
                  </div>
                  <dl className="grid gap-3 text-sm sm:grid-cols-3">
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3"><dt className="font-semibold text-stone-500">Customer phone</dt><dd className="mt-1 text-stone-900">{entry.customerPhone ?? 'No phone on file'}</dd></div>
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3"><dt className="font-semibold text-stone-500">Term</dt><dd className="mt-1 text-stone-900">{entry.termMonths} months</dd></div>
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3"><dt className="font-semibold text-stone-500">Payment attempt</dt><dd className="mt-1 break-all text-stone-900">{entry.paymentAttemptId}</dd></div>
                  </dl>
                </div>

                <div className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <form action={collectInstallmentScheduleEntryAction} className="grid gap-3 rounded-xl bg-white p-3">
                    {hiddenCollectionFields(entry, 'paid')}
                    <label className="grid gap-1 text-sm font-semibold text-stone-700">Collected amount cents
                      <input name="collectedAmountCents" inputMode="numeric" defaultValue={entry.totalCents} className="rounded-lg border border-stone-200 px-3 py-2" />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-stone-700">Provider / receipt reference
                      <input name="providerReference" className="rounded-lg border border-stone-200 px-3 py-2" />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-stone-700">Collection note
                      <textarea name="note" rows={2} className="rounded-lg border border-stone-200 px-3 py-2" />
                    </label>
                    <button disabled={!canCollect} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:bg-stone-300">Mark paid</button>
                  </form>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <form action={collectInstallmentScheduleEntryAction} className="grid gap-3 rounded-xl bg-white p-3">
                      {hiddenCollectionFields(entry, 'failed')}
                      <label className="grid gap-1 text-sm font-semibold text-stone-700">Failure note
                        <textarea name="note" rows={2} className="rounded-lg border border-stone-200 px-3 py-2" />
                      </label>
                      <button disabled={!canCollect} className="rounded-full bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:bg-stone-300">Mark failed</button>
                    </form>
                    <form action={collectInstallmentScheduleEntryAction} className="grid gap-3 rounded-xl bg-white p-3">
                      {hiddenCollectionFields(entry, 'waived')}
                      <label className="grid gap-1 text-sm font-semibold text-stone-700">Waiver note
                        <textarea name="note" rows={2} className="rounded-lg border border-stone-200 px-3 py-2" />
                      </label>
                      <button disabled={!canCollect} className="rounded-full bg-stone-700 px-4 py-2 text-sm font-bold text-white disabled:bg-stone-300">Waive</button>
                    </form>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
