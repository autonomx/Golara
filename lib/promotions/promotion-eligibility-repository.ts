import 'server-only';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { hasDatabase, prisma } from '@/lib/prisma';

export const PROMOTION_ELIGIBILITY_TARGET_TYPES = ['product', 'category', 'customer'] as const;
export const PROMOTION_ELIGIBILITY_EFFECTS = ['include', 'exclude'] as const;

export type PromotionEligibilityTargetType = (typeof PROMOTION_ELIGIBILITY_TARGET_TYPES)[number];
export type PromotionEligibilityEffect = (typeof PROMOTION_ELIGIBILITY_EFFECTS)[number];

export type PromotionEligibilityRuleInput = {
  promotionDiscountId?: string | null;
  promotionVoucherId?: string | null;
  targetType: string;
  targetId: string;
  effect?: string | null;
};

export type PromotionEligibilityRuleRecord = {
  id: string;
  promotionDiscountId: string | null;
  promotionVoucherId: string | null;
  targetType: PromotionEligibilityTargetType;
  targetId: string;
  effect: PromotionEligibilityEffect;
  createdAt: Date;
  updatedAt: Date;
};

export type PromotionEligibilityContext = {
  productIds?: string[];
  categoryIds?: string[];
  customerId?: string | null;
};

function optionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized || null;
}

export function assertPromotionEligibilityTargetType(value: string): PromotionEligibilityTargetType {
  const normalized = optionalText(value)?.toLowerCase();
  if (PROMOTION_ELIGIBILITY_TARGET_TYPES.includes(normalized as PromotionEligibilityTargetType)) {
    return normalized as PromotionEligibilityTargetType;
  }
  throw new Error(`Unsupported promotion eligibility target type: ${value}`);
}

export function assertPromotionEligibilityEffect(value?: string | null): PromotionEligibilityEffect {
  const normalized = optionalText(value)?.toLowerCase() ?? 'include';
  if (PROMOTION_ELIGIBILITY_EFFECTS.includes(normalized as PromotionEligibilityEffect)) {
    return normalized as PromotionEligibilityEffect;
  }
  throw new Error(`Unsupported promotion eligibility effect: ${value}`);
}

export function normalizePromotionEligibilityRuleInput(input: PromotionEligibilityRuleInput) {
  const promotionDiscountId = optionalText(input.promotionDiscountId);
  const promotionVoucherId = optionalText(input.promotionVoucherId);
  const targetId = optionalText(input.targetId);
  if (!promotionDiscountId && !promotionVoucherId) throw new Error('Promotion eligibility rule requires a discount or voucher id.');
  if (promotionDiscountId && promotionVoucherId) throw new Error('Promotion eligibility rule can target only one discount or voucher.');
  if (!targetId) throw new Error('Promotion eligibility target id is required.');

  return {
    promotionDiscountId,
    promotionVoucherId,
    targetType: assertPromotionEligibilityTargetType(input.targetType),
    targetId,
    effect: assertPromotionEligibilityEffect(input.effect)
  };
}

function contextTargetsForType(context: PromotionEligibilityContext, targetType: PromotionEligibilityTargetType) {
  if (targetType === 'product') return new Set(context.productIds ?? []);
  if (targetType === 'category') return new Set(context.categoryIds ?? []);
  return new Set(context.customerId ? [context.customerId] : []);
}

export function isPromotionEligibleForContext(rules: PromotionEligibilityRuleRecord[], context: PromotionEligibilityContext) {
  if (rules.length === 0) return true;

  const excluded = rules.some((rule) => rule.effect === 'exclude' && contextTargetsForType(context, rule.targetType).has(rule.targetId));
  if (excluded) return false;

  const includeRules = rules.filter((rule) => rule.effect === 'include');
  if (includeRules.length === 0) return true;

  return includeRules.some((rule) => contextTargetsForType(context, rule.targetType).has(rule.targetId));
}

export async function listPromotionEligibilityRulesForDiscount(promotionDiscountId: string): Promise<PromotionEligibilityRuleRecord[]> {
  if (!hasDatabase()) return [];
  const normalizedId = optionalText(promotionDiscountId);
  if (!normalizedId) return [];

  return prisma.$queryRaw<PromotionEligibilityRuleRecord[]>`
    SELECT
      "id",
      "promotionDiscountId",
      "promotionVoucherId",
      "targetType",
      "targetId",
      "effect",
      "createdAt",
      "updatedAt"
    FROM "PromotionEligibilityRule"
    WHERE "promotionDiscountId" = ${normalizedId}
    ORDER BY "createdAt" ASC
  `;
}

export async function listPromotionEligibilityRulesForVoucher(promotionVoucherId: string): Promise<PromotionEligibilityRuleRecord[]> {
  if (!hasDatabase()) return [];
  const normalizedId = optionalText(promotionVoucherId);
  if (!normalizedId) return [];

  return prisma.$queryRaw<PromotionEligibilityRuleRecord[]>`
    SELECT
      "id",
      "promotionDiscountId",
      "promotionVoucherId",
      "targetType",
      "targetId",
      "effect",
      "createdAt",
      "updatedAt"
    FROM "PromotionEligibilityRule"
    WHERE "promotionVoucherId" = ${normalizedId}
    ORDER BY "createdAt" ASC
  `;
}

export async function createPromotionEligibilityRule(input: PromotionEligibilityRuleInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const rule = normalizePromotionEligibilityRuleInput(input);
  const id = randomUUID();
  const metadata = {
    targetType: rule.targetType,
    targetId: rule.targetId,
    effect: rule.effect,
    source: 'admin'
  };

  const inserted = await prisma.$queryRaw<PromotionEligibilityRuleRecord[]>`
    INSERT INTO "PromotionEligibilityRule" (
      "id",
      "promotionDiscountId",
      "promotionVoucherId",
      "targetType",
      "targetId",
      "effect",
      "metadata"
    ) VALUES (
      ${id},
      ${rule.promotionDiscountId},
      ${rule.promotionVoucherId},
      ${rule.targetType},
      ${rule.targetId},
      ${rule.effect},
      ${JSON.stringify(metadata)}::jsonb
    )
    RETURNING
      "id",
      "promotionDiscountId",
      "promotionVoucherId",
      "targetType",
      "targetId",
      "effect",
      "createdAt",
      "updatedAt"
  `;

  await prisma.adminAuditLog.create({
    data: {
      action: 'promotion.eligibility.create',
      entity: 'promotionEligibilityRule',
      entityId: id,
      summary: `Created promotion eligibility ${rule.effect} rule for ${rule.targetType} ${rule.targetId}`,
      metadata: metadata as Prisma.InputJsonObject
    }
  });

  return inserted[0];
}
