export const phase38Kickoff = {
  phase: 38,
  planning: true,
  runtime: false,
  storage: false,
  delivery: false,
  source: 'phase37',
} as const;

export function getPhase38Kickoff() {
  return phase38Kickoff;
}
