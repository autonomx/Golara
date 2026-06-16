import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';
import type { InstallmentReceivableScheduleEntryInput } from '@/lib/checkout/payment-method-settlement-summary';

function isMissingInstallmentTable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    (message.includes('InstallmentPaymentScheduleEntry') || message.includes('InstallmentPaymentPlan')) &&
    (message.includes('does not exist') || message.includes('42P01'))
  );
}

export async function listInstallmentReceivableScheduleEntries(limit = 500): Promise<InstallmentReceivableScheduleEntryInput[]> {
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
