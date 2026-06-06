export type Phase36SequenceMarker = {
  phase: 36;
  checkpoint: 'sequence-marker';
  completed: ['storage-boundary', 'read-contract', 'admin-visibility'];
  next: ['status-groups', 'model-alignment', 'read-adapter'];
};

export function buildPhase36SequenceMarker(): Phase36SequenceMarker {
  return {
    phase: 36,
    checkpoint: 'sequence-marker',
    completed: ['storage-boundary', 'read-contract', 'admin-visibility'],
    next: ['status-groups', 'model-alignment', 'read-adapter']
  };
}
