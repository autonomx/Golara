import { buildPhase37OutboundQaKickoff } from './phase37-outbound-qa-kickoff';

export type Phase37QaCoverageMap = {
  phase: 37;
  slice: 'qa-coverage-map';
  phase36CoverageCount: number;
  phase37Ready: true;
  evidencePacketPlanned: true;
  runtimeEnabled: false;
};

export function buildPhase37QaCoverageMap(): Phase37QaCoverageMap {
  const kickoff = buildPhase37OutboundQaKickoff();

  return {
    phase: 37,
    slice: 'qa-coverage-map',
    phase36CoverageCount: kickoff.phase36CoverageCount,
    phase37Ready: kickoff.qaReady,
    evidencePacketPlanned: true,
    runtimeEnabled: kickoff.phase36RuntimeEnabled
  };
}
