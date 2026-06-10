import { saveInquiryAction } from '@/app/admin/inquiry-actions';
import type { CustomerInquiry } from '@/lib/catalog';
import type { SupportedLocale } from '@/lib/i18n/locales';
import type { InquiryAssignmentQueueFilter } from '@/lib/inquiries/inquiry-assignment-queue';
import { createAdminInquiryBoardTranslator, inquiryStatusShortcutCopyKey } from '@/lib/localization/admin-inquiry-board-copy';

const nextStatusByStatus: Record<string, string[]> = {
  new: ['contacted', 'confirmed', 'cancelled'],
  contacted: ['confirmed', 'cancelled'],
  confirmed: ['fulfilled', 'cancelled'],
  fulfilled: [],
  cancelled: []
};

export function InquiryStatusShortcuts({
  inquiry,
  activeStatus,
  search,
  page,
  assignmentFilter,
  locale
}: {
  inquiry: CustomerInquiry;
  activeStatus?: string;
  search?: string;
  page: number;
  assignmentFilter?: InquiryAssignmentQueueFilter;
  locale?: SupportedLocale | string | null;
}) {
  const nextStatuses = nextStatusByStatus[inquiry.status] ?? [];
  if (nextStatuses.length === 0) return null;

  const t = createAdminInquiryBoardTranslator(locale);

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {nextStatuses.map((status) => (
        <form key={status} action={saveInquiryAction.bind(null, inquiry.id)}>
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="staffNotes" value={inquiry.staffNotes ?? ''} />
          {activeStatus ? <input type="hidden" name="returnInquiryStatus" value={activeStatus} /> : null}
          {search ? <input type="hidden" name="returnInquirySearch" value={search} /> : null}
          {assignmentFilter && assignmentFilter !== 'all' ? <input type="hidden" name="returnInquiryAssignment" value={assignmentFilter} /> : null}
          <input type="hidden" name="returnInquiryPage" value={page} />
          <button className="rounded-full border border-rosewood/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-rosewood transition hover:bg-cream" type="submit">
            {t(inquiryStatusShortcutCopyKey(status))}
          </button>
        </form>
      ))}
    </div>
  );
}
