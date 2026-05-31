# Production launch checklist

This checklist turns the roadmap's remaining production blockers into explicit launch decisions. Use it before deploying Golara as a real storefront.

For the Phase 3 completion summary, see `docs/PHASE_3_CLOSEOUT.md`.
For the checkout and payment decision record, see `docs/CHECKOUT_PAYMENT_DECISION.md`.

## 1. Environment and secrets

Required production variables:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `ADMIN_PASSWORD`: temporary password gate for the current admin CMS.
- `ADMIN_SESSION_SECRET`: long random secret for signing admin sessions.
- `ADMIN_LABEL`: display label for password-backed admin audit logs.
- `ADMIN_EMAIL`: optional admin email for audit attribution and inquiry assignment matching.
- `ADMIN_ROLE`: password-backed admin role metadata, currently `owner` or `staff`.
- `ADMIN_IDENTITY_PROVIDER`: currently normalizes to `password`; reserved for future provider-backed admin auth.
- `MEDIA_STORAGE_PROVIDER`: production should use `cloudinary`; unset, `local`, or unsupported values fall back to local filesystem uploads.
- `CLOUDINARY_CLOUD_NAME`: required when `MEDIA_STORAGE_PROVIDER="cloudinary"`.
- `CLOUDINARY_UPLOAD_PRESET`: required when `MEDIA_STORAGE_PROVIDER="cloudinary"`.
- `CLOUDINARY_UPLOAD_FOLDER`: optional Cloudinary upload folder, defaults to `golara`.
- `INQUIRY_NOTIFICATION_MODE`: `log` or `webhook`.
- `INQUIRY_NOTIFICATION_WEBHOOK_URL`: required when `INQUIRY_NOTIFICATION_MODE="webhook"`.
- `INQUIRY_NOTIFICATION_EMAIL`: placeholder for a future email provider integration; currently not used for delivery.
- `INQUIRY_NOTIFICATION_WHATSAPP`: placeholder for a future WhatsApp provider integration; currently not used for delivery.

Rules:

- Never commit real `.env.local` or production secrets.
- Generate a new `ADMIN_SESSION_SECRET` per deployed environment.
- Treat the password gate as temporary until account/provider auth is wired to the admin login flow.
- Treat webhook URLs as secrets if they include provider tokens or private routing keys.
- Use `ADMIN_ROLE="owner"` for full CMS administration and `ADMIN_ROLE="staff"` for inquiry operations only.
- Do not launch production with local media storage. Local uploads are not durable on serverless or multi-instance hosting.

## 2. Database setup

Current production target:

- PostgreSQL.
- Prisma schema deployed with `npm run db:push` until migrations are formalized.
- Seed data loaded with `npm run db:seed` only for first setup or demo resets.
- Admin audit logs are stored in `AdminAuditLog` and require the latest Prisma schema to be pushed.
- Admin account readiness reads `AdminAccount` when database records are present, with environment-configured admin identity as fallback.
- Audit rows include actor label, email, role, and provider metadata from the current admin identity seam.

Preflight:

```bash
npm install
npm run db:generate
npm run typecheck
npm run build
```

Database bootstrap:

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
    "customerEmail": "customer email",
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

- Golara remains inquiry-first for the current production-readiness pass.
- Checkout and online payment implementation are deferred until explicitly selected.
- Existing checkout-related schema groundwork does not mean payment provider code is approved.
- No payment provider code should be added until `docs/CHECKOUT_PAYMENT_DECISION.md` is updated with an approved provider, payment mode, and launch scope.

## 7. Deployment preflight

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
- Media storage must be production-safe, currently configured Cloudinary.
- `INQUIRY_NOTIFICATION_MODE="webhook"` requires `INQUIRY_NOTIFICATION_WEBHOOK_URL`.
- Unsupported notification modes are blocked.

`INQUIRY_NOTIFICATION_MODE="log"` is allowed but reported as a warning because staff must monitor the admin inbox manually.

Manual smoke test:

- Homepage loads with database content.
- Category pages load.
- Product detail pages load.
- Inquiry form rejects invalid input.
- Inquiry form creates a record.
- Admin inquiry inbox shows the new record.
- Admin readiness shows notification blockers, warnings, and retry runbook guidance.
- Product/category/homepage edits show on public pages for owner role.
- Media registration works for owner role.
- Staff role can update inquiry status, assignment, and follow-up notes.
- Staff role is blocked from catalog/homepage/media writes.
- Owner role can perform catalog/homepage/media writes and inquiry writes.
- Owner role can view staff account readiness and access rotation/deactivation guidance.
- Admin audit entries include actor label, role, email, type, and provider metadata.
- Media upload writes local/dev files to `/uploads/...` when configured for `local`.
- Media upload returns a hosted URL when configured for `cloudinary`.
- Admin readiness shows local media storage as a warning outside production and blocked in production.
- Admin readiness shows incomplete Cloudinary configuration as blocked in production.
- Admin readiness shows configured Cloudinary storage as ready.
- Logout returns admin to read-only/login flow.
