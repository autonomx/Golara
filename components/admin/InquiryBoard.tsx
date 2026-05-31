import Link from 'next/link';
import { addInquiryFollowUpAction, saveInquiryAction } from '@/app/admin/inquiry-actions';
import { InquiryContactActions } from '@/components/admin/InquiryContactActions';
import { InquiryDeliveryBadge } from '@/components/admin/InquiryDeliveryBadge';
import { InquiryEmptyState } from '@/components/admin/InquiryEmptyState';
import { InquiryFollowUpSummary } from '@/components/admin/InquiryFollowUpSummary';
import { InquiryStatusShortcuts } from '@/components/admin/InquiryStatusShortcuts';
import type { CustomerInquiry } from '@/lib/catalog';
import type { InquiryPage, InquiryStatusCount } from '@/lib/cms/catalog-repository';
import type { InquiryAssignmentQueueFilter, InquiryAssignmentQueueSummary } from '@/lib/inquiries/inquiry-assignment-queue';
import { getInquiryWorkflowStep, getInquiryWorkflowSummary } from '@/lib/inquiries/inquiry-workflow';

const statuses = ['new', 'contacted', 'confirmed', 'fulfilled', 'cancelled'];
const channels = ['internal', 'phone', 'email', 'whatsapp'];
const assignmentFilters = [
  { label: 'Mine', value: 'mine' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'Unassigned', value: 'unassigned' }
] as const;

type AssignmentFilterValue = (typeof assignmentFilters)[number]['value'];

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

const inputClass = 'rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20';
const searchInputClass = 'min-w-64 flex-1 rounded-full border border-rosewood/15 bg-white px-4 py-2 text-sm text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20';
const textAreaClass = 'rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20';
const primaryButtonClass = 'rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30';
const secondaryLinkClass = 'rounded-full border border-rosewood/20 bg-white px-5 py-2 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20';
const filterLinkBaseClass = 'rounded-full border px-4 py-2 text-sm font-semibold outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20';

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

function queryAssignmentValue(assignmentFilter?: InquiryAssignmentQueueFilter): AssignmentFilterValue | undefined {
  return assignmentFilter === 'mine' || assignmentFilter === 'assigned' || assignmentFilter === 'unassigned' ? assignmentFilter : undefined;
}

function adminParams(status?: string, search?: string, page?: number, assignmentFilter?: InquiryAssignmentQueueFilter) {
  const params = new URLSearchParams();
  if (status) params.set('inquiryStatus', status);
  if (search) params.set('inquirySearch', search);
  if (page && page > 1) params.set('inquiryPage', String(page));
  const assignment = queryAssignmentValue(assignmentFilter);
  if (assignment) params.set('inquiryAssignment', assignment);
  const query = params.toString();
  return query ? `/admin?${query}` : '/admin';
}

