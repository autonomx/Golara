import Link from 'next/link';
import type { InquiryAssignmentQueueFilter } from '@/lib/inquiries/inquiry-assignment-queue';

function adminHref(status?: string, search?: string, assignmentFilter?: InquiryAssignmentQueueFilter) {
  const params = new URLSearchParams();
  if (status) params.set('inquiryStatus', status);
  if (search) params.set('inquirySearch', search);
  if (assignmentFilter && assignmentFilter !== 'all') params.set('inquiryAssignment', assignmentFilter);
  const query = params.toString();
  return query ? `/admin?${query}` : '/admin';
}

function assignmentLabel(assignmentFilter?: InquiryAssignmentQueueFilter) {
  if (assignmentFilter === 'mine') return 'assigned to you';
  if (assignmentFilter === 'assigned') return 'assigned to another owner';
  if (assignmentFilter === 'unassigned') return 'without an owner';
  return undefined;
}

export function InquiryEmptyState({ activeStatus, search, assignmentFilter }: { activeStatus?: string; search?: string; assignmentFilter?: InquiryAssignmentQueueFilter }) {
  const assignment = assignmentLabel(assignmentFilter);
  const hasAssignmentFilter = Boolean(assignment);
  const hasFilters = Boolean(activeStatus || search || hasAssignmentFilter);

  return (
    <div className="rounded-3xl border border-rosewood/10 bg-cream p-6 text-sm text-stone-600">
      <p className="font-semibold text-rosewood">
        {hasFilters ? 'No inquiries match this view.' : 'No customer inquiries yet.'}
      </p>
      <p className="mt-2 leading-6">
        {hasAssignmentFilter
          ? `No matching inquiries are currently ${assignment}. Try another assignment filter, status, or search.`
          : hasFilters
            ? 'Try clearing the search or switching to another status filter.'
            : 'New product inquiries will appear here after customers submit the inquiry form.'}
      </p>
      {hasFilters ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {hasAssignmentFilter ? (
            <Link href={adminHref(activeStatus, search)} className="inline-flex rounded-full border border-olive/30 bg-white px-4 py-2 font-semibold text-olive">
              Clear assignment filter
            </Link>
          ) : null}
          <Link href="/admin" className="inline-flex rounded-full border border-rosewood/20 bg-white px-4 py-2 font-semibold text-rosewood">
            Clear all inquiry filters
          </Link>
        </div>
      ) : null}
    </div>
  );
}
