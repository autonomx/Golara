import { saveInquiryAction } from '@/app/admin/inquiry-actions';
import type { CustomerInquiry } from '@/lib/catalog';

const statuses = ['new', 'contacted', 'confirmed', 'fulfilled', 'cancelled'];

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

function formatDateOnly(value?: Date) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(value);
}

export function InquiryBoard({ inquiries }: { inquiries: CustomerInquiry[] }) {
  return (
    <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Customer requests</p>
        <h2 className="mt-2 font-display text-4xl text-rosewood">Inquiry inbox</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Review incoming product requests, update their status, and keep internal staff notes.
        </p>
      </div>

      {inquiries.length === 0 ? (
        <div className="rounded-3xl border border-rosewood/10 bg-cream p-6 text-sm text-stone-600">
          No customer inquiries yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {inquiries.map((inquiry) => (
            <article key={inquiry.id} className="rounded-3xl border border-rosewood/10 bg-cream p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl text-rosewood">{inquiry.productTitle ?? 'General inquiry'}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-rosewood/50">{formatDate(inquiry.createdAt)}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-olive">
                  {inquiry.status}
                </span>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-stone-700 md:grid-cols-4">
                <p><strong>Name:</strong> {inquiry.name ?? '—'}</p>
                <p><strong>Phone:</strong> {inquiry.phone ?? '—'}</p>
                <p><strong>Email:</strong> {inquiry.email ?? '—'}</p>
                <p><strong>Delivery:</strong> {formatDateOnly(inquiry.deliveryDate)}</p>
              </div>
              {inquiry.deliveryNotes ? (
                <p className="mt-3 text-sm leading-6 text-stone-700"><strong>Delivery notes:</strong> {inquiry.deliveryNotes}</p>
              ) : null}
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-stone-700">{inquiry.message}</p>
              <form action={saveInquiryAction.bind(null, inquiry.id)} className="mt-5 grid gap-3 rounded-2xl border border-rosewood/10 bg-white p-4">
                <label className="grid gap-2 text-sm font-semibold text-rosewood">
                  Status
                  <select className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood" name="status" defaultValue={inquiry.status}>
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood">
                  Staff notes
                  <textarea className="min-h-24 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood" name="staffNotes" defaultValue={inquiry.staffNotes ?? ''} />
                </label>
                <button className="rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rosewood/20" type="submit">
                  Save inquiry
                </button>
              </form>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
