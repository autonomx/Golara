# Production launch checklist

This checklist turns the roadmap's remaining production blockers into explicit launch decisions. Use it before deploying Golara as a real storefront.

## 1. Environment and secrets

Required production variables:

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `ADMIN_PASSWORD`: temporary password gate for the current admin CMS.
- `ADMIN_SESSION_SECRET`: long random secret for signing admin sessions.
- `INQUIRY_NOTIFICATION_MODE`: currently `log`; switch when a real provider is implemented.
- `INQUIRY_NOTIFICATION_EMAIL`: future email destination/provider setting.
- `INQUIRY_NOTIFICATION_WHATSAPP`: future WhatsApp provider setting.

Rules:

- Never commit real `.env.local` or production secrets.
- Generate a new `ADMIN_SESSION_SECRET` per deployed environment.
- Treat the password gate as temporary until user-account auth is added.

## 2. Database setup

Current production target:

- PostgreSQL.
- Prisma schema deployed with `npm run db:push` until migrations are formalized.
- Seed data loaded with `npm run db:seed` only for first setup or demo resets.

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
- `/admin` shows editable homepage, categories, media, products, and inquiries.
- CMS writes are blocked when logged out.
- Public pages revalidate after CMS edits.
- Staff have a documented process for reviewing new inquiries.

Temporary limitations:

- Admin auth is password-only.
- There are no per-user roles yet.
- Audit logging is not implemented yet.

## 4. Inquiry operations

Current behavior:

- Product detail pages create customer inquiries.
- Admin can filter, search, paginate, print, export, update status, add staff notes, and append follow-ups.
- Notifications run in log-only mode.

Before production launch:

- Decide whether staff will monitor `/admin` manually at first.
- Add email or WhatsApp delivery before relying on automated alerts.
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

## 7. Remaining production blockers

Do not consider Golara production-complete until these roadmap items are resolved:

- Replace log-only notifications with email or WhatsApp providers.
- Replace password-only admin auth with account/provider auth.
- Add role checks and audit logging.
- Replace local file uploads with production object storage.
- Add richer customer-facing inline validation UX.
- Decide whether cart, checkout, payment, taxes, discounts, inventory, and delivery scheduling are needed for the first launch.
