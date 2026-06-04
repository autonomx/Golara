export type AdminStatusSummaryInput = {
  title: string;
  ready: boolean;
  summary: string;
  rows: Array<{
    label: string;
    value: string;
  }>;
  notes?: string[];
};

export type AdminStatusSummaryTone = 'ready' | 'blocked';

export type AdminStatusSummaryView = {
  title: string;
  tone: AdminStatusSummaryTone;
  summary: string;
  rows: Array<{
    label: string;
    value: string;
  }>;
  notes: string[];
};

export function buildAdminStatusSummaryView(input: AdminStatusSummaryInput): AdminStatusSummaryView {
  return {
    title: input.title,
    tone: input.ready ? 'ready' : 'blocked',
    summary: input.summary,
    rows: input.rows,
    notes: input.notes ?? []
  };
}
