# Golara future work backlog

Last updated: 2026-05-31
Current baseline: inquiry-first production-readiness complete through Phase 30

## Purpose

This backlog captures non-blocking hardening work that can happen after the inquiry-first launch sign-off. These items are not repository blockers for the current launch path.

Before starting any item below, create a fresh branch, keep changes narrow, open one PR, wait for all CI gates, and merge only when green.

## Required release gates for future PRs

```bash
npm install
npm run check:file-lines
npm run check:runtime
npm run db:generate
npm run typecheck
npm run test:unit
npm run build
npm run smoke:routes:local
```

## Backlog item 1 — provider-backed per-user admin access

Status: deferred
Priority: recommended before broader staff scaling

Goal:

- Replace environment-wide password-gated runtime access with per-user admin identity lookup.

Potential scope:

- Login/session flow uses account-backed admin identity records.
- Role lookup comes from account records instead of only environment metadata.
- Owner can deactivate staff access through a controlled workflow.
- Audit logs continue to include actor label, role, email, type, and provider metadata.

Acceptance criteria:

- Existing owner/staff role boundaries are preserved.
- Deactivated accounts cannot perform admin writes.
- Staff identity remains stable for inquiry assignment and reports.

## Backlog item 2 — email and chat inquiry notification providers

Status: deferred
Priority: after current log/webhook mode is operationally validated

Goal:

- Add provider-backed customer inquiry alerts behind the existing notification seam.

Potential scope:

- Provider-specific readiness checks.
- Delivery result fields remain structured and testable.
- Failure fallback remains visible in readiness output.
- Retry or manual resend runbook is updated.

Acceptance criteria:

- Existing log and webhook modes continue to work.
- Provider failures do not block inquiry creation.
- Admin readiness shows provider blockers and warnings clearly.

## Backlog item 3 — launch telemetry and operational reporting

Status: optional post-launch hardening
Priority: after first real inquiry-first launch review

Goal:

- Improve operator visibility after production traffic starts.

Potential scope:

- Inquiry volume summary.
- Staff assignment and follow-up aging summary.
- Notification failure summary.
- Media readiness and storage usage summary.
- Exportable launch review report.

Acceptance criteria:

- Operators can identify stalled inquiries.
- Operators can identify notification or readiness issues without reading raw logs.
- Reports do not expose unauthenticated customer data.

## Backlog item 4 — formal database migrations

Status: optional hardening
Priority: before frequent production schema changes

Goal:

- Move from `db:push` deployment guidance to a formal migration procedure once the schema stabilizes.

Potential scope:

- Introduce migration-generation workflow.
- Document migration review and rollback expectations.
- Update deploy-readiness and launch docs as needed.

Acceptance criteria:

- Production schema changes are reviewed and repeatable.
- Backup/restore expectations from `docs/PRODUCTION_CHECKLIST.md` remain required.
- CI still runs Prisma generation and typecheck successfully.
