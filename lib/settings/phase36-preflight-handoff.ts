import { buildPhase36PreflightSummary } from './phase36-preflight-summary';

export type Phase36PreflightHandoff = {
  phase: 36;
  status: 'handoff-ready';
  runtimeEnabled: false;
  completedPrRange: '326-340';
  summaryCoverageCount: number;
};

export function buildPhase36PreflightHandoff(): Phase36PreflightHandoff {
  const summary = buildPhase36PreflightSummary();

  return {
    phase: 36,
    status: 'handoff-ready',
    runtimeEnabled: false,
    completedPrRange: '326-340',
    summaryCoverageCount: summary.coverageCount
  };
}
