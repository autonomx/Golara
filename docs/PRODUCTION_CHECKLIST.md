# Production launch checklist

This checklist turns the roadmap's remaining production blockers into explicit launch decisions. Use it before deploying Golara as a real storefront.

For the Phase 3 completion summary, see `docs/PHASE_3_CLOSEOUT.md`.

## 1. Environment and secrets

Required production variables:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `ADMIN_PASSWORD`: temporary password gate for the current admin CMS.
- `ADMIN_SESSION_SECRET`: long random secret for signing admin sessions.
- `ADMIN_LABEL`: temporary display label for password-backed admin audit logs.
- `ADMIN_EMAIL`: optional temporary admin email for audit attribution.
- `ADMIN_ROLE`: temporary admin role metadata, currently `owner` or `staff`.
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
- Treat the password gate as temporary until user-account auth is added in Phase 4.
- Treat webhook URLs as secrets if they include provider tokens or private routing keys.
- Use `ADMIN_ROLE="owner"` for full CMS administration and `ADMIN_ROLE="staff"` for inquiry operations only.
- Do not launch production with local media storage. Local uploads are not durable on serverless or multi-instance hosting.

## 2. Database setup

Current production target:

- PostgreSQL.
- Prisma schema deployed with `npm run db:push` until migrations are formalized.
- Seed data loaded with `npm run db:seed` only for first setup or demo resets.
- Admin audit logs are stored in `AdminAuditLog` and require the latest Prisma schema to be pushed.
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
- `/admin` shows editable homepage, categories, media, products, inquiries, and the recent audit log after sign-in.
- CMS writes are blocked when logged out.
- Audit logs are hidden when logged out.
- Public pages revalidate after CMS edits.
- Staff have a documented process for reviewing new inquiries.
- Admin writes create `AdminAuditLog` rows for CMS and inquiry mutations.
- Audit-log filters work for action, entity, actor, and free-text search.
- Staff role can update inquiries and follow-ups but cannot mutate catalog, homepage, or media records.
- Owner role can perform both CMS and inquiry operations.

Temporary limitations:

- Admin auth is password-only.
- Password-backed role metadata is environment-wide, not per-user.
- Password-backed identity metadata is configurable, not a replacement for real account/provider auth.

## 4. Inquiry operations

Current behavior:

- Product detail pages create customer inquiries.
- Admin can filter, search, paginate, print, export, update status, add staff notes, and append follow-ups.
- Notifications support log-only mode and generic webhook mode.
- Inquiry status changes and follow-up notes are recorded in the admin audit log.
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

- Missing webhook URL in webhook mode logs a warning and falls back to the server log notification path.
- Non-2xx webhook responses log the response status and fall back to the server log notification path.
- Network or fetch errors log the error and fall back to the server log notification path.
- Delivery failures do not block inquiry creation; staff still need to monitor `/admin` as the source of truth.

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

## 6. Deployment preflight

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
- Product/category/homepage edits show on public pages for owner role.
- Media registration works for owner role.
- Staff role can update inquiry status and follow-up notes.
- Staff role is blocked from catalog/homepage/media writes.
- Media upload writes local/dev files to `/uploads/...` when configured for `local`.
- Media upload returns a hosted URL when configured for `cloudinary`.
- Admin readiness shows local media storage as a warning outside production and blocked in production.
- Admin readiness shows incomplete Cloudinary configuration as blocked in production.
- Admin readiness shows configured Cloudinary storage as ready.
- Logout returns admin to read-only/login flow.
- Signed-out admin preview does not load the audit-log panel.
- Log notification mode records a test inquiry to server logs and requires manual staff monitoring.
- Webhook mode sends a test inquiry to the configured endpoint or safely falls back to server logs on failure.
- CMS and inquiry admin writes create audit-log rows with actor metadata.
- The admin audit-log panel shows and filters recent staff activity after writes.

## 7. Deferred to Phase 4

These are intentionally not blockers for Phase 3 foundation completion:

- Replace password-only admin auth with account/provider auth.
- Add real per-user admin accounts and multi-user role management.
- Add customer accounts.
- Decide whether cart, checkout, payments, taxes, discounts, inventory, and delivery scheduling are needed for the first launch.
- Add optional storage providers beyond Cloudinary.
