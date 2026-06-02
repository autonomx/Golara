import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPromotionAuditLogsModelTests() {
  const schema = source('prisma/schema.prisma');
  const adminAudit = source('lib/admin-audit-log.ts');
  const auditRepository = source('lib/promotions/promotion-audit-log-repository.ts');
  const discountRepository = source('lib/promotions/promotion-discount-repository.ts');
  const voucherRepository = source('lib/promotions/promotion-voucher-repository.ts');
  const eligibilityRepository = source('lib/promotions/promotion-eligibility-repository.ts');
  const storeCreditRepository = source('lib/promotions/promotion-store-credit-repository.ts');

  assert.match(schema, /model AdminAuditLog \{/);
  assert.match(schema, /action\s+String/);
  assert.match(schema, /entity\s+String/);
  assert.match(schema, /entityId\s+String\?/);
  assert.match(schema, /summary\s+String/);
  assert.match(schema, /metadata\s+Json\?/);
  assert.match(schema, /@@index\(\[entity, entityId\]\)/);
  assert.match(schema, /@@index\(\[action, createdAt\]\)/);

  assert.match(adminAudit, /export async function recordAdminAuditLog/);
  assert.match(adminAudit, /await prisma\.adminAuditLog\.create/);
  assert.match(adminAudit, /actorLabel: actor\.label/);
  assert.match(adminAudit, /actorEmail: actor\.email/);
  assert.match(adminAudit, /actorRole: actor\.role/);

  assert.match(auditRepository, /export const PROMOTION_AUDIT_ACTIONS/);
  assert.match(auditRepository, /'promotion\.discount\.create'/);
  assert.match(auditRepository, /'promotion\.voucher\.create'/);
  assert.match(auditRepository, /'promotion\.eligibility\.create'/);
  assert.match(auditRepository, /'promotion\.store_credit\.create'/);
  assert.match(auditRepository, /export const PROMOTION_AUDIT_ENTITIES/);
  assert.match(auditRepository, /'promotionDiscount'/);
  assert.match(auditRepository, /'promotionVoucher'/);
  assert.match(auditRepository, /'promotionEligibilityRule'/);
  assert.match(auditRepository, /'promotionStoreCredit'/);
  assert.match(auditRepository, /export function assertPromotionAuditAction/);
  assert.match(auditRepository, /export function assertPromotionAuditEntity/);
  assert.match(auditRepository, /export function normalizePromotionAuditLogLimit/);
  assert.match(auditRepository, /Math\.max\(1, Math\.min\(100, normalized\)\)/);
  assert.match(auditRepository, /export function normalizePromotionAuditLogInput/);
  assert.match(auditRepository, /Promotion audit summary is required/);
  assert.match(auditRepository, /export function buildPromotionAuditLogWhere/);
  assert.match(auditRepository, /action: \{ in: \[\.\.\.PROMOTION_AUDIT_ACTIONS\] \}/);
  assert.match(auditRepository, /summary: \{ contains: search, mode: 'insensitive' \}/);
  assert.match(auditRepository, /export async function recordPromotionAuditLog/);
  assert.match(auditRepository, /await recordAdminAuditLog/);
  assert.match(auditRepository, /export async function listPromotionAuditLogs/);
  assert.match(auditRepository, /prisma\.adminAuditLog\.findMany/);
  assert.match(auditRepository, /where: buildPromotionAuditLogWhere\(filters\)/);
  assert.match(auditRepository, /orderBy: \{ createdAt: 'desc' \}/);
  assert.match(auditRepository, /take: safeLimit/);
  assert.match(auditRepository, /export async function listPromotionAuditLogsForEntity/);
  assert.match(auditRepository, /export async function listPromotionAuditLogsForAction/);

  assert.match(discountRepository, /action: 'promotion\.discount\.create'/);
  assert.match(discountRepository, /entity: 'promotionDiscount'/);
  assert.match(voucherRepository, /action: 'promotion\.voucher\.create'/);
  assert.match(voucherRepository, /entity: 'promotionVoucher'/);
  assert.match(eligibilityRepository, /action: 'promotion\.eligibility\.create'/);
  assert.match(eligibilityRepository, /entity: 'promotionEligibilityRule'/);
  assert.match(storeCreditRepository, /action: 'promotion\.store_credit\.create'/);
  assert.match(storeCreditRepository, /entity: 'promotionStoreCredit'/);

  console.log('promotion-audit-logs-model.test.ts passed');
}
