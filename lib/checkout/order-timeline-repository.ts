import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

export type CheckoutOrderTimelineEntry = {
  id: string;
  orderId: string;
  type: string;
  title: string;
  note?: string;
  actorLabel?: string;
  actorRole?: string;
  createdAt: Date;
};

export async function listOrderTimeline(orderId: string): Promise<CheckoutOrderTimelineEntry[]> {
  if (!hasDatabase()) return [];

  const events = await prisma.checkoutOrderTimelineEvent.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' }
  });

  return events.map((event) => ({
    id: event.id,
    orderId: event.orderId,
    type: event.type,
    title: event.title,
    note: event.note ?? undefined,
    actorLabel: event.actorLabel ?? undefined,
    actorRole: event.actorRole ?? undefined,
    createdAt: event.createdAt
  }));
}
