import type { CustomerInquiry } from '@/lib/catalog';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

export function InquiryFollowUpSummary({ inquiry }: { inquiry: CustomerInquiry }) {
  const followUps = inquiry.followUps ?? [];
  const latest = followUps[0];

  return (
    <div className="mt-4 rounded-2xl border border-rosewood/10 bg-white p-3 text-sm text-stone-700">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-rosewood">Follow-ups: {followUps.length}</span>
        {latest ? <span className="text-xs uppercase tracking-[0.16em] text-rosewood/50">Latest {formatDate(latest.createdAt)}</span> : null}
      </div>
      {latest ? <p className="mt-2 line-clamp-2 leading-6">{latest.note}</p> : <p className="mt-2 leading-6 text-stone-500">No follow-up activity yet.</p>}
    </div>
  );
}
