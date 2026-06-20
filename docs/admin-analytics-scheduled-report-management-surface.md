# Admin analytics scheduled report management surface

Status: owner-facing surface live, runtime actions disabled.

The scheduled-report management page is available at `/admin/analytics/scheduled-reports` for admin sessions. It is a readiness surface only: it shows the gated controls and activation checklist, but it does not read scheduled-report rows, write approval metadata, start a scheduler, or run delivery.

## Live in this slice

- Owner-aware scheduled-report management route.
- Pure management-surface contract.
- Disabled control cards for listing schedules, dry-run evidence, owner approval, global disable state, schedule activation, and delivery.
- Nonbrowser guard proving the page has no form/action/method, no Prisma client construction, no repository read/write call, and no timer/scheduler call.

## Still disabled

- Scheduled-report read endpoint.
- Scheduled-report write endpoint.
- Repository read calls from the page.
- Repository write calls from the page.
- Dry-run evidence recording from the page.
- Owner approval recording from the page.
- Global disable state recording from the page.
- Scheduler/timer/background execution.
- Delivery execution.

## Activation prerequisites

Before any control becomes active, add separate reviewed slices for read-only repository access, recording endpoints, owner approval evidence, global disable state evidence, audit logging, scheduler controls, and delivery transport.
