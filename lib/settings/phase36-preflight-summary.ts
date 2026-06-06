import { buildPhase36AdminReadonlyPreflight } from './phase36-admin-readonly-preflight';
import { buildPhase36ModelAlignmentPreflight } from './phase36-model-alignment-preflight';
import { buildPhase36ReadAdapterPreflight } from './phase36-read-adapter-preflight';
import { buildPhase36RecoveryPreflight } from './phase36-recovery-preflight';
import { buildPhase36RouteCorePreflight } from './phase36-route-core-preflight';
import { buildPhase36SigningPreflight } from './phase36-signing-preflight';
import { buildPhase36VisibilityPreflight } from './phase36-visibility-preflight';

export type Phase36PreflightSummary = {
  phase: 36;
  slices: string[];
  runtimeEnabled: false;
  coverageCount: number;
};

export function buildPhase36PreflightSummary(): Phase36PreflightSummary {
  const slices = [
    buildPhase36ModelAlignmentPreflight().slice,
    buildPhase36ReadAdapterPreflight().slice,
    buildPhase36VisibilityPreflight().slice,
    buildPhase36RouteCorePreflight().slice,
    buildPhase36AdminReadonlyPreflight().slice,
    buildPhase36SigningPreflight().slice,
    buildPhase36RecoveryPreflight().slice
  ];

  return {
    phase: 36,
    slices,
    runtimeEnabled: false,
    coverageCount: slices.length
  };
}
