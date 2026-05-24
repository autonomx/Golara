import Link from 'next/link';
import { addInquiryFollowUpAction, saveInquiryAction } from '@/app/admin/inquiry-actions';
import { InquiryContactActions } from '@/components/admin/InquiryContactActions';
import { InquiryDeliveryBadge } from '@/components/admin/InquiryDeliveryBadge';
import { InquiryEmptyState } from '@/components/admin/InquiryEmptyState';
import { InquiryFollowUpSummary } from '@/components/admin/InquiryFollowUpSummary';
import { InquiryStatusShortcuts } from '@/components/admin/InquiryStatusShortcuts';
import type { CustomerInquiry } from '@/lib/catalog';
import type { InquiryPage, InquiryStatusCount } from '@/lib/cms/catalog-repository';

const statuses = ['new', 'contacted', 'confirmed', 'fulfilled', 'cancelled'];
const channels = ['internal', 'phone', 'email', 'whatsapp'];

const statusBadgeClass: Record<string, string> = {
  new: 'border-rosewood/20 bg-white text-rosewood',
  contacted: 'border-olive/20 bg-cream text-olive',
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  fulfilled: 'border-stone-200 bg-stone-50 text-stone-700',
  cancelled: 'border-red-200 bg-red-50 text-red-700'
};

const channelBadgeClass: Record<string, string> = {
  system: 'border-stone-300 bg-stone-100 text-stone-700',
  internal: 'border-rosewood/15 bg-white text-rosewood',
  phone: 'border-olive/20 bg-cream text-olive',
  email: 'border-blue-200 bg-blue-50 text-blue-800',
  whatsapp: 'border-emerald-200 bg-emerald-50 text-emerald-800'
};

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

function statusClass(status: string) {
  return statusBadgeClass[status] ?? 'border-rosewood/20 bg-white text-rosewood';
}

function channelClass(channel: string) {
  return channelBadgeClass[channel] ?? 'border-rosewood/15 bg-white text-rosewood';
}

function countFor(counts: InquiryStatusCount[], status: string) {
  return counts.find((item) => item.status === status)?.count ?? 0;
}

function adminParams(status?: string, search?: string, page?: number) {
  const params = new URLSearchParams();
  if (status) params.set('inquiryStatus', status);
  if (search) params.set('inquirySearch', search);
  if (page && page > 1) params.set('inquiryPage', String(page));
  const query = params.toString();
  return query ? `/admin?${query}` : '/admin';
}

