import Link from 'next/link';

import { AdminPaymentOperationPreviewPanel } from '@/components/admin/AdminPaymentOperationPreviewPanel';
import { assertAdminRole, isAdminAuthConfigured } from '@/lib/admin-auth';
import { buildPaymentOperationPreviewRequestResult } from '@/lib/checkout/payment-operation-preview-request-core';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { createAdminTranslator } from '@/lib/localization/admin-copy';
import { getStorefrontCopyDirection } from '@/lib/localization/storefront-copy';

export const dynamic = 'force-dynamic';

const samplePreviewRequest = {
  operation: 'refund',
  orderStatus: 'paid',
  orderTotalCents: '420000',
  orderCurrency: 'USD',
  paymentProvider: 'stripe',
  paymentStatus: 'paid',
  paymentAmountCents: '420000',
  paymentCurrency: 'USD',
  providerReference: 'pi_preview_reference',
  amountCents: '210000',
  reason: 'Operator preview sample. No refund is submitted.',
  orderNumber: 'GOL-PREVIEW-1001',
  paymentAttemptId: 'attempt-preview-1'
};

export default async function AdminPaymentOperationPreviewPage() {
  const locale = await resolveStorefrontLocale();
  const t = createAdminTranslator(locale);
  const authConfigured = isAdminAuthConfigured();
  const identity = await assertAdminRole('owner');
  const previewResult = buildPaymentOperationPreviewRequestResult(samplePreviewRequest);
  const previewRouteResult = previewResult.status === 200 && previewResult.body.ok ? previewResult : null;

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 lg:px-8" dir={getStorefrontCopyDirection(locale)}>
      <div className="mx-auto grid max-w-7xl gap-6">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{t('Admin / Payments')}</p>
              <h1 className="mt-1 text-3xl font-bold text-stone-950">{t('Payment operation preview')}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                {t('Read-only Phase 33 preview entry point for refund and void planning. This page uses static sample data and does not submit refunds, void authorizations, create records, or call providers.')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/payments/operations" className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800">{t('Payment operations')}</Link>
              <Link href="/admin/payments/settlement" className="rounded-md bg-rosewood px-4 py-2 text-sm font-semibold text-white">{t('Back to settlement')}</Link>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
            {authConfigured ? `${t('Signed in as')} ${identity.label ?? identity.email ?? 'admin'}.` : t('Admin authentication is not configured yet.')}
          </div>
        </section>

        {previewRouteResult ? <AdminPaymentOperationPreviewPanel result={previewRouteResult} locale={locale} /> : null}
        {!previewResult.body.ok ? (
          <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-950 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em]">{t('Preview sample validation failed')}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6">
              {previewResult.body.errors.map((error) => <li key={`${error.field}-${error.code}`}>{error.field}: {error.message}</li>)}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
