# Admin analytics scheduled report management surface

Status: owner-facing surface live, read preview runtime-gated, write actions disabled.

The scheduled-report management page is available at `/admin/analytics/scheduled-reports` for admin sessions. It now shows a read-preview panel backed by an owner-only GET route at `/admin/analytics/scheduled-reports/read`.

The read path remains runtime-gated. It only attaches the generated Prisma delegate when all explicit scheduled-report read flags are enabled and owner authentication succeeds. By default, the page and endpoint return a locked empty preview with gate blockers.

## Live in this slice

- Owner-aware scheduled-report management route.
- Owner-only scheduled-report GET route.
- Page-level read preview panel.
- Runtime flag helper for read endpoint, reader factory, generated-client runtime access, repository reads, kill-switch evidence, owner-approval evidence, and dry-run evidence.
- Dynamic delegate attachment only after the read flags pass.
- Nonbrowser guard proving the route is GET-only and write-free.

## Still disabled

- Scheduled-report write endpoint.
- Repository writes from the page or endpoint.
- Dry-run evidence recording from the page.
- Owner approval recording from the page.
- Global disable state recording from the page.
- Scheduler/timer/background execution.
- Delivery execution.

## Runtime flags required for a non-empty read preview

- `ADMIN_ANALYTICS_SCHEDULED_REPORT_READ_ENDPOINT_ENABLED=true`
- `ADMIN_ANALYTICS_SCHEDULED_REPORT_READER_FACTORY_RUNTIME_ENABLED=true`
- `ADMIN_ANALYTICS_SCHEDULED_REPORT_GENERATED_CLIENT_RUNTIME_ACCESS_ENABLED=true`
- `ADMIN_ANALYTICS_SCHEDULED_REPORT_REPOSITORY_READS_ENABLED=true`
- `ADMIN_ANALYTICS_SCHEDULED_REPORT_GLOBAL_KILL_SWITCH_VALIDATED=true`
- `ADMIN_ANALYTICS_SCHEDULED_REPORT_OWNER_APPROVAL_POLICY_VALIDATED=true`
- `ADMIN_ANALYTICS_SCHEDULED_REPORT_DRY_RUN_EVIDENCE_VALIDATED=true`

## Activation prerequisites

Before any write control becomes active, add separate reviewed slices for recording endpoints, owner approval evidence, global disable state evidence, audit logging, scheduler controls, and delivery transport.
