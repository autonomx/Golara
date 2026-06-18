import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { assertAdminRole, isAdminAuthConfigured } from '@/lib/admin-auth';
import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { assertCodCollectionStatus, assertCodSettlementStatus, recordCodAdjustment, updateCodCollectionStatus } from '@/lib/checkout/cod-collection-service';
import type { CodAdjustmentOperation } from '@/lib/checkout/cod-adjustment-tracking';
import { COD_COLLECTION_STATUSES, COD_SETTLEMENT_STATUSES } from '@/lib/checkout/payment-method-checkout-selection';
import { listAdminCategories, listAdminProducts, listMedia } from '@/lib/cms/catalog-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { hasDatabase, prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const inputClass = 'rounded-2xl border border-rosewood/15 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-rosewood';
const COD_ADJUSTMENT_OPERATIONS: CodAdjustmentOperation[] = ['adjustment', 'refund', 'void'];

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

function assertCodAdjustmentOperation(value: string): CodAdjustmentOperation {
  if ((COD_ADJUSTMENT_OPERATIONS as readonly string[]).includes(value)) return value as CodAdjustmentOperation;
  throw new Error(`Unknown COD adjustment operation: ${value}`);
}

function statusBanner(status?: string) {
  if (status === 'cod-collection-updated') return 'COD collection status updated.';
  if (status === 'cod-adjustment-recorded') return 'COD adjustment evidence recorded.';
  if (status === 'cod-collection-invalid') return 'COD collection status was invalid.';
  if (status === 'cod-settlement-invalid') return 'COD settlement status was invalid.';
  if (status === 'cod-adjustment-invalid') return 'COD adjustment operation was invalid.';
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
  if (message.includes('Unknown COD settlement status')) return 'cod-settlement-invalid';
  if (message.includes('Unknown COD adjustment operation')) return 'cod-adjustment-invalid';
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
      settlementMode: textMetadata(metadata.codSettlementMode),
      settlementStatus: textMetadata(metadata.codSettlementStatus) ?? 'pending',
      settlementReference: textMetadata(metadata.codSettlementReference),
      settlementSettledAt: textMetadata(metadata.codSettlementSettledAt),
      settlementUpdatedAt: textMetadata(metadata.codSettlementUpdatedAt),
      adjustmentOperation: textMetadata(metadata.codAdjustmentOperation),
      adjustmentStatus: textMetadata(metadata.codAdjustmentStatus),
      adjustmentRecordedAt: textMetadata(metadata.codAdjustmentRecordedAt),
      adjustmentNote: textMetadata(metadata.codAdjustmentNote)
    }));
}

