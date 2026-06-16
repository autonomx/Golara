import { NextResponse } from 'next/server';
import { assertAdminRole } from '@/lib/admin-auth';
import { listAdminCheckoutOrdersForExport } from '@/lib/checkout/admin-order-repository';
import { listCustomerWalletSummaries } from '@/lib/checkout/customer-wallet-ledger';
import { formatPaymentReconciliationCsv } from '@/lib/checkout/payment-reconciliation-csv-export';
import {
  summarizeCodCollectionSettlementTotals,
  summarizeInstallmentReceivables,
  summarizeManualTransferSettlementTotals,
  summarizeSettlementByPaymentMethod,
  summarizeWalletLiabilityBalances,
  type InstallmentReceivableScheduleEntryInput
} from '@/lib/checkout/payment-method-settlement-summary';
import { hasDatabase, prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function optionalParam(value: string | null) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function safeLimit(value: string | null, fallback = 500) {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(1000, parsed));
}

function isMissingInstallmentTable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    (message.includes('InstallmentPaymentScheduleEntry') || message.includes('InstallmentPaymentPlan')) &&
    (message.includes('does not exist') || message.includes('42P01'))
  );
}

async function listInstallmentReceivableScheduleEntries(limit: number): Promise<InstallmentReceivableScheduleEntryInput[]> {
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

export async function GET(request: Request) {
  try {
    await assertAdminRole('owner');
  } catch {
    return NextResponse.json({ status: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const currency = optionalParam(url.searchParams.get('currency')) || 'CAD';
  const walletCurrency = optionalParam(url.searchParams.get('walletCurrency')) || 'TOMAN';
  const installmentCurrency = optionalParam(url.searchParams.get('installmentCurrency')) || walletCurrency;
  const limit = safeLimit(url.searchParams.get('limit'));

  const [orders, wallets, installmentEntries] = await Promise.all([
    listAdminCheckoutOrdersForExport({
      status: optionalParam(url.searchParams.get('orderStatus')),
      paymentStatus: optionalParam(url.searchParams.get('orderPaymentStatus')),
      search: optionalParam(url.searchParams.get('orderSearch'))
    }),
    listCustomerWalletSummaries(limit),
    listInstallmentReceivableScheduleEntries(limit)
  ]);

  const methodSummaries = summarizeSettlementByPaymentMethod(orders);
  const csv = formatPaymentReconciliationCsv({
    generatedAt: optionalParam(url.searchParams.get('generatedAt')) || new Date(),
    methodSummaries,
    manualTransferTotals: summarizeManualTransferSettlementTotals(methodSummaries, currency),
    walletLiability: summarizeWalletLiabilityBalances(wallets, methodSummaries, walletCurrency),
    codCollectionTotals: summarizeCodCollectionSettlementTotals(methodSummaries, currency),
    installmentReceivables: summarizeInstallmentReceivables(installmentEntries, installmentCurrency)
  });

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="golara-reconciliation.csv"'
    }
  });
}
