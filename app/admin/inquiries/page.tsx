import Link from 'next/link';
import { AdminConsolePage } from '@/app/admin/AdminConsolePage';
import { requireAdminRouteSession } from '@/lib/admin-page-auth-boundary';
import { listInquiryPage } from '@/lib/cms/catalog-repository';
import type { CustomerInquiry } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

type AdminInquiriesSearchParams = { [key: string]: string | undefined };

type InquiryStage = {
  key: string;
  label: string;
  href: string;
  match: (inquiry: CustomerInquiry) => boolean;
};

const inquiryStages: InquiryStage[] = [
  { key: 'new', label: 'New', href: '/admin/inquiries?inquiryStatus=new', match: (inquiry) => inquiry.status === 'new' },
  { key: 'contacted', label: 'Contacted', href: '/admin/inquiries?inquiryStatus=contacted', match: (inquiry) => inquiry.status === 'contacted' },
  { key: 'waiting', label: 'Waiting on customer', href: '/admin/inquiries?inquiryStatus=contacted', match: (inquiry) => inquiry.status === 'contacted' && Boolean(inquiry.followUps?.length) },
  { key: 'confirmed', label: 'Confirmed', href: '/admin/inquiries?inquiryStatus=confirmed', match: (inquiry) => inquiry.status === 'confirmed' },
  { key: 'fulfilled', label: 'Fulfilled', href: '/admin/inquiries?inquiryStatus=fulfilled', match: (inquiry) => inquiry.status === 'fulfilled' },
  { key: 'cancelled', label: 'Cancelled', href: '/admin/inquiries?inquiryStatus=cancelled', match: (inquiry) => inquiry.status === 'cancelled' }
];

function formatDate(date?: Date) {
  if (!date) return 'No date set';
  return new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function nextInquiryAction(inquiry: CustomerInquiry) {
  if (inquiry.status === 'new') return 'First response';
  if (inquiry.status === 'contacted') return inquiry.followUps?.length ? 'Wait for reply' : 'Log follow-up';
  if (inquiry.status === 'confirmed') return 'Create order';
  if (inquiry.status === 'fulfilled') return 'Review history';
  if (inquiry.status === 'cancelled') return 'Archive';
  return 'Review inquiry';
}

function InquiryPipelinePanel({ inquiries }: { inquiries: CustomerInquiry[] }) {
  const focusInquiries = inquiries.filter((inquiry) => !['fulfilled', 'cancelled'].includes(inquiry.status)).slice(0, 6);

  return (
    <section className="admin-shell-prelude bg-cream px-4 pt-4 sm:px-6 lg:px-8" aria-labelledby="inquiry-pipeline-title">
      <div className="mx-auto grid max-w-7xl gap-4 rounded-xl border border-rosewood/10 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rosewood/60">Inquiry pipeline</p>
            <h2 id="inquiry-pipeline-title" className="mt-1 text-xl font-semibold text-stone-900">Customer requests by stage</h2>
            <p className="mt-1 max-w-3xl text-sm text-stone-600">Work requests by conversation stage before using the full inquiry board below for assignment, notes, filters, and exports.</p>
          </div>
          <Link href="/admin/inquiries/print" className="rounded-full bg-rosewood px-4 py-2 text-sm font-semibold text-white">Print inquiries</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {inquiryStages.map((stage) => (
            <Link key={stage.key} href={stage.href} className="rounded-full border border-rosewood/15 px-3 py-2 text-sm font-semibold text-rosewood hover:border-rosewood">
              {stage.label}: {inquiries.filter(stage.match).length}
            </Link>
          ))}
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {focusInquiries.length === 0 ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 md:col-span-2 xl:col-span-3">No active inquiry follow-up is waiting in the current pipeline sample.</p>
          ) : focusInquiries.map((inquiry) => (
            <Link key={inquiry.id} href={`/admin/inquiries?inquiryStatus=${encodeURIComponent(inquiry.status)}`} className="rounded-lg border border-stone-200 p-3 text-sm hover:border-rosewood/40">
              <span className="flex items-center justify-between gap-3">
                <span className="font-semibold text-stone-900">{inquiry.name || inquiry.phone || inquiry.email || 'Customer inquiry'}</span>
                <span className="rounded-full bg-rosewood/10 px-2 py-1 text-xs font-semibold text-rosewood">{nextInquiryAction(inquiry)}</span>
              </span>
              <span className="mt-2 block text-xs text-stone-500">{inquiry.productTitle || 'Custom request'} · {formatDate(inquiry.deliveryDate)}</span>
              <span className="mt-1 block text-xs text-stone-500">Assigned to {inquiry.assignee?.label || inquiry.assignee?.email || 'Unassigned'}</span>
              {inquiry.followUps?.[0]?.note ? <span className="mt-2 block line-clamp-2 text-xs text-stone-600">Last follow-up: {inquiry.followUps[0].note}</span> : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function AdminInquiriesPage({ searchParams }: { searchParams: Promise<AdminInquiriesSearchParams> }) {
  await requireAdminRouteSession();
  const resolvedSearchParams = await searchParams;
  const inquiryPage = await listInquiryPage(undefined, 1, 50, resolvedSearchParams.inquirySearch);

  return (
    <>
      <InquiryPipelinePanel inquiries={inquiryPage.inquiries} />
      <AdminConsolePage searchParams={Promise.resolve(resolvedSearchParams)} forcedTab="sales" salesSection="inquiries" activeNavKey="inquiries" />
    </>
  );
}
