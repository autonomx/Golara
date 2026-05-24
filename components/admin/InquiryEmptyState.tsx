import Link from 'next/link';

export function InquiryEmptyState({ activeStatus, search }: { activeStatus?: string; search?: string }) {
  const hasFilters = Boolean(activeStatus || search);

  return (
    <div className="rounded-3xl border border-rosewood/10 bg-cream p-6 text-sm text-stone-600">
      <p className="font-semibold text-rosewood">
        {hasFilters ? 'No inquiries match this view.' : 'No customer inquiries yet.'}
      </p>
      <p className="mt-2 leading-6">
        {hasFilters
          ? 'Try clearing the search or switching to another status filter.'
          : 'New product inquiries will appear here after customers submit the inquiry form.'}
      </p>
      {hasFilters ? (
        <Link href="/admin" className="mt-4 inline-flex rounded-full border border-rosewood/20 bg-white px-4 py-2 font-semibold text-rosewood">
          Clear inquiry filters
        </Link>
      ) : null}
    </div>
  );
}
