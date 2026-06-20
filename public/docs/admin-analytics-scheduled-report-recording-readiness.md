# Admin analytics scheduled report recording readiness

This runbook covers the scheduled-report recording-readiness contract for dry-run evidence, owner approval, and global disable state.

## Current scope

The contract is documentation and validation only. It defines future recording targets and gates, but it does not enable any repository write, route, management UI, scheduler, timer, background worker, or delivery execution.

The current contract covers:

- dry-run evidence recording readiness for `lastDryRunAt` and `lastDryRunSummary`
- owner approval recording readiness for `ownerApproved` and approval metadata
- global disable state recording readiness for `isActive`, `deliveryEnabled`, and disable metadata
- owner-role evidence requirements
- selected range and CSV preview evidence requirements
- global disable validation requirements
- delivery-disabled confirmation requirements
- rollback and audit destination requirements

## Disabled by default

These fields must remain false until a later audited implementation slice explicitly enables them:

- `dryRunEvidenceRecordingEnabled`
- `ownerApprovalRecordingEnabled`
- `globalDisableStateRecordingEnabled`
- `repositoryWritesEnabled`
- `writeEndpointEnabled`
- `managementUiEnabled`
- `schedulerEnabled`
- `deliveryExecutionEnabled`
- `ownerOverrideEnabled`

## Validation checklist

For each validation pass, confirm:

- the recording-readiness contract is present
- dry-run evidence recording is ready but disabled
- owner approval recording is ready but disabled
- global disable state recording is ready but disabled
- each recording target has explicit evidence fields
- each recording target requires owner-role confirmation
- each recording target requires global disable validation
- delivery execution remains disabled
- repository writes remain disabled
- no write endpoint exists
- no management UI path exists
- no scheduler, timer, or background worker path exists

## Future implementation requirements

Before enabling recording, add a separate audited slice for each path:

1. dry-run evidence persistence
2. owner approval persistence
3. global disable state persistence

Each implementation slice must keep delivery execution disabled until delivery-specific activation is separately reviewed.
