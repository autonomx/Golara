import 'server-only';

import type { Prisma } from '@prisma/client';
import { hasDatabase, prisma } from '@/lib/prisma';

export type CustomerWalletRefundInput = {
  paymentAttemptId: string;
  amountCents?: number | null;
  note?: string | null;
  actorLabel?: string | null;
  actorRole?: string | null;
  idempotencyKey?: string | null;
};

type PaymentAttemptForWalletRefund = {
  id: string;
  orderId: string;
  amountCents: number;
  currency: string;
  status: string;
  metadata: Prisma.JsonValue | null;
  customerId: string | null;
  orderNumber: string;
};

type WalletRow = {
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

type RefundLedgerRow = {
  id: string;
  walletId: string;
  customerId: string;
  orderId: string | null;
  paymentAttemptId: string | null;
  entryType: string;
  direction: string;
  status: string;
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

function normalizeText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || undefined;
}

function normalizePaymentAttemptId(value: string) {
  const normalized = normalizeText(value);
  if (!normalized) throw new Error('Payment attempt id is required for wallet refunds.');
  return normalized;
}

function normalizePositiveAmount(value: number | null | undefined, fallback: number) {
  const amount = value == null ? fallback : Math.floor(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Wallet refund amount must be a positive integer minor-unit value.');
  return amount;
}

function normalizeNote(value?: string | null) {
  return normalizeText(value)?.slice(0, 1000);
}

function normalizeActorLabel(value?: string | null) {
  return normalizeText(value)?.slice(0, 120) ?? 'Wallet refund';
}

function normalizeActorRole(value?: string | null) {
  return normalizeText(value)?.slice(0, 80) ?? 'owner';
}

function metadataRecord(value: Prisma.JsonValue | null | undefined): Prisma.JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Prisma.JsonObject;
}

function metadataNumber(value: Prisma.JsonValue | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function existingRefundTotal(metadata: Prisma.JsonObject) {
  return metadataNumber(metadata.walletRefundTotalCents) ?? 0;
}

function assertRefundableAttempt(attempt: PaymentAttemptForWalletRefund, refundAmountCents: number, metadata: Prisma.JsonObject) {
  if (!attempt.customerId) throw new Error('Wallet refund requires a customer profile on the order.');
  if (attempt.status !== 'paid') throw new Error(`Wallet refund requires a paid payment attempt. Current status: ${attempt.status}.`);
  if (refundAmountCents > attempt.amountCents) throw new Error('Wallet refund cannot exceed the payment attempt amount.');

  const alreadyRefundedCents = existingRefundTotal(metadata);
  if (alreadyRefundedCents + refundAmountCents > attempt.amountCents) {
    throw new Error('Wallet refund would exceed the remaining refundable payment amount.');
  }
}

export async function refundCheckoutPaymentToCustomerWallet(input: CustomerWalletRefundInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for wallet refunds.');

  const paymentAttemptId = normalizePaymentAttemptId(input.paymentAttemptId);
  const actorLabel = normalizeActorLabel(input.actorLabel);
  const actorRole = normalizeActorRole(input.actorRole);
  const note = normalizeNote(input.note);

  return prisma.$transaction(async (tx) => {
    const attempts = await tx.$queryRaw<PaymentAttemptForWalletRefund[]>`
      SELECT
        payment."id",
        payment."orderId",
        payment."amountCents",
        payment."currency",
        payment."status",
        payment."metadata",
        checkout_order."customerId",
        checkout_order."orderNumber"
      FROM "CheckoutPaymentAttempt" payment
      JOIN "CheckoutOrder" checkout_order ON checkout_order."id" = payment."orderId"
      WHERE payment."id" = ${paymentAttemptId}
      LIMIT 1
    `;
    const attempt = attempts[0];
    if (!attempt) throw new Error(`Checkout payment attempt not found: ${paymentAttemptId}`);

    const metadata = metadataRecord(attempt.metadata);
    const refundAmountCents = normalizePositiveAmount(input.amountCents, attempt.amountCents);
    assertRefundableAttempt(attempt, refundAmountCents, metadata);

    const refundIdempotencyKey = normalizeText(input.idempotencyKey) ?? `wallet:refund:${attempt.id}:${refundAmountCents}`;
    const existingEntries = await tx.$queryRaw<RefundLedgerRow[]>`
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
      WHERE "idempotencyKey" = ${refundIdempotencyKey}
      LIMIT 1
    `;
    if (existingEntries[0]) {
      const wallets = await tx.$queryRaw<WalletRow[]>`
        SELECT * FROM "CustomerWalletBalance" WHERE "id" = ${existingEntries[0].walletId} LIMIT 1
      `;
      if (!wallets[0]) throw new Error('Wallet balance missing for idempotent wallet refund.');
      return { wallet: wallets[0], refundEntry: existingEntries[0], paymentAttemptId: attempt.id, orderId: attempt.orderId, idempotent: true };
    }

    await tx.$executeRaw`
      INSERT INTO "CustomerWalletBalance" ("customerId", "currency")
      VALUES (${attempt.customerId}, ${attempt.currency})
      ON CONFLICT ("customerId", "currency") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP
    `;

    const wallets = await tx.$queryRaw<WalletRow[]>`
      SELECT * FROM "CustomerWalletBalance"
      WHERE "customerId" = ${attempt.customerId} AND "currency" = ${attempt.currency}
      FOR UPDATE
    `;
    const wallet = wallets[0];
    if (!wallet) throw new Error('Wallet balance could not be created for refund.');

    const refundedAt = new Date().toISOString();
    const nextAvailable = wallet.availableBalanceCents + refundAmountCents;
    const nextLifetimeCredit = wallet.lifetimeCreditCents + refundAmountCents;
    const updatedWallets = await tx.$queryRaw<WalletRow[]>`
      UPDATE "CustomerWalletBalance"
      SET
        "availableBalanceCents" = ${nextAvailable},
        "lifetimeCreditCents" = ${nextLifetimeCredit},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${wallet.id}
      RETURNING *
    `;
    const updatedWallet = updatedWallets[0];
    if (!updatedWallet) throw new Error('Wallet refund balance update failed.');

    const refundMetadataJson = JSON.stringify({
      source: 'wallet_refund',
      paymentAttemptId: attempt.id,
      orderId: attempt.orderId,
      orderNumber: attempt.orderNumber,
      refundedAt
    });
    const refundEntries = await tx.$queryRaw<RefundLedgerRow[]>`
      INSERT INTO "CustomerWalletLedgerEntry" (
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
        "metadata"
      ) VALUES (
        ${updatedWallet.id},
        ${attempt.customerId},
        ${attempt.orderId},
        ${attempt.id},
        'refund_credit',
        'credit',
        'posted',
        ${refundAmountCents},
        ${attempt.currency},
        ${updatedWallet.availableBalanceCents},
        ${updatedWallet.reservedBalanceCents},
        ${refundIdempotencyKey},
        ${note ?? 'Refund credited to customer wallet.'},
        ${actorLabel},
        ${actorRole},
        ${refundMetadataJson}::jsonb
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
    const refundEntry = refundEntries[0];
    if (!refundEntry) throw new Error('Wallet refund ledger entry creation failed.');

    const nextRefundTotalCents = existingRefundTotal(metadata) + refundAmountCents;
    await tx.checkoutPaymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: nextRefundTotalCents >= attempt.amountCents ? 'refunded' : attempt.status,
        metadata: {
          ...metadata,
          walletRefundEntryId: refundEntry.id,
          walletRefundIdempotencyKey: refundIdempotencyKey,
          walletRefundedAt: refundedAt,
          walletRefundTotalCents: nextRefundTotalCents,
          walletRefundCurrency: attempt.currency
        }
      }
    });

    await tx.checkoutOrderTimelineEvent.create({
      data: {
        orderId: attempt.orderId,
        type: 'wallet_refund_credited',
        title: 'Refund credited to wallet',
        note: note ?? 'Refund was credited to the customer wallet.',
        actorLabel,
        actorRole,
        metadata: {
          paymentAttemptId: attempt.id,
          refundEntryId: refundEntry.id,
          amountCents: refundAmountCents,
          currency: attempt.currency,
          idempotencyKey: refundIdempotencyKey
        }
      }
    });

    return { wallet: updatedWallet, refundEntry, paymentAttemptId: attempt.id, orderId: attempt.orderId, idempotent: false };
  });
}
