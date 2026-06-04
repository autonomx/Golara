# Production launch checklist

This checklist turns the roadmap's remaining production blockers into explicit launch decisions. Use it before deploying Golara as a real storefront.

For the Phase 3 completion summary, see `docs/PHASE_3_CLOSEOUT.md`.
For the checkout and payment decision record, see `docs/CHECKOUT_PAYMENT_DECISION.md`.
For the final release sign-off artifact, see `docs/LAUNCH_AUDIT.md`.
For production gateway checkout launch steps, see `docs/production-payment-gateway-launch-checklist.md`.

## 1. Environment and secrets

Required production variables:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `ADMIN_PASSWORD`: temporary password gate for the current admin CMS.
- `ADMIN_SESSION_SECRET`: long random secret for signing admin sessions.
- `ADMIN_LABEL`: display label for password-backed admin audit logs.
- `ADMIN_EMAIL`: optional admin email for audit attribution and inquiry assignment matching.
- `ADMIN_ROLE`: password-backed admin role metadata, currently `owner` or `staff`.
- `ADMIN_IDENTITY_PROVIDER`: currently normalizes to `password`; reserved for future provider-backed admin auth.
- `PRODUCTION_MIGRATION_RUNBOOK_CONFIRMED`: set to `true` only after reviewing the migration runbook below.
- `PRODUCTION_BACKUP_RESTORE_CONFIRMED`: set to `true` only after verifying a restorable production database backup process.
- `PRODUCTION_ROLLBACK_PLAN_CONFIRMED`: set to `true` only after confirming the last-known-good deploy and database restore path.
- `MEDIA_STORAGE_PROVIDER`: production should use `cloudinary`; unset, `local`, or unsupported values fall back to local filesystem uploads.
- `CLOUDINARY_CLOUD_NAME`: required when `MEDIA_STORAGE_PROVIDER="cloudinary"`.
- `CLOUDINARY_UPLOAD_PRESET`: required when `MEDIA_STORAGE_PROVIDER="cloudinary"`.
- `CLOUDINARY_UPLOAD_FOLDER`: optional Cloudinary upload folder, defaults to `golara`.
- `INQUIRY_NOTIFICATION_MODE`: `log` or `webhook`.
- `INQUIRY_NOTIFICATION_WEBHOOK_URL`: required when `INQUIRY_NOTIFICATION_MODE="webhook"`.
- `INQUIRY_NOTIFICATION_EMAIL`: placeholder for a future email provider integration; currently not used for delivery.
- `INQUIRY_NOTIFICATION_WHATSAPP`: placeholder for a future WhatsApp provider integration; currently not used for delivery.

Additional variables before enabling `CHECKOUT_MODE="gateway"`:

- Provider credentials for every enabled gateway provider.
- Provider webhook signing/HMAC secrets for every enabled provider.
- `PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED`: set to `true` only after verifying the Phase 32 settlement reconciliation migration in the target database.
- `PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED`: set to `true` only after running the Phase 32 provider smoke-test runbook against the target provider dashboards.

Rules:

- Never commit real `.env.local` or production secrets.
- Generate a new `ADMIN_SESSION_SECRET` per deployed environment.
- Treat the password gate as temporary until account/provider auth is wired to the admin login flow.
- Treat webhook URLs as secrets if they include provider tokens or private routing keys.
- Treat provider webhook signing secrets and payment gateway credentials as production secrets.
- Use `ADMIN_ROLE="owner"` for full CMS administration and `ADMIN_ROLE="staff"` for inquiry operations only.
- Do not launch production with local media storage. Local uploads are not durable on serverless or multi-instance hosting.
- Do not set production data-safety confirmation flags to `true` until the corresponding runbook step has been reviewed and verified.
- Do not set Phase 32 payment confirmation flags to `true` until the target migration and provider smoke tests have actually been completed.

## 2. Database setup and data safety

Current production target:

- PostgreSQL.
- Prisma schema deployed with `npm run db:push` until migrations are formalized.
- Seed data loaded with `npm run db:seed` only for first setup or demo resets.
- Admin audit logs are stored in `AdminAuditLog` and require the latest Prisma schema to be pushed.
- Admin account readiness reads `AdminAccount` when database records are present, with environment-configured admin identity as fallback.
- Audit rows include actor label, email, role, and provider metadata from the current admin identity seam.
- Payment settlement reconciliation uses the Phase 32 migration-backed `PaymentSettlementReconciliation` table for durable gateway settlement records.

Preflight:

```bash
npm install
npm run db:generate
npm run typecheck
npm run test:unit
npm run build
```

