import 'server-only';

import { Prisma } from '@prisma/client';
import { hasDatabase, prisma } from '@/lib/prisma';

export type CustomerInstallmentScheduleEntryStatus = {
  id: string;
  planId: string;
  sequence: number;
  status: string;
  dueAt: Date;
  totalCents: number;
};

export type CustomerInstallmentScheduleStatus = {
  id: string;
  orderId: string;
  paymentAttemptId: string;
  status: string;
  currency: string;
  principalCents: number;
  downPaymentCents: number;
  financedAmountCents: number;
  termMonths: number;
  installmentCount: number;
  firstDueAt: Date;
  entries: CustomerInstallmentScheduleEntryStatus[];
};

type PlanRow = Omit<CustomerInstallmentScheduleStatus, 'entries'>;
type EntryRow = CustomerInstallmentScheduleEntryStatus;

export async function listCustomerInstallmentScheduleStatuses(customerId: string): Promise<CustomerInstallmentScheduleStatus[]> {
  if (!hasDatabase()) return [];

  const plans = await prisma.$queryRaw<PlanRow[]>`
    SELECT
      "id", "orderId", "paymentAttemptId", "status", "currency", "principalCents",
      "downPaymentCents", "financedAmountCents", "termMonths", "installmentCount", "firstDueAt"
    FROM "InstallmentPaymentPlan"
    WHERE "customerId" = ${customerId}
    ORDER BY "createdAt" DESC
  `;
  if (plans.length === 0) return [];

  const planIds = plans.map((plan) => plan.id);
  const entries = await prisma.$queryRaw<EntryRow[]>(Prisma.sql`
    SELECT "id", "planId", "sequence", "status", "dueAt", "totalCents"
    FROM "InstallmentPaymentScheduleEntry"
    WHERE "planId" IN (${Prisma.join(planIds)})
    ORDER BY "planId" ASC, "sequence" ASC
  `);

  const entriesByPlan = new Map<string, EntryRow[]>();
  for (const entry of entries) {
    const current = entriesByPlan.get(entry.planId) ?? [];
    current.push(entry);
    entriesByPlan.set(entry.planId, current);
  }

  return plans.map((plan) => ({
    ...plan,
    entries: entriesByPlan.get(plan.id) ?? []
  }));
}
