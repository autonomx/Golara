# Golara final launch audit

Last updated: 2026-05-31
Launch path: inquiry-first production launch
Payment provider: deferred until explicit approval

## Launch decision

Golara is launch-ready for an inquiry-first storefront only after all automated gates pass and the manual operator checks below are completed in the target production environment.

Go conditions:

- CI is green on the release commit.
- Production deploy-readiness guard reports ready with production-like environment variables.
- Vercel production build wrapper is configured as the build command.
- Production media storage is configured with Cloudinary or another future production-safe provider behind the same seam.
- Admin password/session secret and role metadata are configured.
- Production data-safety confirmations are true only after migration, backup/restore, and rollback procedures are verified.
- Inquiry notification mode is explicitly chosen and understood by staff.
- Staff can create, find, assign, follow up, export, and print inquiries.

No-go conditions:

- Any required CI gate fails.
- `APP_MODE="production" npm run check:deploy-readiness` reports a blocker.
- Production media storage is local or otherwise not production-safe.
- `DATABASE_URL`, admin credentials, data-safety confirmations, or required notification config are missing.
- Staff do not have an operating routine for monitoring inquiries.
- Backup/restore or rollback path is unverified.

## Automated gate record

Required PR/release gates:

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

Production promotion guard:

```bash
APP_MODE="production" npm run check:deploy-readiness
```

Vercel production build command:

```bash
npm run build:vercel
```

The Vercel wrapper runs `npm run check:deploy-readiness` before `npm run build` for `APP_MODE="production"` or `VERCEL_ENV="production"`.

## Environment sign-off

Required production configuration:

- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `ADMIN_ROLE` set to `owner` or `staff`
- `PRODUCTION_MIGRATION_RUNBOOK_CONFIRMED=true`
- `PRODUCTION_BACKUP_RESTORE_CONFIRMED=true`
- `PRODUCTION_ROLLBACK_PLAN_CONFIRMED=true`
- `MEDIA_STORAGE_PROVIDER=cloudinary`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_UPLOAD_PRESET`
- `INQUIRY_NOTIFICATION_MODE=log` or `INQUIRY_NOTIFICATION_MODE=webhook`
- `INQUIRY_NOTIFICATION_WEBHOOK_URL` when webhook mode is selected

Optional but recommended:

- `ADMIN_LABEL`
- `ADMIN_EMAIL`
- `ADMIN_IDENTITY_PROVIDER`
- `CLOUDINARY_UPLOAD_FOLDER`

## Manual smoke audit

Public storefront:

1. Homepage loads.
2. Category pages load.
3. Product detail pages load.
4. Product inquiry form rejects invalid input.
5. Product inquiry form creates a valid inquiry.

Admin and inquiry operations:

1. `/admin/login` accepts the configured admin password.
2. `/admin` shows readiness, audit log, orders, inquiries, media, homepage, categories, and products after sign-in.
3. Staff role can update inquiry status, assignment, and follow-up notes.
4. Staff role is blocked from catalog, homepage, and media writes.
5. Owner role can perform catalog, homepage, media, and inquiry writes.
6. Owner can view staff access readiness and the access rotation/deactivation runbook.
7. Admin inquiry inbox shows the test inquiry.
8. Inquiry assignment to self works.
9. Inquiry assignment to staff/owner role queues works.
10. Inquiry unassignment works.
11. Follow-up timeline records status, assignment, and note changes.
12. Inquiry CSV export is inaccessible to unauthenticated users and works for authenticated staff/owner.
13. Inquiry print view is inaccessible to unauthenticated users and works for authenticated staff/owner.
14. Notification readiness card shows the expected mode, blockers/warnings, and retry runbook.

Media and readiness:

1. Admin readiness shows Cloudinary storage as ready in production.
2. Local media storage is blocked in production.
3. Media registration works for owner role.
4. Media upload returns a hosted URL when Cloudinary is configured.
5. Admin audit entries include actor label, role, email, type, and provider metadata.

Data safety:

1. Production backup is verified before schema changes.
2. Production migration runbook is reviewed.
3. Rollback path is verified with a last known-good git SHA and database restore process.
4. Release SHA, schema-change time, and operator are recorded.

## Deferred work that does not block inquiry-first launch

Payment provider implementation is deferred. Do not add payment capture, refunds, reconciliation, payment webhooks, or payment security scope until `docs/CHECKOUT_PAYMENT_DECISION.md` is updated with an approved provider, payment mode, and launch scope.

Full automated checkout/order-payment lifecycle is deferred. Existing order and checkout schema groundwork does not make online payment a launch requirement for the inquiry-first path.

Provider-backed per-user admin auth is deferred. Current runtime admin auth is password-gated with role/identity metadata and owner-visible account readiness inventory. This is acceptable for inquiry-first launch only if staff operating procedures and credential rotation are controlled.

Email and WhatsApp provider notifications are deferred. Current supported notification modes are log and webhook.

## Launch sign-off template

Use this template for the actual release note or deployment ticket:

```text
Release SHA:
Deployment environment:
Operator:
CI run URL:
Deploy-readiness output: ready / blocked
Vercel build command configured: yes / no
Database backup verified: yes / no
Migration runbook reviewed: yes / no
Rollback plan verified: yes / no
Media provider ready: yes / no
Notification mode verified: log / webhook
Manual smoke audit passed: yes / no
Deferred items accepted: yes / no
Go/no-go decision:
Notes:
```
