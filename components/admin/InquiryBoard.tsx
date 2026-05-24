import type { CustomerInquiry } from '@/lib/catalog';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

export function InquiryBoard({ inquiries }: { inquiries: CustomerInquiry[] }) {
  return (
    <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Customer requests</p>
        <h2 className="mt-2 font-display text-4xl text-rosewood">Inquiry inbox</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Product inquiry forms now create records here. Phase 3.1 can add status updates, notes, and notifications.
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
              <div className="mt-4 grid gap-2 text-sm text-stone-700 md:grid-cols-3">
                <p><strong>Name:</strong> {inquiry.name ?? '—'}</p>
                <p><strong>Phone:</strong> {inquiry.phone ?? '—'}</p>
                <p><strong>Email:</strong> {inquiry.email ?? '—'}</p>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-stone-700">{inquiry.message}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
