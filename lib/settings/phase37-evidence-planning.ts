import { buildPhase37QaCoverageMap } from './phase37-qa-coverage-map';

export type Phase37EvidencePlanning = {
  phase: 37;
  slice: 'evidence-planning';
  coverageProofRequired: true;
  boundaryProofRequired: true;
  reviewProofRequired: true;
  runtimeEnabled: false;
  coverageCount: number;
};

export function buildPhase37EvidencePlanning(): Phase37EvidencePlanning {
  const map = buildPhase37QaCoverageMap();

  return {
    phase: 37,
    slice: 'evidence-planning',
    coverageProofRequired: true,
    boundaryProofRequired: true,
    reviewProofRequired: true,
    runtimeEnabled: map.runtimeEnabled,
    coverageCount: map.phase36CoverageCount
  };
}