async function updateCodCollectionFormAction(formData: FormData) {
  'use server';

  const actor = await assertAdminRole('staff');
  const orderId = stringFormValue(formData, 'orderId');
  const paymentAttemptId = stringFormValue(formData, 'paymentAttemptId');
  const note = stringFormValue(formData, 'note');
  const settlementReference = stringFormValue(formData, 'settlementReference');
  const settlementSettledAt = stringFormValue(formData, 'settlementSettledAt');
  let result: Awaited<ReturnType<typeof updateCodCollectionStatus>>;
  let collectionStatus: ReturnType<typeof assertCodCollectionStatus>;
  let settlementStatus: ReturnType<typeof assertCodSettlementStatus>;

  try {
    collectionStatus = assertCodCollectionStatus(stringFormValue(formData, 'codCollectionStatus'));
    settlementStatus = assertCodSettlementStatus(stringFormValue(formData, 'codSettlementStatus'));
    result = await updateCodCollectionStatus({
      orderId,
      paymentAttemptId,
      status: collectionStatus,
      note,
      settlementStatus,
      settlementReference,
      settlementSettledAt,
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
      previousSettlementStatus: result.fromSettlementStatus,
      settlementStatus: result.toSettlementStatus,
      settlementReferenceAdded: Boolean(settlementReference),
      settlementSettledAtAdded: Boolean(settlementSettledAt),
      noteAdded: Boolean(note)
    }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/payments/cod-collections');
  redirect('/admin/payments/cod-collections?status=cod-collection-updated');
}

async function recordCodAdjustmentFormAction(formData: FormData) {
  'use server';

  const actor = await assertAdminRole('owner');
  const orderId = stringFormValue(formData, 'orderId');
  const paymentAttemptId = stringFormValue(formData, 'paymentAttemptId');
  const note = stringFormValue(formData, 'adjustmentNote');
  let operation: CodAdjustmentOperation;
  let result: Awaited<ReturnType<typeof recordCodAdjustment>>;

  try {
    operation = assertCodAdjustmentOperation(stringFormValue(formData, 'codAdjustmentOperation'));
    result = await recordCodAdjustment({
      orderId,
      paymentAttemptId,
      operation,
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
    action: 'order.payment.cod.adjustment_recorded',
    entity: 'checkoutOrder',
    entityId: result.order.id,
    summary: `Recorded COD ${result.operation} evidence for order ${result.order.orderNumber}`,
    metadata: {
      paymentAttemptId: result.paymentAttempt.id,
      operation: result.operation,
      fromPaymentStatus: result.fromPaymentStatus,
      fromCollectionStatus: result.fromCollectionStatus,
      noteAdded: Boolean(note)
    }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/payments/cod-collections');
  redirect('/admin/payments/cod-collections?status=cod-adjustment-recorded');
}

export default async function AdminCodCollectionPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [actor, { status }, rows, locale, products, categories, media] = await Promise.all([
    assertAdminRole('staff'),
    searchParams,
    listCodCollectionRows(),
    resolveStorefrontLocale(),
    listAdminProducts(),
    listAdminCategories(),
    listMedia()
  ]);
  const banner = statusBanner(status);
  const canRecordCodAdjustments = actor.role === 'owner';

  return (
    <AdminPageShell
      activeTab="sales"
      activeNavKey="cod-collections"
      authenticated={true}
      authConfigured={isAdminAuthConfigured()}
      adminLabel={actor.label ?? actor.email}
      locale={locale}
      returnTo="/admin/payments/cod-collections"
      productCount={products.length}
      categoryCount={categories.length}
      mediaCount={media.length}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">COD collections</p>
            <h1 className="mt-3 font-display text-5xl text-rosewood">Delivery collection controls</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-600">Mark cash/pay-on-delivery collections as pending, collected, failed, or waived while preserving staff notes, settlement evidence, order timeline events, and admin audit metadata.</p>
          </div>
          <Link href="/admin/orders" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood">Back to orders</Link>
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
                  {row.settlementMode ? <p><strong>Settlement mode:</strong> {row.settlementMode}</p> : null}
                  <p><strong>Settlement status:</strong> {row.settlementStatus}</p>
                  {row.settlementReference ? <p><strong>Settlement reference:</strong> {row.settlementReference}</p> : null}
                  {row.settlementSettledAt ? <p><strong>Settled at:</strong> {row.settlementSettledAt}</p> : null}
                  {row.settlementUpdatedAt ? <p><strong>Settlement updated:</strong> {row.settlementUpdatedAt}</p> : null}
                  {row.collectionUpdatedAt ? <p><strong>Collection updated:</strong> {row.collectionUpdatedAt}</p> : null}
                  {row.collectionNote ? <p><strong>Latest note:</strong> {row.collectionNote}</p> : null}
                  {row.adjustmentStatus ? <p><strong>Latest adjustment:</strong> {row.adjustmentStatus} ({row.adjustmentOperation ?? 'adjustment'}){row.adjustmentRecordedAt ? ` · ${row.adjustmentRecordedAt}` : ''}</p> : null}
                  {row.adjustmentNote ? <p><strong>Adjustment note:</strong> {row.adjustmentNote}</p> : null}
                </div>

                <form action={updateCodCollectionFormAction} className="mt-4 grid gap-3 rounded-3xl border border-current/10 bg-white/60 p-4 md:grid-cols-2 xl:grid-cols-[12rem_12rem_1fr_1fr_auto]">
                  <input type="hidden" name="orderId" value={row.order.id} />
                  <input type="hidden" name="paymentAttemptId" value={row.id} />
                  <label className="grid gap-2 text-sm font-semibold">
                    Collection status
                    <select name="codCollectionStatus" defaultValue={row.collectionStatus} className={inputClass}>
                      {COD_COLLECTION_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    Settlement status
                    <select name="codSettlementStatus" defaultValue={row.settlementStatus} className={inputClass}>
                      {COD_SETTLEMENT_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    Settlement reference
                    <input name="settlementReference" className={inputClass} placeholder="Courier batch, receipt, or reconciliation ID" defaultValue={row.settlementReference ?? ''} />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    Staff note
                    <input name="note" className={inputClass} placeholder="Delivery collection evidence or failure reason" />
                  </label>
                  <input type="hidden" name="settlementSettledAt" value={row.settlementSettledAt ?? ''} />
                  <div className="flex items-end">
                    <button type="submit" className="rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white">Save COD collection</button>
                  </div>
                </form>

                {canRecordCodAdjustments ? (
                  <form action={recordCodAdjustmentFormAction} className="mt-3 grid gap-3 rounded-3xl border border-current/10 bg-white/70 p-4 md:grid-cols-[12rem_1fr_auto]">
                    <input type="hidden" name="orderId" value={row.order.id} />
                    <input type="hidden" name="paymentAttemptId" value={row.id} />
                    <label className="grid gap-2 text-sm font-semibold">
                      Adjustment type
                      <select name="codAdjustmentOperation" defaultValue="adjustment" className={inputClass}>
                        {COD_ADJUSTMENT_OPERATIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      Owner note
                      <input name="adjustmentNote" className={inputClass} placeholder="Adjustment, refund, or void evidence" />
                    </label>
                    <div className="flex items-end">
                      <button type="submit" className="rounded-full border border-rosewood/20 bg-white px-5 py-2 text-sm font-semibold text-rosewood">Record COD adjustment</button>
                    </div>
                  </form>
                ) : null}
              </article>
            ))}
          </section>
        )}
      </div>
    </AdminPageShell>
  );
}
