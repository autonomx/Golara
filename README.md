# Golara

Golara is a modern editable flower and luxury gift storefront. The project is intentionally not Joomla-based: it provides Joomla-like site editing through a custom admin/CMS layer while keeping the public storefront fast, clean, and easy to extend.

## Current scope

Phase 2 is now implemented as a database-ready CMS foundation:

- Next.js App Router storefront
- RTL-ready visual system foundation
- Seeded flower/category/product fallback content
- Prisma/PostgreSQL data model
- Prisma seed script
- Async storefront data repository
- Admin forms for homepage content, categories, and products
- Revalidation after CMS writes
- CI for Prisma generation, typecheck, and build

The storefront still works without a database by reading seeded fallback data. Admin write forms are enabled only when `DATABASE_URL` is configured.

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
```

Then run:

```bash
npm run db:push
npm run db:seed
npm run dev
```

Visit http://localhost:3000/admin to edit homepage content, categories, and products.

## Planned stack

- Next.js
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL in production
- Seeded fallback content for database-free previews

## Roadmap

See `docs/ROADMAP.md` for implementation phases.
