import 'server-only';

export type AdminOrderActivityTimelineSource = 'staff' | 'system';
export type AdminOrderReversalKind = 'refund' | 'void' | 'cancellation' | 'adjustment';
export type AdminOrderReversalStatus = 'pending' | 'recorded' | 'completed';

export type AdminOrderTimelineActor = {
  label: string | null;
  role: string | null;
};

export type AdminOrderReversalStatusSummary = {
  kind: AdminOrderReversalKind;
  status: AdminOrderReversalStatus;
  label: string;
};

export type AdminOrderTimelineEventLike = {
  id: string;
  type: string;
  title: string;
  note: string | null;
  actorLabel: string | null;
  actorRole: string | null;
  metadata?: unknown | null;
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
  reversal: AdminOrderReversalStatusSummary | null;
  createdAt: Date;
};

function optionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized || null;
}

function metadataObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function textMetadataValue(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

function compactReversalLabel(kind: AdminOrderReversalKind, status: AdminOrderReversalStatus) {
  const kindLabel = kind === 'void' ? 'void' : kind;
  return `${kindLabel} ${status}`;
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

export function buildAdminOrderReversalStatusSummary(event: Pick<AdminOrderTimelineEventLike, 'type' | 'title' | 'metadata'>): AdminOrderReversalStatusSummary | null {
  const metadata = metadataObject(event.metadata);
  const rawEvidence = [
    event.type,
    event.title,
    textMetadataValue(metadata.operation),
    textMetadataValue(metadata.manualTransferRefundOperation),
    textMetadataValue(metadata.installmentReversalOperation),
    textMetadataValue(metadata.codAdjustmentOperation),
    textMetadataValue(metadata.to),
    textMetadataValue(metadata.nextPlanStatus),
    textMetadataValue(metadata.codAdjustmentStatus)
  ].filter(Boolean).join(' ').toLowerCase();

  if (!/(refund|refunded|void|cancel|cancelled|cancellation|adjust|adjustment)/.test(rawEvidence)) return null;

  const kind: AdminOrderReversalKind = rawEvidence.includes('void')
    ? 'void'
    : rawEvidence.includes('cancel')
      ? 'cancellation'
      : rawEvidence.includes('adjust')
        ? 'adjustment'
        : 'refund';

  const status: AdminOrderReversalStatus = rawEvidence.includes('pending') || rawEvidence.includes('requested')
    ? 'pending'
    : rawEvidence.includes('completed') || rawEvidence.includes('refunded') || rawEvidence.includes('cancelled')
      ? 'completed'
      : 'recorded';

  return {
    kind,
    status,
    label: compactReversalLabel(kind, status)
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
      reversal: buildAdminOrderReversalStatusSummary(event),
      createdAt: event.createdAt
    };
  });
}
