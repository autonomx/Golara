import 'server-only';

import type { Prisma } from '@prisma/client';
import { hasDatabase, prisma } from '@/lib/prisma';
import { listCustomerWalletLedger, type CustomerWalletBalance, type CustomerWalletLedgerEntry } from '@/lib/checkout/customer-wallet-ledger';

export type CustomerWalletAccountHistory = {
  balance: CustomerWalletBalance | null;
  entries: CustomerWalletLedgerEntry[];
};

function isMissingWalletTable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (message.includes('CustomerWalletBalance') || message.includes('CustomerWalletLedgerEntry')) && (message.includes('does not exist') || message.includes('42P01'));
}

function normalizeText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

function normalizeCurrency(value?: string | null) {
  return normalizeText(value)?.toUpperCase() ?? 'TOMAN';
}

function normalizeCustomerId(value: string) {
  const customerId = normalizeText(value);
  if (!customerId) throw new Error('Customer id is required for wallet account history.');
  return customerId;
}

export async function getCustomerWalletAccountHistory(customerId: string, currency = 'TOMAN', limit = 50): Promise<CustomerWalletAccountHistory> {
  if (!hasDatabase()) return { balance: null, entries: [] };

  const normalizedCustomerId = normalizeCustomerId(customerId);
  const normalizedCurrency = normalizeCurrency(currency);
  const boundedLimit = Math.min(100, Math.max(1, Math.floor(limit)));

  try {
    const balances = await prisma.$queryRaw<CustomerWalletBalance[]>`
      SELECT
        "id",
        "customerId",
        "currency",
        "availableBalanceCents",
        "reservedBalanceCents",
        "lifetimeCreditCents",
        "lifetimeDebitCents",
        "metadata",
        "createdAt",
        "updatedAt"
      FROM "CustomerWalletBalance"
      WHERE "customerId" = ${normalizedCustomerId} AND "currency" = ${normalizedCurrency}
      LIMIT 1
    `;

    return {
      balance: balances[0] ?? null,
      entries: await listCustomerWalletLedger(normalizedCustomerId, normalizedCurrency, boundedLimit)
    };
  } catch (error) {
    if (isMissingWalletTable(error)) return { balance: null, entries: [] };
    throw error;
  }
}

export function walletEntryMetadataObject(metadata: Prisma.JsonValue): Record<string, unknown> {
  return metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata as Record<string, unknown> : {};
}
