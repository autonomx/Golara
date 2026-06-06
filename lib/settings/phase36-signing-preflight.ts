export type Phase36SigningPreflight = {
  phase: 36;
  slice: 'signing-preflight';
  canonicalPayloadRequired: true;
  secretSourceRequired: true;
  signingRuntimeEnabled: false;
  checkpoints: ['canonical-payload-required', 'secret-source-required', 'runtime-disabled'];
};

export function buildPhase36SigningPreflight(): Phase36SigningPreflight {
  return {
    phase: 36,
    slice: 'signing-preflight',
    canonicalPayloadRequired: true,
    secretSourceRequired: true,
    signingRuntimeEnabled: false,
    checkpoints: ['canonical-payload-required', 'secret-source-required', 'runtime-disabled']
  };
}