function inquiryToolHref(path: string, status?: string, search?: string, assignment?: AssignmentFilterValue) {
  const params = new URLSearchParams();
  if (status) params.set('inquiryStatus', status);
  if (search) params.set('inquirySearch', search);
  if (assignment) params.set('inquiryAssignment', assignment);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function filterHref(status?: string, search?: string, assignmentFilter?: InquiryAssignmentQueueFilter) {
  return adminParams(status, search, undefined, assignmentFilter);
}

function pageHref(page: number, status?: string, search?: string, assignmentFilter?: InquiryAssignmentQueueFilter) {
  return adminParams(status, search, page, assignmentFilter);
}

function exportHref(status?: string, search?: string, assignment?: AssignmentFilterValue) {
  return inquiryToolHref('/admin/inquiries/export', status, search, assignment);
}

function printHref(status?: string, search?: string, assignment?: AssignmentFilterValue) {
  return inquiryToolHref('/admin/inquiries/print', status, search, assignment);
}

function ReturnStateFields({ activeStatus, search, page, assignmentFilter }: { activeStatus?: string; search?: string; page: number; assignmentFilter?: InquiryAssignmentQueueFilter }) {
  return (
    <>
      {activeStatus ? <input type="hidden" name="returnInquiryStatus" value={activeStatus} /> : null}
      {search ? <input type="hidden" name="returnInquirySearch" value={search} /> : null}
      {assignmentFilter && assignmentFilter !== 'all' ? <input type="hidden" name="returnInquiryAssignment" value={assignmentFilter} /> : null}
      <input type="hidden" name="returnInquiryPage" value={page} />
    </>
  );
}

function InquirySummaryCards({ counts, activeStatus, search, assignmentFilter }: { counts: InquiryStatusCount[]; activeStatus?: string; search?: string; assignmentFilter?: InquiryAssignmentQueueFilter }) {
  const total = counts.reduce((sum, item) => sum + item.count, 0);
  const workflowSummary = getInquiryWorkflowSummary(counts);
  const cards = [
    { label: 'Total inquiries', value: total, href: filterHref(undefined, search, assignmentFilter), active: !activeStatus },
    { label: 'Needs first review', value: workflowSummary.needsFirstReview, href: filterHref('new', search, assignmentFilter), active: activeStatus === 'new' },
    { label: 'Ready to fulfill', value: workflowSummary.readyToFulfill, href: filterHref('confirmed', search, assignmentFilter), active: activeStatus === 'confirmed' },
    { label: 'Closed', value: workflowSummary.closed, href: filterHref('fulfilled', search, assignmentFilter), active: activeStatus === 'fulfilled' || activeStatus === 'cancelled' }
  ];

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.label} href={card.href} className={`rounded-3xl border p-4 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20 ${card.active ? 'border-rosewood bg-rosewood text-white shadow-lg shadow-rosewood/10' : 'border-rosewood/10 bg-cream text-rosewood hover:bg-white'}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">{card.label}</p>
          <p className="mt-2 font-display text-4xl">{card.value}</p>
        </Link>
      ))}
    </div>
  );
}

function InquiryWorkflowOverview({ counts }: { counts: InquiryStatusCount[] }) {
  const summary = getInquiryWorkflowSummary(counts);
  const items = [
    { label: 'Active pipeline', value: summary.active },
    { label: 'Waiting on customer', value: summary.waitingOnCustomer },
    { label: 'Ready to fulfill', value: summary.readyToFulfill }
  ];

  return (
    <div className="mt-4 grid gap-3 rounded-3xl border border-olive/20 bg-cream p-4 text-sm text-stone-700 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive">{item.label}</p>
          <p className="mt-1 font-display text-3xl text-rosewood">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function InquirySearchForm({ activeStatus, search, assignmentFilter }: { activeStatus?: string; search?: string; assignmentFilter?: InquiryAssignmentQueueFilter }) {
  return (
    <form action="/admin" className="mt-5 flex flex-wrap gap-2 rounded-3xl border border-rosewood/10 bg-cream p-3">
      {activeStatus ? <input type="hidden" name="inquiryStatus" value={activeStatus} /> : null}
      {assignmentFilter && assignmentFilter !== 'all' ? <input type="hidden" name="inquiryAssignment" value={assignmentFilter} /> : null}
      <input
        className={searchInputClass}
        name="inquirySearch"
        placeholder="Search name, phone, email, notes, product..."
        defaultValue={search ?? ''}
      />
      <button className={primaryButtonClass} type="submit">
        Search
      </button>
      {search ? (
        <Link href={filterHref(activeStatus, undefined, assignmentFilter)} className={secondaryLinkClass}>
          Clear
        </Link>
      ) : null}
    </form>
  );
}

function AssignmentFilterPills({ activeStatus, search, assignmentFilter, assignmentSummary }: { activeStatus?: string; search?: string; assignmentFilter?: InquiryAssignmentQueueFilter; assignmentSummary: InquiryAssignmentQueueSummary }) {
  const counts: Record<InquiryAssignmentQueueFilter, number> = {
    all: assignmentSummary.total,
    mine: assignmentSummary.mine,
    assigned: assignmentSummary.assigned,
    unassigned: assignmentSummary.unassigned
  };
  const filters: Array<{ label: string; value: InquiryAssignmentQueueFilter }> = [
    { label: 'All owners', value: 'all' },
    { label: 'Mine', value: 'mine' },
    { label: 'Assigned', value: 'assigned' },
    { label: 'Unassigned', value: 'unassigned' }
  ];

  return (
    <div className="mt-3 rounded-3xl border border-rosewood/10 bg-white p-3 text-sm text-stone-700">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive">Assignment filter</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = (assignmentFilter ?? 'all') === filter.value;
          return (
            <Link key={filter.value} href={filterHref(activeStatus, search, filter.value)} className={`${filterLinkBaseClass} ${active ? 'border-rosewood bg-rosewood text-white' : 'border-rosewood/20 bg-cream text-rosewood hover:bg-white'}`}>
              {filter.label} <span className="ml-1 opacity-75">{counts[filter.value]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function AssignmentExportShortcuts({ activeStatus, search }: { activeStatus?: string; search?: string }) {
  return (
    <div className="mt-3 rounded-3xl border border-rosewood/10 bg-white p-3 text-sm text-stone-700">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive">Assignment exports</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {assignmentFilters.map((assignment) => (
          <div key={assignment.value} className="flex flex-wrap gap-2 rounded-2xl border border-rosewood/10 bg-cream p-2">
            <span className="px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rosewood">{assignment.label}</span>
            <Link href={printHref(activeStatus, search, assignment.value)} className="rounded-full border border-rosewood/20 bg-white px-3 py-1 text-xs font-semibold text-rosewood outline-none transition hover:bg-cream focus-visible:ring-4 focus-visible:ring-olive/20">
              Print
            </Link>
            <Link href={exportHref(activeStatus, search, assignment.value)} className="rounded-full border border-olive/30 bg-white px-3 py-1 text-xs font-semibold text-olive outline-none transition hover:bg-cream focus-visible:ring-4 focus-visible:ring-olive/20">
              CSV
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterPills({ counts, activeStatus, search, assignmentFilter }: { counts: InquiryStatusCount[]; activeStatus?: string; search?: string; assignmentFilter?: InquiryAssignmentQueueFilter }) {
  const total = counts.reduce((sum, item) => sum + item.count, 0);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link href={filterHref(undefined, search, assignmentFilter)} className={`${filterLinkBaseClass} ${!activeStatus ? 'border-rosewood bg-rosewood text-white' : 'border-rosewood/20 bg-white text-rosewood'}`}>
          All <span className="ml-1 opacity-75">{total}</span>
        </Link>
        {counts.map((item) => (
          <Link key={item.status} href={filterHref(item.status, search, assignmentFilter)} className={`${filterLinkBaseClass} ${activeStatus === item.status ? 'border-rosewood bg-rosewood text-white' : statusClass(item.status)}`}>
            {item.status} <span className="ml-1 opacity-75">{item.count}</span>
          </Link>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          <Link href={printHref(activeStatus, search)} className="rounded-full border border-rosewood/20 bg-white px-4 py-2 text-sm font-semibold text-rosewood outline-none transition hover:bg-cream focus-visible:ring-4 focus-visible:ring-olive/20">
            Print view
          </Link>
          <Link href={exportHref(activeStatus, search)} className="rounded-full border border-olive/30 bg-cream px-4 py-2 text-sm font-semibold text-olive outline-none transition hover:bg-white focus-visible:ring-4 focus-visible:ring-olive/20">
            Export CSV
          </Link>
        </div>
      </div>
      <AssignmentExportShortcuts activeStatus={activeStatus} search={search} />
    </>
  );
}

function PaginationControls({ inquiryPage, activeStatus, search, assignmentFilter }: { inquiryPage: InquiryPage; activeStatus?: string; search?: string; assignmentFilter?: InquiryAssignmentQueueFilter }) {
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
          href={pageHref(previousPage, activeStatus, search, assignmentFilter)}
          aria-disabled={inquiryPage.page <= 1}
          className={`rounded-full border px-4 py-2 font-semibold outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20 ${inquiryPage.page <= 1 ? 'pointer-events-none border-stone-200 text-stone-300' : 'border-rosewood/20 text-rosewood'}`}
        >
          Previous
        </Link>
        <Link
          href={pageHref(nextPage, activeStatus, search, assignmentFilter)}
          aria-disabled={inquiryPage.page >= inquiryPage.pageCount}
          className={`rounded-full border px-4 py-2 font-semibold outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20 ${inquiryPage.page >= inquiryPage.pageCount ? 'pointer-events-none border-stone-200 text-stone-300' : 'border-rosewood/20 text-rosewood'}`}
        >
          Next
        </Link>
      </div>
    </nav>
  );
}

export function InquiryBoard({ inquiryPage, counts, assignmentSummary, activeStatus, search, assignmentFilter }: { inquiryPage: InquiryPage; counts: InquiryStatusCount[]; assignmentSummary: InquiryAssignmentQueueSummary; activeStatus?: string; search?: string; assignmentFilter?: InquiryAssignmentQueueFilter }) {
  const inquiries = inquiryPage.inquiries;

  return (
    <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Customer requests</p>
        <h2 className="mt-2 font-display text-4xl text-rosewood">Inquiry inbox</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Review incoming product requests, update their status, and keep a follow-up timeline.
        </p>
        <InquirySummaryCards counts={counts} activeStatus={activeStatus} search={search} assignmentFilter={assignmentFilter} />
        <InquiryWorkflowOverview counts={counts} />
        <InquirySearchForm activeStatus={activeStatus} search={search} assignmentFilter={assignmentFilter} />
        <AssignmentFilterPills activeStatus={activeStatus} search={search} assignmentFilter={assignmentFilter} assignmentSummary={assignmentSummary} />
        <FilterPills counts={counts} activeStatus={activeStatus} search={search} assignmentFilter={assignmentFilter} />
      </div>

      {inquiries.length === 0 ? (
        <InquiryEmptyState activeStatus={activeStatus} search={search} />
      ) : (
        <>
          <div className="grid gap-4">
            {inquiries.map((inquiry: CustomerInquiry) => {
              const workflowStep = getInquiryWorkflowStep(inquiry.status);

              return (
                <article key={inquiry.id} className="rounded-3xl border border-rosewood/10 bg-cream p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-2xl text-rosewood">{inquiry.productTitle ?? 'General inquiry'}</h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-rosewood/50">{formatDate(inquiry.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <InquiryDeliveryBadge deliveryDate={inquiry.deliveryDate} />
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusClass(inquiry.status)}`}>
                        {workflowStep.label}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-olive/20 bg-white p-4 text-sm text-stone-700">
                    <p className="font-semibold text-rosewood">Recommended next action</p>
                    <p className="mt-1 leading-6">{workflowStep.recommendedAction}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-olive">{workflowStep.description}</p>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-stone-700 md:grid-cols-4">
                    <p><strong>Name:</strong> {inquiry.name ?? '—'}</p>
                    <p><strong>Phone:</strong> {inquiry.phone ?? '—'}</p>
                    <p><strong>Email:</strong> {inquiry.email ?? '—'}</p>
                    <p><strong>Delivery:</strong> {formatDateOnly(inquiry.deliveryDate)}</p>
                  </div>
                  <InquiryContactActions inquiry={inquiry} />
                  <InquiryFollowUpSummary inquiry={inquiry} />
                  <InquiryStatusShortcuts inquiry={inquiry} activeStatus={activeStatus} search={search} page={inquiryPage.page} assignmentFilter={assignmentFilter} />
                  {inquiry.deliveryNotes ? (
                    <p className="mt-3 text-sm leading-6 text-stone-700"><strong>Delivery notes:</strong> {inquiry.deliveryNotes}</p>
                  ) : null}
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-stone-700">{inquiry.message}</p>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <form action={saveInquiryAction.bind(null, inquiry.id)} className="grid gap-3 rounded-2xl border border-rosewood/10 bg-white p-4">
                      <ReturnStateFields activeStatus={activeStatus} search={search} page={inquiryPage.page} assignmentFilter={assignmentFilter} />
                      <label className="grid gap-2 text-sm font-semibold text-rosewood">
                        Status
                        <select className={inputClass} name="status" defaultValue={inquiry.status}>
                          {statuses.map((status) => (
                            <option key={status} value={status}>{getInquiryWorkflowStep(status).label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2 text-sm font-semibold text-rosewood">
                        Staff notes
                        <textarea className={`min-h-24 ${textAreaClass}`} name="staffNotes" defaultValue={inquiry.staffNotes ?? ''} />
                      </label>
                      <button className={`${primaryButtonClass} shadow-lg shadow-rosewood/20`} type="submit">
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
                        <ReturnStateFields activeStatus={activeStatus} search={search} page={inquiryPage.page} assignmentFilter={assignmentFilter} />
                        <label className="grid gap-2 text-sm font-semibold text-rosewood">
                          Channel
                          <select className={inputClass} name="channel" defaultValue="internal">
                            {channels.map((channel) => (
                              <option key={channel} value={channel}>{channel}</option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-rosewood">
                          Follow-up note
                          <textarea className={`min-h-20 ${textAreaClass}`} name="note" required minLength={2} />
                        </label>
                        <button className="rounded-full border border-rosewood/20 px-5 py-2 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20" type="submit">
                          Add follow-up
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <PaginationControls inquiryPage={inquiryPage} activeStatus={activeStatus} search={search} assignmentFilter={assignmentFilter} />
        </>
      )}
    </section>
  );
}