Production migration runbook:

1. Confirm the target git SHA and deployment environment.
2. Verify production `DATABASE_URL` points at the intended PostgreSQL database.
3. Verify a restorable backup exists before applying schema changes.
4. Run `npm run db:generate` after dependency install.
5. Apply schema changes with production `DATABASE_URL` using `npm run db:push` until formal migrations replace this process.
6. Apply and verify explicit migration files required by the launch scope, including the Phase 32 payment settlement reconciliation migration before gateway checkout.
7. Deploy the matching git SHA.
8. Smoke-test public product pages, inquiry creation, admin inquiry list, assignment, export, print, notification readiness, and any enabled payment gateway paths.
9. Record the deployed SHA, schema-change time, and operator who performed the change.

Backup and restore expectation:

- Take or verify a provider-level PostgreSQL backup immediately before production schema changes.
- Confirm the backup can be restored to a separate database or restore target before relying on it.
- Keep the backup retention window long enough to cover launch verification and early customer inquiry review.
- Treat customer inquiries, admin audit logs, assignment history, follow-ups, uploaded media records, checkout orders, payment attempts, payment events, and settlement reconciliation rows as production data.

Rollback plan:

1. Stop new production writes if a deploy or schema change corrupts production behavior.
2. Redeploy the last known-good git SHA.
3. Restore the verified production database backup if schema/data rollback is required.
4. Re-run `npm run check:deploy-readiness` with production-like env vars.
5. Smoke-test inquiry creation, admin list, assignment, export, print, notification path, and any enabled payment gateway path before reopening operations.

Database bootstrap for first setup or demo reset only:

```bash
npm run db:push
npm run db:seed
```

## 3. Admin CMS readiness

Before launch, verify:

- `/admin/login` accepts the configured admin password.
- `/admin` shows editable homepage, categories, media, products, inquiries, orders, recent audit log, and owner-only staff readiness after sign-in.
- CMS writes are blocked when logged out.
- Audit logs are hidden when logged out.
- Public pages revalidate after CMS edits.
- Staff have a documented process for reviewing new inquiries.
- Admin writes create `AdminAuditLog` rows for CMS and inquiry mutations.
- Audit-log filters work for action, entity, actor, and free-text search.
- Staff role can update inquiries, follow-ups, and inquiry assignments but cannot mutate catalog, homepage, or media records.
- Owner role can perform both CMS and inquiry operations.
- Owner can review active/inactive admin accounts, assignment keys, missing emails, and the access rotation/deactivation runbook.
- Unit tests cover the staff/owner role matrix and action-file role boundaries.

Current admin-auth state:

- Admin auth is still password-only at runtime.
- Password-backed identity metadata is configured through environment variables.
- `lib/admin-auth-core.ts` owns the pure auth config, role, session-value, and identity helpers.
- `lib/admin-auth.ts` remains the server-only cookie/env wrapper used by admin actions.
- `AdminAccount` exists as schema groundwork and as a production readiness inventory for visible staff access.
- `AdminAccount` is not yet wired into login, session issuance, or role lookup.
- `ADMIN_IDENTITY_PROVIDER` currently normalizes to `password`; external/admin account providers are not active yet.

Temporary limitations:

- Password-backed role metadata is environment-wide, not per-user.
- Account rows do not yet grant or deny admin access.
- Admin account readiness is owner-visible inventory and runbook guidance, not a credential-management backend.
- There is no provider-backed admin login flow yet.
- Password-backed identity metadata is configurable, not a replacement for real account/provider auth.

Staff access rotation/deactivation runbook:

1. Create or rotate staff access through the configured admin identity provider and keep `providerAccountId` stable.
2. Set `email` whenever possible so inquiry assignment can match staff identities across sessions, exports, print views, and reports.
3. Deactivate access by setting `AdminAccount.isActive=false` or removing the credential from the provider, then verify the account is no longer active before launch.
4. Keep at least one active owner account available before disabling or rotating any owner credential.

## 4. Inquiry operations

Current behavior:

- Product detail pages create customer inquiries.
- Admin can filter, search, paginate, print, export, update status, assign ownership, add staff notes, and append follow-ups.
- Notifications support log-only mode and generic webhook mode.
- Notification delivery returns structured results with status, mode, channel, inquiry ID, fallback flag, webhook status, error code, and detail.
- Inquiry status changes, follow-up notes, and assignment changes are recorded in the admin audit log.
- Staff and owner roles can perform inquiry write actions.

Log-only notification mode:

```bash
INQUIRY_NOTIFICATION_MODE="log"
```

