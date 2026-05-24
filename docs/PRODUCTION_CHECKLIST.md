# Production launch checklist

This checklist turns the roadmap's remaining production blockers into explicit launch decisions. Use it before deploying Golara as a real storefront.

## 1. Environment and secrets

Required production variables:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `ADMIN_PASSWORD`: temporary password gate for the current admin CMS.
- `ADMIN_SESSION_SECRET`: long random secret for signing admin sessions.
- `ADMIN_LABEL`: temporary display label for password-backed admin audit logs.
- `ADMIN_EMAIL`: optional temporary admin email for audit attribution.
- `ADMIN_ROLE`: temporary admin role metadata, currently `owner` or `staff`.
- `MEDIA_STORAGE_PROVIDER`: currently `local`.
- `INQUIRY_NOTIFICATION_MODE`: `log` or `webhook`.
- `INQUIRY_NOTIFICATION_WEBHOOK_URL`: required when `INQUIRY_NOTIFICATION_MODE="webhook"`.
- `INQUIRY_NOTIFICATION_EMAIL`: future email destination/provider setting.
- `INQUIRY_NOTIFICATION_WHATSAPP`: future WhatsApp provider setting.

Rules:

- Never commit real `.env.local` or production secrets.
- Generate a new `ADMIN_SESSION_SECRET` per deployed environment.
- Treat the password gate as temporary until user-account auth is added.
- Treat webhook URLs as secrets if they include provider tokens or private routing keys.
- Use `ADMIN_ROLE="owner"` for full CMS administration and `ADMIN_ROLE="staff"` for inquiry operations only.

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

Webhook notification mode:

```bash
INQUIRY_NOTIFICATION_MODE="webhook"
INQUIRY_NOTIFICATION_WEBHOOK_URL="https://example.com/golara/inquiries"
```

Webhook payload shape:

```json
{
  "event": "golara.customer_inquiry.created",
  "inquiry": {
    "id": "...",
    "productTitle": "...",
    "customerName": "...",
    "customerPhone": "...",
    "customerEmail": "...",
    "message": "..."
  }
}
```

Before production launch:

- Decide whether staff will monitor `/admin` manually at first.
- Configure webhook delivery or add provider-specific email/WhatsApp delivery before relying on automated alerts.
- Confirm inquiry CSV export does not expose data to unauthenticated users.

## 5. Media and storage

Current behavior:

- External image URLs can be registered by owner role.
- `MEDIA_STORAGE_PROVIDER="local"` writes development uploads to `public/uploads` through `lib/media/media-storage.ts`.
- URL normalization, upload validation, and provider selection are isolated from admin CMS actions.
- Upload audit metadata records the selected storage provider.

Production decision required:

- Replace local uploads with object storage such as S3, Cloudinary, or Supabase Storage before deploying to serverless or multi-instance hosting.
- Keep media records as the CMS source of truth for product image selection.
- Wire the production provider behind the media-storage seam instead of expanding `/admin` actions.

## 6. Deployment preflight

Run these before merging a production release:

```bash
npm run check:file-lines
npm run typecheck
npm run build
```

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
- Media upload still writes local/dev files to `/uploads/...`.
- Logout returns admin to read-only/login flow.
- Signed-out admin preview does not load the audit-log panel.
- Webhook mode sends a test inquiry to the configured endpoint or safely falls back to server logs on failure.
- CMS and inquiry admin writes create audit-log rows with actor metadata.
- The admin audit-log panel shows and filters recent staff activity after writes.

## 7. Remaining production blockers

Do not consider Golara production-complete until these roadmap items are resolved:

- Replace password-only admin auth with account/provider auth.
- Implement a real object storage provider.
- Decide whether cart, checkout, payment, taxes, discounts, inventory, and delivery scheduling are needed for the first launch.
