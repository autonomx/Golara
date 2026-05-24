# Production launch checklist

This checklist turns the roadmap's remaining production blockers into explicit launch decisions. Use it before deploying Golara as a real storefront.

## 1. Environment and secrets

Required production variables:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `ADMIN_PASSWORD`: temporary password gate for the current admin CMS.
- `ADMIN_SESSION_SECRET`: long random secret for signing admin sessions.
- `INQUIRY_NOTIFICATION_MODE`: `log` or `webhook`.
- `INQUIRY_NOTIFICATION_WEBHOOK_URL`: required when `INQUIRY_NOTIFICATION_MODE="webhook"`.
- `INQUIRY_NOTIFICATION_EMAIL`: future email destination/provider setting.
- `INQUIRY_NOTIFICATION_WHATSAPP`: future WhatsApp provider setting.

Rules:

- Never commit real `.env.local` or production secrets.
- Generate a new `ADMIN_SESSION_SECRET` per deployed environment.
- Treat the password gate as temporary until user-account auth is added.
- Treat webhook URLs as secrets if they include provider tokens or private routing keys.

## 2. Database setup

Current production target:

- PostgreSQL.
- Prisma schema deployed with `npm run db:push` until migrations are formalized.
- Seed data loaded with `npm run db:seed` only for first setup or demo resets.
- Admin audit logs are stored in `AdminAuditLog` and require the latest Prisma schema to be pushed.

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
- `/admin` shows editable homepage, categories, media, products, inquiries, and the recent audit log.
- CMS writes are blocked when logged out.
- Public pages revalidate after CMS edits.
- Staff have a documented process for reviewing new inquiries.
- Admin writes create `AdminAuditLog` rows for CMS and inquiry mutations.

Temporary limitations:

- Admin auth is password-only.
- There are no per-user roles yet.
- Audit log filtering and staff identity attribution are not implemented yet.

## 4. Inquiry operations

Current behavior:

- Product detail pages create customer inquiries.
- Admin can filter, search, paginate, print, export, update status, add staff notes, and append follow-ups.
- Notifications support log-only mode and generic webhook mode.
- Inquiry status changes and follow-up notes are recorded in the admin audit log.

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

- External image URLs can be registered.
- Local/dev uploads are written to `public/uploads`.

Production decision required:

- Replace local uploads with object storage such as S3, Cloudinary, or Supabase Storage before deploying to serverless or multi-instance hosting.
- Keep media records as the CMS source of truth for product image selection.

## 6. Deployment preflight

Run these before merging a production release:

```bash
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
- Product/category/homepage edits show on public pages.
- Media registration works.
- Logout returns admin to read-only/login flow.
- Webhook mode sends a test inquiry to the configured endpoint or safely falls back to server logs on failure.
- CMS and inquiry admin writes create audit-log rows.
- The admin audit-log panel shows recent staff activity after writes.

## 7. Remaining production blockers

Do not consider Golara production-complete until these roadmap items are resolved:

- Replace password-only admin auth with account/provider auth.
- Add role checks and richer audit-log filtering/staff attribution in the CMS.
- Replace local file uploads with production object storage.
- Decide whether cart, checkout, payment, taxes, discounts, inventory, and delivery scheduling are needed for the first launch.
