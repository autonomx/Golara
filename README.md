# Golara

Golara is a modern editable flower and luxury gift storefront. The project is intentionally not Joomla-based: it provides Joomla-like site editing through a custom admin/CMS layer while keeping the public storefront fast, clean, and easy to extend.

## Current scope

Phase 3.0 is now implemented as a protected CMS foundation with customer inquiry capture:

- Next.js App Router storefront
- Thin route files with section UI moved into focused components
- RTL-ready visual system foundation
- Seeded flower/category/product fallback content
- Prisma/PostgreSQL data model
- Prisma seed script
- Async storefront data repository
- Admin forms for homepage content, categories, media, and products
- Media library URL registration and local/dev uploads to `public/uploads`
- Product image picker backed by media records
- Product inquiry forms that create customer inquiry records
- Admin inquiry inbox for reviewing customer requests
- Environment-based admin login gate
- Server-action write protection for CMS writes
- Revalidation after CMS writes
- CI for Prisma generation, typecheck, and build

The storefront still works without a database by reading seeded fallback data. Admin write forms and inquiry storage require `DATABASE_URL`; CMS writes also require `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, and an authenticated admin session.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Enable editable CMS mode

Create `.env.local`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/golara?schema=public"
ADMIN_PASSWORD="replace-this-password"
ADMIN_SESSION_SECRET="replace-this-session-secret"
```

Then run:

```bash
npm run db:push
npm run db:seed
npm run dev
```

Visit http://localhost:3000/admin/login to sign in, then open http://localhost:3000/admin to edit homepage content, categories, media, products, and review customer inquiries.

## Media uploads

Phase 2.2 supports two media flows:

- Register an existing image URL.
- Upload an image file into `public/uploads` for local/dev use.

For production deployments on serverless hosts, replace local uploads with object storage such as S3, Cloudinary, or Supabase Storage.

## Inquiry flow

Phase 3.0 adds product inquiry forms. Customers can submit name, phone, optional email, preferred date, delivery notes, and a message from product detail pages. Requests appear in the admin inquiry inbox.

## Planned stack

- Next.js
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL in production
- Seeded fallback content for database-free previews

## Roadmap

See `docs/ROADMAP.md` for implementation phases.
