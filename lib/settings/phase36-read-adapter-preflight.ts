export type Phase36ReadAdapterPreflight = {
  phase: 36;
  slice: 'read-adapter-preflight';
  repositoryContractRequired: true;
  generatedClientRequired: true;
  adapterRuntimeEnabled: false;
  checkpoints: ['contract-present', 'client-validation-required', 'runtime-disabled'];
};

export function buildPhase36ReadAdapterPreflight(): Phase36ReadAdapterPreflight {
  return {
    phase: 36,
    slice: 'read-adapter-preflight',
    repositoryContractRequired: true,
    generatedClientRequired: true,
    adapterRuntimeEnabled: false,
    checkpoints: ['contract-present', 'client-validation-required', 'runtime-disabled']
  };
}
