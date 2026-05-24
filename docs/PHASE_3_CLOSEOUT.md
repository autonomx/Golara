# Phase 3 closeout

Phase 3 establishes Golara's inquiry-driven storefront operations and production-readiness foundation.

## Implemented foundation

- Customer inquiry creation from product detail pages.
- Admin inquiry inbox with status management, notes, follow-ups, filters, search, pagination, CSV export, and print view.
- Reusable inquiry validation and field-level customer-facing error display.
- Notification abstraction with log and generic webhook delivery modes.
- Production readiness checklist and admin readiness panel.
- Admin audit logging for CMS and inquiry mutations.
- Audit-log viewer with action, entity, actor, and free-text filters.
- Admin identity seam with password-backed label, email, role, and provider metadata.
- Owner/staff role enforcement for current password-backed sessions.
- Media storage helper/provider seam with local and Cloudinary upload providers.
- CI file-line guard to prevent oversized source files.

## Current production-ready path

For a small operational launch, configure:

```bash
DATABASE_URL="postgresql://..."
ADMIN_PASSWORD="..."
ADMIN_SESSION_SECRET="..."
ADMIN_LABEL="Owner"
ADMIN_EMAIL="owner@example.com"
ADMIN_ROLE="owner"
INQUIRY_NOTIFICATION_MODE="webhook"
INQUIRY_NOTIFICATION_WEBHOOK_URL="https://..."
MEDIA_STORAGE_PROVIDER="cloudinary"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_UPLOAD_PRESET="..."
CLOUDINARY_UPLOAD_FOLDER="golara"
```

Run:

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run check:file-lines
npm run typecheck
npm run build
```

## Manual smoke test

- Public homepage loads with database content.
- Category and product pages load.
- Inquiry form validates bad input and creates a valid inquiry.
- Webhook mode receives a test inquiry payload.
- Admin login works.
- Owner can edit homepage, categories, products, media, and inquiries.
- Staff can edit inquiry status/follow-ups but cannot edit catalog/homepage/media.
- Audit logs record actor metadata for writes.
- Audit-log filters work.
- Cloudinary upload returns a hosted image URL when configured.
- Signed-out admin preview does not show audit logs.

## Deferred to Phase 4

These are intentionally not blockers for Phase 3 foundation completion:

- Replace password-only admin auth with account/provider auth.
- Per-user admin accounts and real multi-user role management.
- Customer accounts.
- Cart, checkout, payments, taxes, discounts, inventory, and delivery scheduling.
- Optional additional storage providers beyond Cloudinary.

## Phase 3 status

Phase 3 is considered foundation complete once this document, the roadmap, and production checklist are merged.
