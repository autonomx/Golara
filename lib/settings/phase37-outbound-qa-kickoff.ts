import { buildPhase36PreflightHandoff } from './phase36-preflight-handoff';
import { buildPhase36PreflightSummary } from './phase36-preflight-summary';

export type Phase37OutboundQaKickoff = {
  phase: 37;
  slice: 'outbound-qa-kickoff';
  phase36CoverageCount: number;
  phase36RuntimeEnabled: false;
  qaReady: true;
};

export function buildPhase37OutboundQaKickoff(): Phase37OutboundQaKickoff {
  const summary = buildPhase36PreflightSummary();
  const handoff = buildPhase36PreflightHandoff();

  return {
    phase: 37,
    slice: 'outbound-qa-kickoff',
    phase36CoverageCount: summary.coverageCount,
    phase36RuntimeEnabled: handoff.runtimeEnabled,
    qaReady: true
  };
}
