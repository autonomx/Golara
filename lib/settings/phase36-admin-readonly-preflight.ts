export type Phase36AdminReadonlyPreflight = {
  phase: 36;
  slice: 'admin-readonly-preflight';
  routeCoreRequired: true;
  displayOnly: true;
  actionRuntimeEnabled: false;
  checkpoints: ['route-core-required', 'display-only', 'actions-disabled'];
};

export function buildPhase36AdminReadonlyPreflight(): Phase36AdminReadonlyPreflight {
  return {
    phase: 36,
    slice: 'admin-readonly-preflight',
    routeCoreRequired: true,
    displayOnly: true,
    actionRuntimeEnabled: false,
    checkpoints: ['route-core-required', 'display-only', 'actions-disabled']
  };
}
