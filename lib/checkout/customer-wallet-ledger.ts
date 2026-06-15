import 'server-only';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { hasDatabase, prisma } from '@/lib/prisma';

export const CUSTOMER_WALLET_ENTRY_TYPES = ['admin_credit', 'admin_debit', 'checkout_reservation', 'checkout_capture', 'checkout_release', 'refund_credit'] as const;
export const CUSTOMER_WALLET_ENTRY_DIRECTIONS = ['credit', 'debit', 'reserve', 'release', 'capture'] as const;
export const CUSTOMER_WALLET_ENTRY_STATUSES = ['posted', 'reserved', 'released', 'captured', 'voided'] as const;

export type CustomerWalletEntryType = (typeof CUSTOMER_WALLET_ENTRY_TYPES)[number];
export type CustomerWalletEntryDirection = (typeof CUSTOMER_WALLET_ENTRY_DIRECTIONS)[number];
export type CustomerWalletEntryStatus = (typeof CUSTOMER_WALLET_ENTRY_STATUSES)[number];

export type CustomerWalletBalance = {
  id: string;
  customerId: string;
  currency: string;
  availableBalanceCents: number;
  reservedBalanceCents: number;
  lifetimeCreditCents: number;
  lifetimeDebitCents: number;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

export type CustomerWalletLedgerEntry = {
  id: string;
  walletId: string;
  customerId: string;
  orderId: string | null;
  paymentAttemptId: string | null;
  entryType: CustomerWalletEntryType;
  direction: CustomerWalletEntryDirection;
  status: CustomerWalletEntryStatus;
  amountCents: number;
  currency: string;
  availableBalanceAfterCents: number;
  reservedBalanceAfterCents: number;
  idempotencyKey: string;
  note: string | null;
  actorLabel: string | null;
  actorRole: string | null;
  metadata: Prisma.JsonValue;
  createdAt: Date;
};

export type CustomerWalletSummary = CustomerWalletBalance & {
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  lastEntryAt: Date | null;
  entryCount: number;
};

export type CustomerWalletAdjustmentInput = {
  customerId: string;
  amountCents: number;
  direction: 'credit' | 'debit';
  currency?: string;
  note?: string | null;
  actorLabel: string;
  actorRole: string;
  idempotencyKey?: string | null;
  metadata?: Prisma.InputJsonObject;
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

function normalizeAmountCents(value: number) {
  const amount = Math.floor(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Wallet amount must be a positive integer minor-unit value.');
  return amount;
}

function normalizeCustomerId(value: string) {
  const customerId = normalizeText(value);
  if (!customerId) throw new Error('Customer id is required for wallet operations.');
  return customerId;
}

function assertWalletDirection(value: string): 'credit' | 'debit' {
  if (value === 'credit' || value === 'debit') return value;
  throw new Error(`Unsupported wallet adjustment direction: ${value}`);
}

function normalizeAdjustmentInput(input: CustomerWalletAdjustmentInput) {
  const direction = assertWalletDirection(input.direction);
  return {
    customerId: normalizeCustomerId(input.customerId),
    amountCents: normalizeAmountCents(input.amountCents),
    direction,
    currency: normalizeCurrency(input.currency),
    note: normalizeText(input.note),
    actorLabel: normalizeText(input.actorLabel) ?? 'Admin',
    actorRole: normalizeText(input.actorRole) ?? 'owner',
    idempotencyKey: normalizeText(input.idempotencyKey) ?? `wallet:${direction}:${randomUUID()}`,
    metadata: input.metadata ?? {}
  };
}

function mapLedgerEntry(row: CustomerWalletLedgerEntry): CustomerWalletLedgerEntry {
  return {
    ...row,
    entryType: CUSTOMER_WALLET_ENTRY_TYPES.includes(row.entryType) ? row.entryType : 'admin_credit',
    direction: CUSTOMER_WALLET_ENTRY_DIRECTIONS.includes(row.direction) ? row.direction : 'credit',
    status: CUSTOMER_WALLET_ENTRY_STATUSES.includes(row.status) ? row.status : 'posted'
  };
}

export async function listCustomerWalletSummaries(limit = 50): Promise<CustomerWalletSummary[]> {
  if (!hasDatabase()) return [];
  const boundedLimit = Math.min(100, Math.max(1, Math.floor(limit)));

  try {
    return await prisma.$queryRaw<CustomerWalletSummary[]>`
      SELECT
        wallet."id",
        wallet."customerId",
        wallet."currency",
        wallet."availableBalanceCents",
        wallet."reservedBalanceCents",
        wallet."lifetimeCreditCents",
        wallet."lifetimeDebitCents",
        wallet."metadata",
        wallet."createdAt",
        wallet."updatedAt",
        customer."displayName" AS "customerName",
        customer."phone" AS "customerPhone",
        customer."email" AS "customerEmail",
        MAX(entry."createdAt") AS "lastEntryAt",
        COUNT(entry."id")::int AS "entryCount"
      FROM "CustomerWalletBalance" wallet
      JOIN "CustomerProfile" customer ON customer."id" = wallet."customerId"
      LEFT JOIN "CustomerWalletLedgerEntry" entry ON entry."walletId" = wallet."id"
      GROUP BY wallet."id", customer."displayName", customer."phone", customer."email"
      ORDER BY wallet."updatedAt" DESC
      LIMIT ${boundedLimit}
    `;
  } catch (error) {
    if (isMissingWalletTable(error)) return [];
    throw error;
  }
}

export async function listCustomerWalletLedger(customerId: string, currency = 'TOMAN', limit = 50): Promise<CustomerWalletLedgerEntry[]> {
  if (!hasDatabase()) return [];
  const normalizedCustomerId = normalizeCustomerId(customerId);
  const normalizedCurrency = normalizeCurrency(currency);
  const boundedLimit = Math.min(100, Math.max(1, Math.floor(limit)));

  try {
    const rows = await prisma.$queryRaw<CustomerWalletLedgerEntry[]>`
      SELECT
        "id",
        "walletId",
        "customerId",
        "orderId",
        "paymentAttemptId",
        "entryType",
        "direction",
        "status",
        "amountCents",
        "currency",
        "availableBalanceAfterCents",
        "reservedBalanceAfterCents",
        "idempotencyKey",
        "note",
        "actorLabel",
        "actorRole",
        "metadata",
        "createdAt"
      FROM "CustomerWalletLedgerEntry"
      WHERE "customerId" = ${normalizedCustomerId} AND "currency" = ${normalizedCurrency}
      ORDER BY "createdAt" DESC
      LIMIT ${boundedLimit}
    `;
    return rows.map(mapLedgerEntry);
  } catch (error) {
    if (isMissingWalletTable(error)) return [];
    throw error;
  }
}

export async function postCustomerWalletAdminAdjustment(input: CustomerWalletAdjustmentInput): Promise<{ wallet: CustomerWalletBalance; entry: CustomerWalletLedgerEntry }> {
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');
  const adjustment = normalizeAdjustmentInput(input);
  const metadataJson = JSON.stringify({ ...adjustment.metadata, source: 'admin_wallet_adjustment' });

  const result = await prisma.$transaction(async (tx) => {
    const customers = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "CustomerProfile" WHERE "id" = ${adjustment.customerId} LIMIT 1
    `;
    if (!customers[0]) throw new Error(`Customer not found for wallet adjustment: ${adjustment.customerId}`);

    const existingEntries = await tx.$queryRaw<CustomerWalletLedgerEntry[]>`
      SELECT
        "id",
        "walletId",
        "customerId",
        "orderId",
        "paymentAttemptId",
        "entryType",
        "direction",
        "status",
        "amountCents",
        "currency",
        "availableBalanceAfterCents",
        "reservedBalanceAfterCents",
        "idempotencyKey",
        "note",
        "actorLabel",
        "actorRole",
        "metadata",
        "createdAt"
      FROM "CustomerWalletLedgerEntry"
      WHERE "idempotencyKey" = ${adjustment.idempotencyKey}
      LIMIT 1
    `;
    if (existingEntries[0]) {
      const wallets = await tx.$queryRaw<CustomerWalletBalance[]>`
        SELECT * FROM "CustomerWalletBalance" WHERE "id" = ${existingEntries[0].walletId} LIMIT 1
      `;
      if (!wallets[0]) throw new Error('Wallet balance missing for idempotent ledger entry.');
      return { wallet: wallets[0], entry: mapLedgerEntry(existingEntries[0]) };
    }

    await tx.$executeRaw`
      INSERT INTO "CustomerWalletBalance" ("customerId", "currency")
      VALUES (${adjustment.customerId}, ${adjustment.currency})
      ON CONFLICT ("customerId", "currency") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
    `;

    const wallets = await tx.$queryRaw<CustomerWalletBalance[]>`
      SELECT * FROM "CustomerWalletBalance"
      WHERE "customerId" = ${adjustment.customerId} AND "currency" = ${adjustment.currency}
      FOR UPDATE
    `;
    const wallet = wallets[0];
    if (!wallet) throw new Error('Wallet balance could not be created.');

    const nextAvailable = adjustment.direction === 'credit'
      ? wallet.availableBalanceCents + adjustment.amountCents
      : wallet.availableBalanceCents - adjustment.amountCents;
    if (nextAvailable < 0) throw new Error('Wallet debit exceeds available balance.');

    const nextLifetimeCredit = adjustment.direction === 'credit'
      ? wallet.lifetimeCreditCents + adjustment.amountCents
      : wallet.lifetimeCreditCents;
    const nextLifetimeDebit = adjustment.direction === 'debit'
      ? wallet.lifetimeDebitCents + adjustment.amountCents
      : wallet.lifetimeDebitCents;

    const updatedWallets = await tx.$queryRaw<CustomerWalletBalance[]>`
      UPDATE "CustomerWalletBalance"
      SET
        "availableBalanceCents" = ${nextAvailable},
        "lifetimeCreditCents" = ${nextLifetimeCredit},
        "lifetimeDebitCents" = ${nextLifetimeDebit},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${wallet.id}
      RETURNING *
    `;
    const updatedWallet = updatedWallets[0];
    if (!updatedWallet) throw new Error('Wallet balance update failed.');

    const entryType: CustomerWalletEntryType = adjustment.direction === 'credit' ? 'admin_credit' : 'admin_debit';
    const entries = await tx.$queryRaw<CustomerWalletLedgerEntry[]>`
      INSERT INTO "CustomerWalletLedgerEntry" (
        "walletId",
        "customerId",
        "entryType",
        "direction",
        "status",
        "amountCents",
        "currency",
        "availableBalanceAfterCents",
        "reservedBalanceAfterCents",
        "idempotencyKey",
        "note",
        "actorLabel",
        "actorRole",
        "metadata"
      ) VALUES (
        ${updatedWallet.id},
        ${adjustment.customerId},
        ${entryType},
        ${adjustment.direction},
        'posted',
        ${adjustment.amountCents},
        ${adjustment.currency},
        ${updatedWallet.availableBalanceCents},
        ${updatedWallet.reservedBalanceCents},
        ${adjustment.idempotencyKey},
        ${adjustment.note},
        ${adjustment.actorLabel},
        ${adjustment.actorRole},
        ${metadataJson}::jsonb
      )
      RETURNING
        "id",
        "walletId",
        "customerId",
        "orderId",
        "paymentAttemptId",
        "entryType",
        "direction",
        "status",
        "amountCents",
        "currency",
        "availableBalanceAfterCents",
        "reservedBalanceAfterCents",
        "idempotencyKey",
        "note",
        "actorLabel",
        "actorRole",
        "metadata",
        "createdAt"
    `;
    const entry = entries[0];
    if (!entry) throw new Error('Wallet ledger entry creation failed.');
    return { wallet: updatedWallet, entry: mapLedgerEntry(entry) };
  });

  await recordAdminAuditLog({
    action: `customer.wallet.${adjustment.direction}`,
    entity: 'customerWalletBalance',
    entityId: result.wallet.id,
    summary: `${adjustment.direction === 'credit' ? 'Credited' : 'Debited'} customer wallet`,
    metadata: {
      customerId: adjustment.customerId,
      entryId: result.entry.id,
      amountCents: adjustment.amountCents,
      currency: adjustment.currency,
      availableBalanceCents: result.wallet.availableBalanceCents,
      actorRole: adjustment.actorRole,
      noteAdded: Boolean(adjustment.note)
    }
  });

  return result;
}
