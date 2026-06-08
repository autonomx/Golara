import Link from 'next/link';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import type { SupportedLocale } from '@/lib/i18n/locales';
import type { InquiryAssignmentQueueFilter } from '@/lib/inquiries/inquiry-assignment-queue';

type AdminLocale = 'en' | 'fa';
type InquiryEmptyStateCopy = {
  assignedToYou: string;
  assignedToAnotherOwner: string;
  withoutOwner: string;
  noMatches: string;
  noInquiries: string;
  noMatchingAssignment: (assignment: string) => string;
  tryFilters: string;
  newInquiries: string;
  clearAssignment: string;
  clearAll: string;
};

const copy: Record<AdminLocale, InquiryEmptyStateCopy> = {
  en: {
    assignedToYou: 'assigned to you',
    assignedToAnotherOwner: 'assigned to another owner',
    withoutOwner: 'without an owner',
    noMatches: 'No inquiries match this view.',
    noInquiries: 'No customer inquiries yet.',
    noMatchingAssignment: (assignment: string) => `No matching inquiries are currently ${assignment}. Try another assignment filter, status, or search.`,
    tryFilters: 'Try clearing the search or switching to another status filter.',
    newInquiries: 'New product inquiries will appear here after customers submit the inquiry form.',
    clearAssignment: 'Clear assignment filter',
    clearAll: 'Clear all inquiry filters'
  },
  fa: {
    assignedToYou: 'اختصاص‌یافته به شما',
    assignedToAnotherOwner: 'اختصاص‌یافته به مالک دیگر',
    withoutOwner: 'بدون مالک',
    noMatches: 'هیچ درخواستی با این نما مطابق نیست.',
    noInquiries: 'هنوز هیچ درخواست مشتری ثبت نشده است.',
    noMatchingAssignment: (assignment: string) => `در حال حاضر هیچ درخواست مطابقی ${assignment} نیست. فیلتر مالک، وضعیت یا جستجو را تغییر دهید.`,
    tryFilters: 'جستجو را پاک کنید یا وضعیت دیگری را انتخاب کنید.',
    newInquiries: 'درخواست‌های جدید محصول پس از ارسال فرم توسط مشتریان اینجا نمایش داده می‌شوند.',
    clearAssignment: 'پاک کردن فیلتر مالک',
    clearAll: 'پاک کردن همه فیلترهای درخواست'
  }
};

function localeKey(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function adminHref(status?: string, search?: string, assignmentFilter?: InquiryAssignmentQueueFilter) {
  const params = new URLSearchParams();
  if (status) params.set('inquiryStatus', status);
  if (search) params.set('inquirySearch', search);
  if (assignmentFilter && assignmentFilter !== 'all') params.set('inquiryAssignment', assignmentFilter);
  const query = params.toString();
  return query ? `/admin?${query}` : '/admin';
}

function assignmentLabel(assignmentFilter: InquiryAssignmentQueueFilter | undefined, labels: InquiryEmptyStateCopy) {
  if (assignmentFilter === 'mine') return labels.assignedToYou;
  if (assignmentFilter === 'assigned') return labels.assignedToAnotherOwner;
  if (assignmentFilter === 'unassigned') return labels.withoutOwner;
  return undefined;
}

export async function InquiryEmptyState({ activeStatus, search, assignmentFilter, locale }: { activeStatus?: string; search?: string; assignmentFilter?: InquiryAssignmentQueueFilter; locale?: SupportedLocale | string | null }) {
  const activeLocale = locale ?? await resolveStorefrontLocale();
  const labels = copy[localeKey(activeLocale)];
  const assignment = assignmentLabel(assignmentFilter, labels);
  const hasAssignmentFilter = Boolean(assignment);
  const hasFilters = Boolean(activeStatus || search || hasAssignmentFilter);

  return (
    <div className="rounded-3xl border border-rosewood/10 bg-cream p-6 text-sm text-stone-600">
      <p className="font-semibold text-rosewood">
        {hasFilters ? labels.noMatches : labels.noInquiries}
      </p>
      <p className="mt-2 leading-6">
        {hasAssignmentFilter && assignment
          ? labels.noMatchingAssignment(assignment)
          : hasFilters
            ? labels.tryFilters
            : labels.newInquiries}
      </p>
      {hasFilters ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {hasAssignmentFilter ? (
            <Link href={adminHref(activeStatus, search)} className="inline-flex rounded-full border border-olive/30 bg-white px-4 py-2 font-semibold text-olive">
              {labels.clearAssignment}
            </Link>
          ) : null}
          <Link href="/admin" className="inline-flex rounded-full border border-rosewood/20 bg-white px-4 py-2 font-semibold text-rosewood">
            {labels.clearAll}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
