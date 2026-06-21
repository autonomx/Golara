import 'server-only';

import type { Prisma } from '@prisma/client';
import { confirmOrderFulfillmentCapacityReservation } from '@/lib/checkout/fulfillment-capacity-service';
import { commitOrderInventoryReservations } from '@/lib/inventory/inventory-reservation-service';
import { hasDatabase, prisma } from '@/lib/prisma';

export type CustomerWalletCheckoutCaptureInput = {
  paymentAttemptId: string;
  actorLabel?: string;
  actorRole?: string;
  note?: string;
  idempotencyKey?: string | null;
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

type LedgerRow = {
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

type PaymentAttemptRow = {
  id: string;
  orderId: string;
  amountCents: number;
  currency: string;
  status: string;
  metadata: Prisma.JsonValue | null;
  customerId: string | null;
  orderNumber: string;
};

function normalizeText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || undefined;
}

function normalizePaymentAttemptId(value: string) {
  const normalized = normalizeText(value);
  if (!normalized) throw new Error('Payment attempt id is required for wallet checkout capture.');
  return normalized;
}

function normalizeNote(value?: string) {
  return normalizeText(value)?.slice(0, 1000);
}

function normalizeActorLabel(value?: string) {
  return normalizeText(value)?.slice(0, 120) ?? 'Wallet checkout';
}

function normalizeActorRole(value?: string) {
  return normalizeText(value)?.slice(0, 80) ?? 'system';
}

function metadataRecord(value: Prisma.JsonValue | null | undefined): Prisma.JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Prisma.JsonObject;
}

function metadataText(value: Prisma.JsonValue | undefined) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

function isWalletPaymentMetadata(metadata: Prisma.JsonObject) {
  return metadataText(metadata.paymentMethodType) === 'wallet' || metadataText(metadata.paymentMethodKey) === 'wallet-credit';
}

