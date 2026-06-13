import Link from 'next/link';

import { AdminPaymentOperationProviderReadinessPanel } from '@/components/admin/AdminPaymentOperationProviderReadinessPanel';
import { assertAdminRole, isAdminAuthConfigured } from '@/lib/admin-auth';
import { buildPaymentOperationProviderReadinessRouteResult } from '@/lib/checkout/payment-operation-provider-readiness-route-core';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { createAdminTranslator } from '@/lib/localization/admin-copy';
import { getStorefrontCopyDirection } from '@/lib/localization/storefront-copy';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentOperationProvidersPage() {
  const locale = await resolveStorefrontLocale();
  const t = createAdminTranslator(locale);
  const authConfigured = isAdminAuthConfigured();
  const identity = await assertAdminRole('owner');
  const readinessResult = buildPaymentOperationProviderReadinessRouteResult();

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 lg:px-8" dir={getStorefrontCopyDirection(locale)}>
      <div className="mx-auto grid max-w-7xl gap-6">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{t('Admin / Payments')}</p>
              <h1 className="mt-1 text-3xl font-bold text-stone-950">{t('Payment provider readiness')}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                {t('Read-only Phase 33 diagnostics for refund and void provider readiness. This page reports credential environment variable names, endpoint-mapping evidence, and provider-validation evidence without executing adapters, calling providers, creating records, or mutating orders/payments.')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/payments/operations" className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800">{t('Payment operations')}</Link>
              <Link href="/admin/payments/operations/history" className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800">{t('Operation history')}</Link>
              <Link href="/admin/payments/operations/preview" className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800">{t('Preview operations')}</Link>
              <Link href="/admin/payments/settlement" className="rounded-md bg-rosewood px-4 py-2 text-sm font-semibold text-white">{t('Back to settlement')}</Link>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
            {authConfigured ? `${t('Signed in as')} ${identity.label ?? identity.email ?? 'admin'}.` : t('Admin authentication is not configured yet.')}
          </div>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
            {t('Execution remains disabled. These diagnostics are informational only and do not submit refunds, void authorizations, provider requests, inventory/capacity release, or order/payment mutations.')}
          </div>
        </section>

        {readinessResult.status === 200 ? <AdminPaymentOperationProviderReadinessPanel summary={readinessResult.body.summary} locale={locale} /> : null}
      </div>
    </main>
  );
}
