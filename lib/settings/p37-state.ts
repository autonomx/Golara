import { buildPhase37QaCoverageMap } from './phase37-qa-coverage-map';

export type P37State = {
  p: 37;
  ready: true;
  count: number;
  enabled: false;
};

export function p37State(): P37State {
  const map = buildPhase37QaCoverageMap();

  return {
    p: 37,
    ready: map.phase37Ready,
    count: map.phase36CoverageCount,
    enabled: map.runtimeEnabled
  };
}