export async function captureCustomerWalletCheckoutPayment(input: CustomerWalletCheckoutCaptureInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for wallet checkout capture.');

  const paymentAttemptId = normalizePaymentAttemptId(input.paymentAttemptId);
  const actorLabel = normalizeActorLabel(input.actorLabel);
  const actorRole = normalizeActorRole(input.actorRole);
  const note = normalizeNote(input.note);

  const result = await prisma.$transaction(async (tx) => {
    const attempts = await tx.$queryRaw<PaymentAttemptRow[]>`
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
    if (!attempt.customerId) throw new Error('Wallet checkout requires a customer profile on the order.');
    if (attempt.amountCents <= 0) throw new Error('Wallet checkout amount must be greater than zero.');

    const metadata = metadataRecord(attempt.metadata);
    if (!isWalletPaymentMetadata(metadata)) throw new Error('Only wallet payment attempts can be captured by the customer wallet ledger.');

    const reservationIdempotencyKey = `wallet:checkout_reservation:${attempt.id}`;
    const captureIdempotencyKey = normalizeText(input.idempotencyKey) ?? `wallet:checkout_capture:${attempt.id}`;

    const existingCaptures = await tx.$queryRaw<LedgerRow[]>`
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
      WHERE "idempotencyKey" = ${captureIdempotencyKey}
      LIMIT 1
    `;
    if (existingCaptures[0]) {
      const wallets = await tx.$queryRaw<WalletRow[]>`
        SELECT * FROM "CustomerWalletBalance" WHERE "id" = ${existingCaptures[0].walletId} LIMIT 1
      `;
      if (!wallets[0]) throw new Error('Wallet balance missing for idempotent checkout capture.');
      await tx.checkoutPaymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'paid',
          providerReference: `wallet:${existingCaptures[0].id}`,
          metadata: {
            ...metadata,
            walletCaptureEntryId: existingCaptures[0].id,
            walletCaptureIdempotencyKey: captureIdempotencyKey,
            walletCapturedAt: new Date().toISOString()
          }
        }
      });
      return { wallet: wallets[0], reservationEntry: existingCaptures[0], captureEntry: existingCaptures[0], orderId: attempt.orderId, paymentAttemptId: attempt.id };
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
    if (!wallet) throw new Error('Wallet balance could not be created for checkout capture.');
    if (wallet.availableBalanceCents < attempt.amountCents) throw new Error('Wallet balance is insufficient for checkout capture.');

    const reservedWallets = await tx.$queryRaw<WalletRow[]>`
      UPDATE "CustomerWalletBalance"
      SET
        "availableBalanceCents" = ${wallet.availableBalanceCents - attempt.amountCents},
        "reservedBalanceCents" = ${wallet.reservedBalanceCents + attempt.amountCents},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${wallet.id}
      RETURNING *
    `;
    const reservedWallet = reservedWallets[0];
    if (!reservedWallet) throw new Error('Wallet reservation update failed.');

    const reservationMetadataJson = JSON.stringify({
      source: 'checkout_wallet_reservation',
      paymentAttemptId: attempt.id,
      orderId: attempt.orderId,
      orderNumber: attempt.orderNumber
    });
    const reservationEntries = await tx.$queryRaw<LedgerRow[]>`
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
        ${reservedWallet.id},
        ${attempt.customerId},
        ${attempt.orderId},
        ${attempt.id},
        'checkout_reservation',
        'reserve',
        'reserved',
        ${attempt.amountCents},
        ${attempt.currency},
        ${reservedWallet.availableBalanceCents},
        ${reservedWallet.reservedBalanceCents},
        ${reservationIdempotencyKey},
        ${note ?? 'Wallet balance reserved for checkout.'},
        ${actorLabel},
        ${actorRole},
        ${reservationMetadataJson}::jsonb
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
    const reservationEntry = reservationEntries[0];
    if (!reservationEntry) throw new Error('Wallet reservation ledger entry creation failed.');

    const capturedWallets = await tx.$queryRaw<WalletRow[]>`
      UPDATE "CustomerWalletBalance"
      SET
        "reservedBalanceCents" = ${reservedWallet.reservedBalanceCents - attempt.amountCents},
        "lifetimeDebitCents" = ${reservedWallet.lifetimeDebitCents + attempt.amountCents},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${reservedWallet.id}
      RETURNING *
    `;
    const capturedWallet = capturedWallets[0];
    if (!capturedWallet) throw new Error('Wallet capture update failed.');

    const captureMetadataJson = JSON.stringify({
      source: 'checkout_wallet_capture',
      paymentAttemptId: attempt.id,
      orderId: attempt.orderId,
      orderNumber: attempt.orderNumber,
      reservationEntryId: reservationEntry.id
    });
    const captureEntries = await tx.$queryRaw<LedgerRow[]>`
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
        ${capturedWallet.id},
        ${attempt.customerId},
        ${attempt.orderId},
        ${attempt.id},
        'checkout_capture',
        'capture',
        'captured',
        ${attempt.amountCents},
        ${attempt.currency},
        ${capturedWallet.availableBalanceCents},
        ${capturedWallet.reservedBalanceCents},
        ${captureIdempotencyKey},
        ${note ?? 'Wallet balance captured for checkout.'},
        ${actorLabel},
        ${actorRole},
        ${captureMetadataJson}::jsonb
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
    const captureEntry = captureEntries[0];
    if (!captureEntry) throw new Error('Wallet capture ledger entry creation failed.');

    const capturedAt = new Date().toISOString();
    await tx.checkoutPaymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'paid',
        providerReference: `wallet:${captureEntry.id}`,
        metadata: {
          ...metadata,
          walletReservationEntryId: reservationEntry.id,
          walletCaptureEntryId: captureEntry.id,
          walletCaptureIdempotencyKey: captureIdempotencyKey,
          walletCapturedAt: capturedAt,
          walletCapturedAmountCents: attempt.amountCents,
          walletCapturedCurrency: attempt.currency
        }
      }
    });

    await tx.checkoutOrderTimelineEvent.create({
      data: {
        orderId: attempt.orderId,
        type: 'wallet_payment_captured',
        title: 'Wallet payment captured',
        note: note ?? 'Wallet balance captured during checkout.',
        actorLabel,
        actorRole,
        metadata: {
          paymentAttemptId: attempt.id,
          reservationEntryId: reservationEntry.id,
          captureEntryId: captureEntry.id,
          amountCents: attempt.amountCents,
          currency: attempt.currency
        }
      }
    });

    return { wallet: capturedWallet, reservationEntry, captureEntry, orderId: attempt.orderId, paymentAttemptId: attempt.id };
  });

  await confirmOrderFulfillmentCapacityReservation(result.orderId);
  await commitOrderInventoryReservations(result.orderId);

  return result;
}
