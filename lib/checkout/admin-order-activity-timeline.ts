import 'server-only';

export type AdminOrderActivityTimelineSource = 'staff' | 'system';

export type AdminOrderTimelineActor = {
  label: string | null;
  role: string | null;
};

export type AdminOrderTimelineEventLike = {
  id: string;
  type: string;
  title: string;
  note: string | null;
  actorLabel: string | null;
  actorRole: string | null;
  createdAt: Date;
};

export type AdminOrderActivityTimelineEntry = {
  id: string;
  type: string;
  title: string;
  note: string | null;
  actor: AdminOrderTimelineActor;
  source: AdminOrderActivityTimelineSource;
  attributionLabel: string;
  createdAt: Date;
};

function optionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized || null;
}

export function buildAdminOrderActivityAttribution(event: Pick<AdminOrderTimelineEventLike, 'actorLabel' | 'actorRole'>) {
  const label = optionalText(event.actorLabel);
  const role = optionalText(event.actorRole);
  const source: AdminOrderActivityTimelineSource = label || role ? 'staff' : 'system';

  if (source === 'system') {
    return {
      actor: { label: null, role: null },
      source,
      attributionLabel: 'System activity'
    };
  }

  return {
    actor: { label, role },
    source,
    attributionLabel: role ? `${label ?? 'Admin'} / ${role}` : (label ?? 'Admin')
  };
}

export function mapAdminOrderActivityTimeline(events: AdminOrderTimelineEventLike[]): AdminOrderActivityTimelineEntry[] {
  return events.map((event) => {
    const attribution = buildAdminOrderActivityAttribution(event);
    return {
      id: event.id,
      type: event.type,
      title: event.title,
      note: event.note,
      actor: attribution.actor,
      source: attribution.source,
      attributionLabel: attribution.attributionLabel,
      createdAt: event.createdAt
    };
  });
}
