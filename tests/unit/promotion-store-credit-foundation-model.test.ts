import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPromotionStoreCreditFoundationModelTests() {
  const migration = source('prisma/migrations/20260602190000_add_store_credit_foundation/migration.sql');
  const repository = source('lib/promotions/promotion-store-credit-repository.ts');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "PromotionStoreCredit"/);
  assert.match(migration, /"code" TEXT NOT NULL/);
  assert.match(migration, /"customerId" TEXT/);
  assert.match(migration, /"currency" TEXT NOT NULL DEFAULT 'TOMAN'/);
  assert.match(migration, /"initialBalanceCents" INTEGER NOT NULL/);
  assert.match(migration, /"balanceCents" INTEGER NOT NULL/);
  assert.match(migration, /"status" TEXT NOT NULL DEFAULT 'draft'/);
  assert.match(migration, /"expiresAt" TIMESTAMP\(3\)/);
  assert.match(migration, /"metadata" JSONB NOT NULL DEFAULT '\{\}'::jsonb/);
  assert.match(migration, /"PromotionStoreCredit_initial_balance_nonnegative_chk"/);
  assert.match(migration, /"PromotionStoreCredit_balance_nonnegative_chk"/);
  assert.match(migration, /"PromotionStoreCredit_balance_not_above_initial_chk"/);
  assert.match(migration, /"PromotionStoreCredit_code_key"/);
  assert.match(migration, /"PromotionStoreCredit_customer_idx"/);
  assert.match(migration, /"PromotionStoreCredit_status_active_idx"/);
  assert.match(migration, /"PromotionStoreCredit_balance_idx"/);
  assert.match(migration, /"PromotionStoreCredit_expiry_idx"/);

  assert.match(repository, /export const PROMOTION_STORE_CREDIT_STATUSES/);
  assert.match(repository, /'draft', 'active', 'paused', 'depleted', 'expired', 'archived'/);
  assert.match(repository, /export type PromotionStoreCreditInput/);
  assert.match(repository, /export type PromotionStoreCreditRecord/);
  assert.match(repository, /export type PromotionStoreCreditRedemption/);
  assert.match(repository, /export function normalizePromotionStoreCreditCode/);
  assert.match(repository, /export function assertPromotionStoreCreditCode/);
  assert.match(repository, /export function assertPromotionStoreCreditStatus/);
  assert.match(repository, /export function normalizePromotionStoreCreditBalance/);
  assert.match(repository, /Promotion store credit balance cannot be negative/);
  assert.match(repository, /export function normalizePromotionStoreCreditCurrency/);
  assert.match(repository, /export function normalizePromotionStoreCreditExpiry/);
  assert.match(repository, /export function normalizePromotionStoreCreditInput/);
  assert.match(repository, /const balanceCents = Math\.min\(initialBalanceCents, requestedBalance\)/);
  assert.match(repository, /export function isPromotionStoreCreditActive/);
  assert.match(repository, /credit\.status === 'active'/);
  assert.match(repository, /normalizePromotionStoreCreditBalance\(credit\.balanceCents\) > 0/);
  assert.match(repository, /!credit\.expiresAt \|\| credit\.expiresAt\.getTime\(\) >= now\.getTime\(\)/);
  assert.match(repository, /export function calculatePromotionStoreCreditRedemption/);
  assert.match(repository, /appliedCreditCents: Math\.min\(balance, subtotal\)|const appliedCreditCents = Math\.min\(balance, subtotal\)/);
  assert.match(repository, /export async function listPromotionStoreCredits/);
  assert.match(repository, /export async function findPromotionStoreCreditByCode/);
  assert.match(repository, /export async function createPromotionStoreCredit/);
  assert.match(repository, /INSERT INTO "PromotionStoreCredit"/);
  assert.match(repository, /RETURNING\s+"id"/);
  assert.match(repository, /promotion\.store_credit\.create/);

  console.log('promotion-store-credit-foundation-model.test.ts passed');
}
