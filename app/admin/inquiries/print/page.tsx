import Link from 'next/link';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { listInquiries } from '@/lib/cms/catalog-repository';

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

export default async function InquiryPrintPage({ searchParams }: { searchParams: Promise<{ inquiryStatus?: string }> }) {
  const authenticated = await isAdminAuthenticated();
  const { inquiryStatus } = await searchParams;

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-white p-8 text-stone-900">
        <h1 className="text-3xl font-semibold">Admin login required</h1>
        <p className="mt-3">Sign in before printing customer inquiries.</p>
        <Link href="/admin/login" className="mt-6 inline-block rounded-full border px-5 py-2 font-semibold">Sign in</Link>
      </main>
    );
  }

  const inquiries = await listInquiries(inquiryStatus);

  return (
    <main className="bg-white p-8 text-stone-950 print:p-0">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-start justify-between gap-4 print:hidden">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-stone-500">Golara admin</p>
            <h1 className="mt-2 text-4xl font-semibold">Printable inquiry list</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="rounded-full border px-5 py-2 font-semibold">Back to admin</Link>
            <button className="rounded-full bg-stone-950 px-5 py-2 font-semibold text-white" onClick={undefined}>Use browser print</button>
          </div>
        </div>

        <div className="mb-6 border-b pb-4">
          <h2 className="text-2xl font-semibold">Golara inquiries</h2>
          <p className="mt-1 text-sm text-stone-600">Filter: {inquiryStatus ?? 'all'} · Count: {inquiries.length}</p>
        </div>

        <div className="grid gap-5">
          {inquiries.map((inquiry) => (
            <article key={inquiry.id} className="break-inside-avoid rounded-2xl border p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
                <div>
                  <h3 className="text-2xl font-semibold">{inquiry.productTitle ?? 'General inquiry'}</h3>
                  <p className="mt-1 text-sm text-stone-600">Created: {formatDate(inquiry.createdAt)}</p>
                </div>
                <span className="rounded-full border px-3 py-1 text-sm font-semibold uppercase">{inquiry.status}</span>
              </div>
              <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                <p><strong>Name:</strong> {inquiry.name ?? '—'}</p>
                <p><strong>Phone:</strong> {inquiry.phone ?? '—'}</p>
                <p><strong>Email:</strong> {inquiry.email ?? '—'}</p>
                <p><strong>Delivery:</strong> {formatDateOnly(inquiry.deliveryDate)}</p>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold">Customer message</h4>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{inquiry.message}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Delivery / staff notes</h4>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{inquiry.deliveryNotes || 'No delivery notes.'}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{inquiry.staffNotes || 'No staff notes.'}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
