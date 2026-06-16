import Link from 'next/link';

import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { AdminPaymentReconciliationDashboardPanels } from '@/components/admin/AdminPaymentReconciliationDashboardPanels';
import { AdminPaymentSettlementSummaryPanel } from '@/components/admin/AdminPaymentSettlementSummaryPanel';
import { getAdminIdentity, isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { listAdminCheckoutOrdersForExport } from '@/lib/checkout/admin-order-repository';
import { listCustomerWalletSummaries } from '@/lib/checkout/customer-wallet-ledger';
import {
  summarizeCodCollectionSettlementTotals,
  summarizeInstallmentReceivables,
  summarizeManualTransferSettlementTotals,
  summarizeSettlementByPaymentMethod,
  summarizeWalletLiabilityBalances,
  type InstallmentReceivableScheduleEntryInput
} from '@/lib/checkout/payment-method-settlement-summary';
import { paymentSettlementService, type PaymentSettlementSummary } from '@/lib/checkout/payment-settlement-service';
import { listAdminCategories, listAdminProducts, listMedia } from '@/lib/cms/catalog-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { createAdminTranslator } from '@/lib/localization/admin-copy';
import { hasDatabase, prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const emptySettlementSummary: PaymentSettlementSummary = {
  total: 0,
  settled: 0,
  amountMismatch: 0,
  currencyMismatch: 0,
  pending: 0,
  needsAttention: 0,
  recent: [],
  source: 'unavailable'
};

function isMissingInstallmentTable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    (message.includes('InstallmentPaymentScheduleEntry') || message.includes('InstallmentPaymentPlan')) &&
    (message.includes('does not exist') || message.includes('42P01'))
  );
}

async function listInstallmentReceivableScheduleEntries(limit = 500): Promise<InstallmentReceivableScheduleEntryInput[]> {
  if (!hasDatabase()) return [];

  try {
    return await prisma.$queryRaw<InstallmentReceivableScheduleEntryInput[]>`
      SELECT
        entry."id",
        entry."planId",
        plan."currency",
        entry."totalCents" AS "amountCents",
        CASE
          WHEN entry."status" IN ('paid', 'collected') THEN entry."totalCents"
          ELSE 0
        END AS "paidAmountCents",
        entry."status",
        entry."dueAt",
        entry."paidAt"
      FROM "InstallmentPaymentScheduleEntry" entry
      JOIN "InstallmentPaymentPlan" plan ON plan."id" = entry."planId"
      ORDER BY entry."dueAt" ASC
      LIMIT ${limit}
    `;
  } catch (error) {
    if (isMissingInstallmentTable(error)) return [];
    throw error;
  }
}

export default async function AdminPaymentSettlementPage() {
  const locale = await resolveStorefrontLocale();
  const t = createAdminTranslator(locale);
  const authenticated = await isAdminAuthenticated();
  const authConfigured = isAdminAuthConfigured();
  const identity = await getAdminIdentity();
  const [summary, orders, wallets, installmentEntries, products, categories, media] = await Promise.all([
    authenticated ? paymentSettlementService.summary(50) : Promise.resolve(emptySettlementSummary),
    authenticated ? listAdminCheckoutOrdersForExport({}) : Promise.resolve([]),
    authenticated ? listCustomerWalletSummaries(500) : Promise.resolve([]),
    authenticated ? listInstallmentReceivableScheduleEntries(500) : Promise.resolve([]),
    listAdminProducts(),
    listAdminCategories(),
    listMedia()
  ]);
  const methodSummaries = summarizeSettlementByPaymentMethod(orders);

  return (
    <AdminPageShell
      activeTab="sales"
      activeNavKey="payment-settlement"
      authenticated={authenticated}
      authConfigured={authConfigured}
      adminLabel={identity.label ?? identity.email}
      locale={locale}
      returnTo="/admin/payments/settlement"
      productCount={products.length}
      categoryCount={categories.length}
      mediaCount={media.length}
    >
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{t('Admin / Payments')}</p>
              <h1 className="mt-1 text-3xl font-bold text-stone-950">{t('Payment settlement')}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{t('Review recent payment webhook events and compare provider-reported settlement data against checkout orders.')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/payments/reconciliation/csv" className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800">{t('Export reconciliation CSV')}</Link>
              <Link href="/admin/payments/operations" className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800">{t('Payment operations')}</Link>
              <Link href="/admin/payments/operations/providers" className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800">{t('Provider readiness')}</Link>
              <Link href="/admin/payments/operations/history" className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800">{t('Operation history')}</Link>
              <Link href="/admin/payments/operations/preview" className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800">{t('Preview operations')}</Link>
              <Link href="/admin/orders" className="rounded-md bg-rosewood px-4 py-2 text-sm font-semibold text-white">{t('Back to orders')}</Link>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
            {authConfigured ? authenticated ? `${t('Signed in as')} ${identity.label ?? identity.email ?? 'admin'}.` : t('Admin authentication is required to view settlement data.') : t('Admin authentication is not configured yet.')}
          </div>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
            {t('Refund and void operation pages are read-only Phase 33 diagnostics. They do not execute provider adapters, submit refunds or voids, mutate orders/payments, or release inventory/capacity.')}
          </div>
        </section>

        {authenticated ? <AdminPaymentSettlementSummaryPanel summary={summary} /> : null}
        {authenticated ? (
          <AdminPaymentReconciliationDashboardPanels
            methodSummaries={methodSummaries}
            manualTransferTotals={summarizeManualTransferSettlementTotals(methodSummaries, 'CAD')}
            walletLiability={summarizeWalletLiabilityBalances(wallets, methodSummaries, 'TOMAN')}
            codCollectionTotals={summarizeCodCollectionSettlementTotals(methodSummaries, 'CAD')}
            installmentReceivables={summarizeInstallmentReceivables(installmentEntries, 'TOMAN')}
          />
        ) : null}
      </div>
    </AdminPageShell>
  );
}
