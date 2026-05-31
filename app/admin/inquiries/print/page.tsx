import Link from 'next/link';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { listInquiries } from '@/lib/cms/catalog-repository';
import { createInquiryReportRows, createInquiryReportSummary } from '@/lib/inquiries/inquiry-reporting';

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

export default async function InquiryPrintPage({ searchParams }: { searchParams: Promise<{ inquiryStatus?: string; inquirySearch?: string }> }) {
  const authenticated = await isAdminAuthenticated();
  const { inquiryStatus, inquirySearch } = await searchParams;

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-white p-8 text-stone-900">
        <h1 className="text-3xl font-semibold">Admin login required</h1>
        <p className="mt-3">Sign in before printing customer inquiries.</p>
        <Link href="/admin/login" className="mt-6 inline-block rounded-full border px-5 py-2 font-semibold">Sign in</Link>
      </main>
    );
  }

  const inquiries = await listInquiries(inquiryStatus, inquirySearch);
  const reportRows = createInquiryReportRows(inquiries);
  const summary = createInquiryReportSummary(inquiries);

  return (
    <main className="bg-white p-8 text-stone-950 print:p-0">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-start justify-between gap-4 print:hidden">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-stone-500">Golara admin</p>
            <h1 className="mt-2 text-4xl font-semibold">Printable inquiry list</h1>
            <p className="mt-2 text-sm text-stone-600">Use your browser print command to print or save this page as PDF.</p>
          </div>
          <Link href="/admin" className="rounded-full border px-5 py-2 font-semibold">Back to admin</Link>
        </div>

        <div className="mb-6 border-b pb-4">
          <h2 className="text-2xl font-semibold">Golara inquiries</h2>
          <p className="mt-1 text-sm text-stone-600">Filter: {inquiryStatus ?? 'all'} · Search: {inquirySearch || 'none'} · Count: {reportRows.length}</p>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <p><strong>Needs first review:</strong> {summary.needsFirstReview}</p>
            <p><strong>Waiting on customer:</strong> {summary.waitingOnCustomer}</p>
            <p><strong>Ready to fulfill:</strong> {summary.readyToFulfill}</p>
            <p><strong>Assigned:</strong> {summary.assigned}</p>
            <p><strong>Unassigned:</strong> {summary.unassigned}</p>
            <p><strong>With follow-ups:</strong> {summary.withFollowUps}</p>
            <p><strong>Without follow-ups:</strong> {summary.withoutFollowUps}</p>
            <p><strong>Total:</strong> {summary.total}</p>
          </div>
        </div>

        <div className="grid gap-5">
          {reportRows.map((row) => (
            <article key={`${row.createdAt.toISOString()}-${row.phone}-${row.email}`} className="break-inside-avoid rounded-2xl border p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
                <div>
                  <h3 className="text-2xl font-semibold">{row.productTitle}</h3>
                  <p className="mt-1 text-sm text-stone-600">Created: {formatDate(row.createdAt)}</p>
                </div>
                <span className="rounded-full border px-3 py-1 text-sm font-semibold uppercase">{row.statusLabel}</span>
              </div>
              <div className="mt-4 rounded-xl border bg-stone-50 p-3 text-sm">
                <h4 className="font-semibold">Recommended next action</h4>
                <p className="mt-1 leading-6">{row.recommendedAction}</p>
              </div>
              <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                <p><strong>Name:</strong> {row.customerName || '—'}</p>
                <p><strong>Phone:</strong> {row.phone || '—'}</p>
                <p><strong>Email:</strong> {row.email || '—'}</p>
                <p><strong>Delivery:</strong> {formatDateOnly(row.deliveryDate)}</p>
                <p><strong>Assignee:</strong> {row.assigneeLabel}</p>
                <p><strong>Assigned at:</strong> {row.assignedAt ? formatDate(row.assignedAt) : '—'}</p>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold">Customer message</h4>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{row.message}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Delivery / staff notes</h4>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{row.deliveryNotes || 'No delivery notes.'}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{row.staffNotes || 'No staff notes.'}</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border p-3 text-sm">
                <h4 className="font-semibold">Latest follow-up</h4>
                {row.latestFollowUpAt ? (
                  <p className="mt-2 leading-6">
                    <strong>{row.latestFollowUpChannel}</strong> · {formatDate(row.latestFollowUpAt)} · {row.latestFollowUpNote}
                  </p>
                ) : (
                  <p className="mt-2 leading-6">No follow-ups recorded.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
