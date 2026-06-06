export type Phase36RouteCorePreflight = {
  phase: 36;
  slice: 'route-core-preflight';
  readAdapterRequired: true;
  routeRuntimeEnabled: false;
  checkpoints: ['adapter-required', 'read-only-contract', 'runtime-disabled'];
};

export function buildPhase36RouteCorePreflight(): Phase36RouteCorePreflight {
  return {
    phase: 36,
    slice: 'route-core-preflight',
    readAdapterRequired: true,
    routeRuntimeEnabled: false,
    checkpoints: ['adapter-required', 'read-only-contract', 'runtime-disabled']
  };
}