function inquiryToolHref(path: string, status?: string, search?: string) {
  const params = new URLSearchParams();
  if (status) params.set('inquiryStatus', status);
  if (search) params.set('inquirySearch', search);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function filterHref(status?: string, search?: string) {
  return adminParams(status, search);
}

function pageHref(page: number, status?: string, search?: string) {
  return adminParams(status, search, page);
}

function exportHref(status?: string, search?: string) {
  return inquiryToolHref('/admin/inquiries/export', status, search);
}

function printHref(status?: string, search?: string) {
  return inquiryToolHref('/admin/inquiries/print', status, search);
}

function ReturnStateFields({ activeStatus, search, page }: { activeStatus?: string; search?: string; page: number }) {
  return (
    <>
      {activeStatus ? <input type="hidden" name="returnInquiryStatus" value={activeStatus} /> : null}
      {search ? <input type="hidden" name="returnInquirySearch" value={search} /> : null}
      <input type="hidden" name="returnInquiryPage" value={page} />
    </>
  );
}

function InquirySummaryCards({ counts, activeStatus, search }: { counts: InquiryStatusCount[]; activeStatus?: string; search?: string }) {
  const total = counts.reduce((sum, item) => sum + item.count, 0);
  const needsContact = countFor(counts, 'new') + countFor(counts, 'contacted');
  const confirmed = countFor(counts, 'confirmed');
  const closed = countFor(counts, 'fulfilled') + countFor(counts, 'cancelled');
  const cards = [
    { label: 'Total inquiries', value: total, href: filterHref(undefined, search), active: !activeStatus },
    { label: 'Needs attention', value: needsContact, href: filterHref('new', search), active: activeStatus === 'new' || activeStatus === 'contacted' },
    { label: 'Confirmed', value: confirmed, href: filterHref('confirmed', search), active: activeStatus === 'confirmed' },
    { label: 'Closed', value: closed, href: filterHref('fulfilled', search), active: activeStatus === 'fulfilled' || activeStatus === 'cancelled' }
  ];

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.label} href={card.href} className={`rounded-3xl border p-4 transition ${card.active ? 'border-rosewood bg-rosewood text-white shadow-lg shadow-rosewood/10' : 'border-rosewood/10 bg-cream text-rosewood hover:bg-white'}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">{card.label}</p>
          <p className="mt-2 font-display text-4xl">{card.value}</p>
        </Link>
      ))}
    </div>
  );
}

function InquirySearchForm({ activeStatus, search }: { activeStatus?: string; search?: string }) {
  return (
    <form action="/admin" className="mt-5 flex flex-wrap gap-2 rounded-3xl border border-rosewood/10 bg-cream p-3">
      {activeStatus ? <input type="hidden" name="inquiryStatus" value={activeStatus} /> : null}
      <input
        className="min-w-64 flex-1 rounded-full border border-rosewood/15 bg-white px-4 py-2 text-sm text-stone-800 outline-none transition focus:border-rosewood"
        name="inquirySearch"
        placeholder="Search name, phone, email, notes, product..."
        defaultValue={search ?? ''}
      />
      <button className="rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white" type="submit">
        Search
      </button>
      {search ? (
        <Link href={filterHref(activeStatus)} className="rounded-full border border-rosewood/20 bg-white px-5 py-2 text-sm font-semibold text-rosewood">
          Clear
        </Link>
      ) : null}
    </form>
  );
}

function FilterPills({ counts, activeStatus, search }: { counts: InquiryStatusCount[]; activeStatus?: string; search?: string }) {
  const total = counts.reduce((sum, item) => sum + item.count, 0);
  const baseClass = 'rounded-full border px-4 py-2 text-sm font-semibold transition';

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <Link href={filterHref(undefined, search)} className={`${baseClass} ${!activeStatus ? 'border-rosewood bg-rosewood text-white' : 'border-rosewood/20 bg-white text-rosewood'}`}>
        All <span className="ml-1 opacity-75">{total}</span>
      </Link>
      {counts.map((item) => (
        <Link key={item.status} href={filterHref(item.status, search)} className={`${baseClass} ${activeStatus === item.status ? 'border-rosewood bg-rosewood text-white' : statusClass(item.status)}`}>
          {item.status} <span className="ml-1 opacity-75">{item.count}</span>
        </Link>
      ))}
      <div className="ml-auto flex flex-wrap gap-2">
        <Link href={printHref(activeStatus, search)} className="rounded-full border border-rosewood/20 bg-white px-4 py-2 text-sm font-semibold text-rosewood transition hover:bg-cream">
          Print view
        </Link>
        <Link href={exportHref(activeStatus, search)} className="rounded-full border border-olive/30 bg-cream px-4 py-2 text-sm font-semibold text-olive transition hover:bg-white">
          Export CSV
        </Link>
      </div>
    </div>
  );
}

function PaginationControls({ inquiryPage, activeStatus, search }: { inquiryPage: InquiryPage; activeStatus?: string; search?: string }) {
  if (inquiryPage.pageCount <= 1) return null;

  const previousPage = Math.max(1, inquiryPage.page - 1);
  const nextPage = Math.min(inquiryPage.pageCount, inquiryPage.page + 1);
  const firstItem = (inquiryPage.page - 1) * inquiryPage.pageSize + 1;
  const lastItem = Math.min(inquiryPage.total, inquiryPage.page * inquiryPage.pageSize);

  return (
    <nav className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-rosewood/10 bg-white p-4 text-sm text-stone-700">
      <span>
        Showing {firstItem}-{lastItem} of {inquiryPage.total} inquiries · Page {inquiryPage.page} of {inquiryPage.pageCount}
      </span>
      <div className="flex gap-2">
        <Link
          href={pageHref(previousPage, activeStatus, search)}
          aria-disabled={inquiryPage.page <= 1}
          className={`rounded-full border px-4 py-2 font-semibold ${inquiryPage.page <= 1 ? 'pointer-events-none border-stone-200 text-stone-300' : 'border-rosewood/20 text-rosewood'}`}
        >
          Previous
        </Link>
        <Link
          href={pageHref(nextPage, activeStatus, search)}
          aria-disabled={inquiryPage.page >= inquiryPage.pageCount}
          className={`rounded-full border px-4 py-2 font-semibold ${inquiryPage.page >= inquiryPage.pageCount ? 'pointer-events-none border-stone-200 text-stone-300' : 'border-rosewood/20 text-rosewood'}`}
        >
          Next
        </Link>
      </div>
    </nav>
  );
}

export function InquiryBoard({ inquiryPage, counts, activeStatus, search }: { inquiryPage: InquiryPage; counts: InquiryStatusCount[]; activeStatus?: string; search?: string }) {
  const inquiries = inquiryPage.inquiries;

  return (
    <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Customer requests</p>
        <h2 className="mt-2 font-display text-4xl text-rosewood">Inquiry inbox</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Review incoming product requests, update their status, and keep a follow-up timeline.
        </p>
        <InquirySummaryCards counts={counts} activeStatus={activeStatus} search={search} />
        <InquirySearchForm activeStatus={activeStatus} search={search} />
        <FilterPills counts={counts} activeStatus={activeStatus} search={search} />
      </div>

      {inquiries.length === 0 ? (
        <InquiryEmptyState activeStatus={activeStatus} search={search} />
      ) : (
        <>
          <div className="grid gap-4">
            {inquiries.map((inquiry: CustomerInquiry) => (
              <article key={inquiry.id} className="rounded-3xl border border-rosewood/10 bg-cream p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-2xl text-rosewood">{inquiry.productTitle ?? 'General inquiry'}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-rosewood/50">{formatDate(inquiry.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <InquiryDeliveryBadge deliveryDate={inquiry.deliveryDate} />
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusClass(inquiry.status)}`}>
                      {inquiry.status}
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-stone-700 md:grid-cols-4">
                  <p><strong>Name:</strong> {inquiry.name ?? '—'}</p>
                  <p><strong>Phone:</strong> {inquiry.phone ?? '—'}</p>
                  <p><strong>Email:</strong> {inquiry.email ?? '—'}</p>
                  <p><strong>Delivery:</strong> {formatDateOnly(inquiry.deliveryDate)}</p>
                </div>
                <InquiryContactActions inquiry={inquiry} />
                <InquiryFollowUpSummary inquiry={inquiry} />
                <InquiryStatusShortcuts inquiry={inquiry} activeStatus={activeStatus} search={search} page={inquiryPage.page} />
                {inquiry.deliveryNotes ? (
                  <p className="mt-3 text-sm leading-6 text-stone-700"><strong>Delivery notes:</strong> {inquiry.deliveryNotes}</p>
                ) : null}
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-stone-700">{inquiry.message}</p>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <form action={saveInquiryAction.bind(null, inquiry.id)} className="grid gap-3 rounded-2xl border border-rosewood/10 bg-white p-4">
                    <ReturnStateFields activeStatus={activeStatus} search={search} page={inquiryPage.page} />
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

                  <div className="rounded-2xl border border-rosewood/10 bg-white p-4">
                    <h4 className="font-display text-2xl text-rosewood">Follow-up history</h4>
                    <div className="mt-3 grid gap-3">
                      {(inquiry.followUps ?? []).length === 0 ? (
                        <p className="text-sm text-stone-600">No follow-ups recorded yet.</p>
                      ) : (
                        inquiry.followUps?.map((followUp) => (
                          <div key={followUp.id} className={`rounded-2xl border p-3 text-sm ${followUp.channel === 'system' ? 'border-stone-200 bg-stone-50 text-stone-700' : 'border-transparent bg-cream text-stone-700'}`}>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.16em]">
                              <span className={`rounded-full border px-2 py-1 font-semibold ${channelClass(followUp.channel)}`}>{followUp.channel}</span>
                              <span className="text-rosewood/50">{formatDate(followUp.createdAt)}</span>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap leading-6">{followUp.note}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <form action={addInquiryFollowUpAction.bind(null, inquiry.id)} className="mt-4 grid gap-3">
                      <ReturnStateFields activeStatus={activeStatus} search={search} page={inquiryPage.page} />
                      <label className="grid gap-2 text-sm font-semibold text-rosewood">
                        Channel
                        <select className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood" name="channel" defaultValue="internal">
                          {channels.map((channel) => (
                            <option key={channel} value={channel}>{channel}</option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2 text-sm font-semibold text-rosewood">
                        Follow-up note
                        <textarea className="min-h-20 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood" name="note" required minLength={2} />
                      </label>
                      <button className="rounded-full border border-rosewood/20 px-5 py-2 text-sm font-semibold text-rosewood" type="submit">
                        Add follow-up
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <PaginationControls inquiryPage={inquiryPage} activeStatus={activeStatus} search={search} />
        </>
      )}
    </section>
  );
}
