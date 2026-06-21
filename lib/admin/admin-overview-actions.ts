import type { AdminTodayCard, AdminTodaySeverity } from '@/lib/admin/admin-today-cards';

export type AdminOverviewActionGroup = {
  id: string;
  title: string;
  description: string;
  cards: AdminTodayCard[];
};

const severityRank: Record<AdminTodaySeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  success: 3
};

export function sortAdminActionCards(cards: AdminTodayCard[]) {
  return [...cards].sort((left, right) => severityRank[left.severity] - severityRank[right.severity] || right.count - left.count || left.label.localeCompare(right.label));
}

export function buildAdminOverviewActionGroups(cards: AdminTodayCard[]): AdminOverviewActionGroup[] {
  const sorted = sortAdminActionCards(cards);
  const critical = sorted.filter((card) => card.severity === 'critical');
  const warning = sorted.filter((card) => card.severity === 'warning');
  const info = sorted.filter((card) => card.severity === 'info');
  const success = sorted.filter((card) => card.severity === 'success');

  const groups: AdminOverviewActionGroup[] = [];
  if (critical.length > 0) {
    groups.push({
      id: 'immediate',
      title: 'Immediate action',
      description: 'Resolve blockers and payment risks before routine work.',
      cards: critical
    });
  }
  if (warning.length > 0) {
    groups.push({
      id: 'next',
      title: 'Next best work',
      description: 'Operational queues that should be handled during the current shift.',
      cards: warning
    });
  }
  if (info.length > 0) {
    groups.push({
      id: 'monitor',
      title: 'Monitor and clean up',
      description: 'Useful follow-up items that improve catalog and admin health.',
      cards: info
    });
  }
  if (groups.length === 0 && success.length > 0) {
    groups.push({
      id: 'clear',
      title: 'All clear',
      description: 'No urgent queues are currently visible from the admin overview.',
      cards: success
    });
  }

  return groups;
}

export function primaryAdminOverviewAction(cards: AdminTodayCard[]) {
  return sortAdminActionCards(cards)[0];
}