Use log-only mode when staff will manually monitor `/admin` and server logs during early production or private launch. This mode is production-allowed, but `npm run check:deploy-readiness` reports it as a warning because no automatic external alert is delivered. Staff must have a documented operating routine for checking the admin inquiry inbox, assigning follow-up, and exporting inquiry data when needed.

Webhook notification mode:

```bash
INQUIRY_NOTIFICATION_MODE="webhook"
INQUIRY_NOTIFICATION_WEBHOOK_URL="https://example.invalid/golara/inquiries"
```

Use webhook mode when an external automation service, internal endpoint, CRM bridge, email relay, chat workflow, or similar receiver should be notified whenever a new customer inquiry is created. Production readiness blocks webhook mode until `INQUIRY_NOTIFICATION_WEBHOOK_URL` is configured. The webhook URL should be treated as a secret when it contains tokens, signatures, or private routing identifiers.

The webhook request currently posts JSON with this shape:

```json
{
  "event": "golara.customer_inquiry.created",
  "inquiry": {
    "id": "inquiry-id",
    "productTitle": "Product title",
    "customerName": "Customer name",
    "customerPhone": "customer phone",
    "customerEmail": "Customer email",
    "message": "Customer inquiry message"
  }
}
```

Webhook failure behavior:

- Missing webhook URL in webhook mode logs `notification_webhook_url_missing` and falls back to the structured log notification path.
- Non-2xx webhook responses log `notification_webhook_non_success`, the response status, and fall back to the structured log notification path.
- Network or fetch errors log `notification_webhook_error` and fall back to the structured log notification path.
- Unsupported notification modes log `notification_mode_unsupported` and fall back to the structured log notification path.
- Delivery failures do not block inquiry creation; staff still need to monitor `/admin` as the source of truth.

Notification retry runbook:

1. Confirm the admin inquiry inbox contains the customer inquiry before retrying any external delivery.
2. Review the production readiness card for notification blockers, warnings, and the current retry runbook.
3. Use inquiry export or print view to manually resend inquiry details to staff or the external workflow owner.
4. Fix webhook receiver configuration or mode selection, then submit a test inquiry and verify a 2xx webhook response.

Future provider placeholders:

```bash
INQUIRY_NOTIFICATION_EMAIL="staff inbox placeholder"
INQUIRY_NOTIFICATION_WHATSAPP="staff WhatsApp placeholder"
```

These variables are reserved for future email or WhatsApp provider implementations. Setting them today does not send email or WhatsApp messages. Do not rely on them for production alerting until a provider-specific service boundary and readiness check are implemented.

Before production launch:

- Decide whether staff will monitor `/admin` manually at first.
- Use `INQUIRY_NOTIFICATION_MODE="log"` only when manual monitoring is operationally acceptable.
- Configure webhook delivery before relying on automated alerts.
- Send a test inquiry and verify the admin inbox receives it.
- In webhook mode, verify the receiver accepts the test payload and returns a 2xx response.
- Confirm inquiry CSV export does not expose data to unauthenticated users.

## 5. Media and storage

Current behavior:

- External image URLs can be registered by owner role.
- `MEDIA_STORAGE_PROVIDER="local"` or unset writes development uploads to `public/uploads` through `lib/media/media-storage.ts`.
- Unsupported `MEDIA_STORAGE_PROVIDER` values fall back to local storage and emit a warning.
- `MEDIA_STORAGE_PROVIDER="cloudinary"` uploads through Cloudinary unsigned upload presets.
- Cloudinary readiness is incomplete until both `CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_UPLOAD_PRESET` are configured.
- URL normalization, upload validation, readiness checks, and provider selection are isolated from admin CMS actions.
- Uploaded media records preserve provider, URL, MIME type, size, and original filename metadata.
- Upload audit metadata records the selected storage provider.

Production decision required:

- Configure Cloudinary for production uploads, or defer a different provider such as S3/Supabase to Phase 4+.
- Treat local uploads as development-only. They are not durable on serverless or multi-instance hosting and are blocked by the deploy readiness guard in production mode.
- Keep media records as the CMS source of truth for product image selection.
- Wire any future production provider behind the media-storage seam instead of expanding `/admin` actions.

Cloudinary production env example:

```bash
MEDIA_STORAGE_PROVIDER="cloudinary"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_UPLOAD_PRESET="your-unsigned-upload-preset"
CLOUDINARY_UPLOAD_FOLDER="golara"
```

## 6. Checkout and payment direction

Current decision:

- Golara remains inquiry-first unless the production launch scope explicitly enables gateway checkout.
- Inquiry-first launch remains available without completing live gateway provider validation.
- Live Stripe/ZarinPal checkout, webhook, settlement, and admin visibility foundations now exist for the full-commerce path.
- Full gateway checkout still requires provider dashboard validation, target-database settlement migration verification, and the production gateway launch checklist.

Gateway checkout launch checklist:

- Use `docs/production-payment-gateway-launch-checklist.md` before enabling `CHECKOUT_MODE="gateway"`.
- Use `docs/production-roadmap-phase32-payment-webhook-smoke-tests.md` for provider-generated webhook validation.
- Use `docs/production-roadmap-phase32-payment-webhook-validation-evidence.md` to record operator evidence before confirming gateway smoke tests.
- Use `docs/production-roadmap-phase32-settlement-migration-contract.md` before confirming the settlement migration flag.
- Verify `/admin/payments/settlement` shows durable settlement records after provider events arrive.
- Verify `/admin/payments/alerts` shows expected failed/missing/stale/mismatch alert states.
- Do not manually mark orders paid unless the provider dashboard confirms payment capture/settlement.
- Roll back to `CHECKOUT_MODE="inquiry"` or `CHECKOUT_MODE="assisted"` if gateway validation fails.

Gateway deploy-readiness confirmations:

```bash
PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED="true"
PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED="true"
```

Set these only after completing the corresponding target-environment checks. They are not required for inquiry-first launch.

## 7. Deployment preflight and final launch audit

Run these before merging a production release:

```bash
npm run check:file-lines
npm run typecheck
npm run test:unit
npm run build
```

Run the production deploy guard with production-like environment variables before promoting a real deployment:

```bash
APP_MODE="production" npm run check:deploy-readiness
```

For Vercel, set the project build command to:

```bash
npm run build:vercel
```

`build:vercel` runs `npm run check:deploy-readiness` before `npm run build` only when `APP_MODE="production"` or `VERCEL_ENV="production"`. Preview deployments skip the production guard and still run the normal Next.js build.

The deploy readiness guard blocks production mode when any required production dependency is missing or unsafe:

- `DATABASE_URL` must be configured.
- `ADMIN_PASSWORD` must be configured.
- `ADMIN_SESSION_SECRET` must be configured and at least 32 characters long.
- `ADMIN_ROLE`, when set, must be `owner` or `staff`.
- Production migration runbook confirmation must be set with `PRODUCTION_MIGRATION_RUNBOOK_CONFIRMED=true`.
- Production backup/restore confirmation must be set with `PRODUCTION_BACKUP_RESTORE_CONFIRMED=true`.
- Production rollback confirmation must be set with `PRODUCTION_ROLLBACK_PLAN_CONFIRMED=true`.
- Media storage must be production-safe, currently configured Cloudinary.
- `INQUIRY_NOTIFICATION_MODE="webhook"` requires `INQUIRY_NOTIFICATION_WEBHOOK_URL`.
- Unsupported notification modes are blocked.
- Production gateway mode is blocked until enabled provider webhook secrets are configured.
- Production gateway mode is blocked until `PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED=true`.
- Production gateway mode is blocked until `PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED=true`.

Release sign-off:

- Complete `docs/LAUNCH_AUDIT.md` with the deployed git SHA and production URL.
- Record who verified admin login, CMS edits, inquiry flow, notification path, media upload behavior, checkout/payment mode, and rollback plan.
- Attach or link evidence from the preflight commands and production smoke tests.
- If gateway checkout is in scope, attach or link provider dashboard smoke-test evidence, settlement migration verification, admin settlement/alert review, and the completed gateway launch checklist.
- If gateway checkout is in scope, capture evidence in `docs/production-roadmap-phase32-payment-webhook-validation-evidence.md` before setting Phase 32 gateway confirmation flags.
- Keep inquiry-first launch sign-off separate from full gateway checkout sign-off when gateway validation remains pending.

## Current known limitations

- Admin authentication is password-backed only and not per-user at runtime.
- Uploaded media must use Cloudinary or another durable provider before production; local filesystem storage is development-only.
- Inquiry notifications are log/webhook only; email, SMS, and WhatsApp provider variables are placeholders until Phase 34.
- Gateway checkout remains disabled unless the production launch scope explicitly enables `CHECKOUT_MODE="gateway"` and completes provider dashboard validation, settlement migration verification, and launch checklist evidence.
- Tax, shipping, inventory reservation, refunds/voids, real notification providers, durable outbound webhook workers, provider-backed per-user admin auth, and full checkout/order/fulfillment QA remain roadmap work.
