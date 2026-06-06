export type Phase36VisibilityPreflight = {
  phase: 36;
  slice: 'visibility-preflight';
  readAdapterRequired: true;
  displayOnly: true;
  operatorActionsEnabled: false;
  checkpoints: ['adapter-required', 'display-only', 'operator-actions-disabled'];
};

export function buildPhase36VisibilityPreflight(): Phase36VisibilityPreflight {
  return {
    phase: 36,
    slice: 'visibility-preflight',
    readAdapterRequired: true,
    displayOnly: true,
    operatorActionsEnabled: false,
    checkpoints: ['adapter-required', 'display-only', 'operator-actions-disabled']
  };
}
