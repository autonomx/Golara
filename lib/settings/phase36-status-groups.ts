export type Phase36StatusGroups = {
  phase: 36;
  initial: ['planned'];
  active: ['pending', 'retry_wait'];
  terminal: ['delivered', 'failed', 'dead_letter'];
  notes: ['classification-only'];
};

export function buildPhase36StatusGroups(): Phase36StatusGroups {
  return {
    phase: 36,
    initial: ['planned'],
    active: ['pending', 'retry_wait'],
    terminal: ['delivered', 'failed', 'dead_letter'],
    notes: ['classification-only']
  };
}
