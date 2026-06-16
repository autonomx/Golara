import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { assertCodCollectionStatus, updateCodCollectionStatus } from '@/lib/checkout/cod-collection-service';
import { COD_COLLECTION_STATUSES } from '@/lib/checkout/payment-method-checkout-selection';
import { hasDatabase, prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const inputClass = 'rounded-2xl border border-rosewood/15 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-rosewood';

function stringFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function metadataRecord(value: unknown): Record<string, string | number | boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const entries = Object.entries(value).filter((entry): entry is [string, string | number | boolean] => {
    const item = entry[1];
    return typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean';
  });
  return Object.fromEntries(entries);
}

function isCodMetadata(metadata: Record<string, string | number | boolean>) {
  return metadata.codPaymentSelected === true || metadata.codRequiresDeliveryCollection === true || metadata.paymentMethodType === 'cod';
}

function textMetadata(value: string | number | boolean | undefined) {
  if (value === undefined || value === '') return undefined;
  return String(value);
}

function statusBanner(status?: string) {
  if (status === 'cod-collection-updated') return 'COD collection status updated.';
  if (status === 'cod-collection-invalid') return 'COD collection status was invalid.';
  if (status === 'cod-collection-not-found') return 'COD payment attempt was not found.';
  if (status === 'cod-collection-not-cod') return 'Only COD payment attempts can be updated here.';
  return undefined;
}

function collectionTone(status: string) {
  if (status === 'collected') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (status === 'failed') return 'border-red-200 bg-red-50 text-red-800';
  if (status === 'waived') return 'border-amber-200 bg-amber-50 text-amber-900';
  return 'border-sky-200 bg-sky-50 text-sky-900';
}

function collectionFailureStatus(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('Unknown COD collection status')) return 'cod-collection-invalid';
  if (message.includes('COD payment attempt not found')) return 'cod-collection-not-found';
  if (message.includes('Only COD payment attempts')) return 'cod-collection-not-cod';
  return undefined;
}

async function listCodCollectionRows() {
  if (!hasDatabase()) return [];

  const attempts = await prisma.checkoutPaymentAttempt.findMany({
    where: { provider: 'manual' },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      status: true,
      amountCents: true,
      currency: true,
      metadata: true,
      createdAt: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          fulfillmentStatus: true,
          recipientName: true,
          recipientPhone: true,
          totalCents: true,
          currency: true,
          customer: { select: { displayName: true, phone: true } }
        }
      }
    }
  });

  return attempts
    .map((attempt) => ({ attempt, metadata: metadataRecord(attempt.metadata) }))
    .filter(({ metadata }) => isCodMetadata(metadata))
    .slice(0, 50)
    .map(({ attempt, metadata }) => ({
      ...attempt,
      metadata,
      collectionStatus: textMetadata(metadata.codCollectionStatus) ?? 'pending',
      collectionUpdatedAt: textMetadata(metadata.codCollectionUpdatedAt),
      collectionNote: textMetadata(metadata.codCollectionNote),
      providerKey: textMetadata(metadata.codCollectionProviderKey),
      settlementMode: textMetadata(metadata.codSettlementMode)
    }));
}

