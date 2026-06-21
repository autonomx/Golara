import Link from 'next/link';

import { assertAdminRole, isAdminAuthConfigured } from '@/lib/admin-auth';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { createAdminTranslator } from '@/lib/localization/admin-copy';
import { getStorefrontCopyDirection } from '@/lib/localization/storefront-copy';

export const dynamic = 'force-dynamic';

const operationLinks = [
  {
    href: '/admin/payments/operations/providers',
    label: 'Provider readiness',
    description: 'Review credential names, endpoint-mapping evidence, validation evidence, and manual-review provider state without provider calls or execution controls.'
  },
  {
    href: '/admin/payments/operations/history',
    label: 'Operation history',
    description: 'Review migration-gated payment operation records for a specific order without creating records, executing adapters, or mutating order/payment state.'
  },
  {
    href: '/admin/payments/operations/preview',
    label: 'Operation preview',
    description: 'Inspect a static read-only refund/void planning sample without persistence, provider calls, or execution affordances.'
  }
];

export default async function AdminPaymentOperationsPage() {
  const locale = await resolveStorefrontLocale();
  const t = createAdminTranslator(locale);
  const authConfigured = isAdminAuthConfigured();
  const identity = await assertAdminRole('owner');

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 lg:px-8" dir={getStorefrontCopyDirection(locale)}>
      <div className="mx-auto grid max-w-7xl gap-6">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{t('Admin / Payments')}</p>
              <h1 className="mt-1 text-3xl font-bold text-stone-950">{t('Payment operations')}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                {t('Read-only Phase 33 landing page for refund and void operation diagnostics. These links surface planning, history, and provider-readiness views without submitting refunds, void authorizations, provider requests, or order/payment mutations.')}
              </p>
            </div>
            <Link href="/admin/payments/settlement" className="rounded-md bg-rosewood px-4 py-2 text-sm font-semibold text-white">{t('Back to settlement')}</Link>
          </div>
          <div className="mt-4 rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
            {authConfigured ? `${t('Signed in as')} ${identity.label ?? identity.email ?? 'admin'}.` : t('Admin authentication is not configured yet.')}
          </div>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
            {t('Execution remains disabled. This page is navigation-only and does not call provider adapters, use Prisma, create operation records, mutate orders/payments, or release inventory/capacity.')}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {operationLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">{t('Read-only')}</p>
              <h2 className="mt-2 text-xl font-bold text-stone-950">{t(link.label)}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{t(link.description)}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