async function updateCodCollectionFormAction(formData: FormData) {
  'use server';

  const actor = await assertAdminRole('staff');
  const orderId = stringFormValue(formData, 'orderId');
  const paymentAttemptId = stringFormValue(formData, 'paymentAttemptId');
  const note = stringFormValue(formData, 'note');
  let result: Awaited<ReturnType<typeof updateCodCollectionStatus>>;
  let collectionStatus: ReturnType<typeof assertCodCollectionStatus>;

  try {
    collectionStatus = assertCodCollectionStatus(stringFormValue(formData, 'codCollectionStatus'));
    result = await updateCodCollectionStatus({
      orderId,
      paymentAttemptId,
      status: collectionStatus,
      note,
      actorLabel: actor.label,
      actorRole: actor.role
    });
  } catch (error) {
    const status = collectionFailureStatus(error);
    if (status) redirect(`/admin/payments/cod-collections?status=${status}`);
    throw error;
  }

  await recordAdminAuditLog({
    action: 'order.payment.cod.collection_update',
    entity: 'checkoutOrder',
    entityId: result.order.id,
    summary: `Updated COD collection for order ${result.order.orderNumber} from ${result.fromStatus} to ${result.toStatus}`,
    metadata: {
      paymentAttemptId: result.paymentAttempt.id,
      previousStatus: result.fromStatus,
      status: result.toStatus,
      noteAdded: Boolean(note)
    }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/payments/cod-collections');
  redirect('/admin/payments/cod-collections?status=cod-collection-updated');
}

export default async function AdminCodCollectionPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await assertAdminRole('staff');
  const [{ status }, rows] = await Promise.all([searchParams, listCodCollectionRows()]);
  const banner = statusBanner(status);

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-7xl px-5 py-14">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">COD collections</p>
          <h1 className="mt-3 font-display text-5xl text-rosewood">Delivery collection controls</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-600">Mark cash/pay-on-delivery collections as pending, collected, failed, or waived while preserving staff notes, order timeline evidence, and admin audit metadata.</p>
        </div>
        <Link href="/admin#orders" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood">Back to orders</Link>
      </div>

      {banner ? <div className="mb-6 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive">{banner}</div> : null}

      {rows.length === 0 ? (
        <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 text-sm text-stone-700 shadow-sm">No COD collection attempts are waiting in the latest payment-attempt sample.</section>
      ) : (
        <section className="grid gap-4">
          {rows.map((row) => (
            <article key={row.id} className={`rounded-[2rem] border p-5 shadow-sm ${collectionTone(row.collectionStatus)}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link href={`/admin/orders/${row.order.id}`} className="font-semibold underline decoration-current/30 underline-offset-4">{row.order.orderNumber}</Link>
                  <p className="mt-1 text-xs opacity-80">Order {row.order.status} · Fulfillment {row.order.fulfillmentStatus}</p>
                  <p className="mt-1 text-xs opacity-80">Customer: {row.order.customer?.displayName || row.order.recipientName || 'Guest'} · {row.order.customer?.phone || row.order.recipientPhone || 'No phone'}</p>
                </div>
                <span className="rounded-full border border-current/20 px-3 py-1 text-xs font-semibold">{row.collectionStatus}</span>
              </div>

              <div className="mt-4 grid gap-1 text-xs">
                <p><strong>Attempt amount:</strong> {formatMinorUnitAmount(row.amountCents, row.currency)}</p>
                <p><strong>Order total:</strong> {formatMinorUnitAmount(row.order.totalCents, row.order.currency)}</p>
                {row.providerKey ? <p><strong>Provider key:</strong> {row.providerKey}</p> : null}
                {row.settlementMode ? <p><strong>Settlement:</strong> {row.settlementMode}</p> : null}
                {row.collectionUpdatedAt ? <p><strong>Updated:</strong> {row.collectionUpdatedAt}</p> : null}
                {row.collectionNote ? <p><strong>Latest note:</strong> {row.collectionNote}</p> : null}
              </div>

              <form action={updateCodCollectionFormAction} className="mt-4 grid gap-3 rounded-3xl border border-current/10 bg-white/60 p-4 md:grid-cols-[12rem_1fr_auto]">
                <input type="hidden" name="orderId" value={row.order.id} />
                <input type="hidden" name="paymentAttemptId" value={row.id} />
                <label className="grid gap-2 text-sm font-semibold">
                  Collection status
                  <select name="codCollectionStatus" defaultValue={row.collectionStatus} className={inputClass}>
                    {COD_COLLECTION_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Staff note
                  <input name="note" className={inputClass} placeholder="Delivery collection evidence or failure reason" />
                </label>
                <div className="flex items-end">
                  <button type="submit" className="rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white">Save COD collection</button>
                </div>
              </form>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
