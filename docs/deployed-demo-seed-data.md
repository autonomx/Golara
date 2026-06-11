# Deployed demo seed data

This note tracks the deployed database seed coverage used for admin previews.

## Seed command

After Vercel has the latest code and production/preview `DATABASE_URL` is available to the runner, execute:

```bash
npm run db:seed
```

The package-level Prisma seed chain runs:

1. `prisma/seed.ts` for catalog, homepage, customers, addresses, inquiries, orders, payment attempts, and discount preview data.
2. `prisma/seed-demo-discounts.ts` for additional promotion/discount fixtures.
3. `prisma/seed-demo-operations.ts` for deployed admin operations data.

## Admin operations coverage

`prisma/seed-demo-operations.ts` is intentionally idempotent and adds the deployed preview records that were missing from the base seed:

- staff/admin accounts:
  - `demo-owner@golara.test`
  - `demo-staff@golara.test`
  - `demo-fulfillment@golara.test`
- payment events and durable settlement reconciliation rows for:
  - `DEMO-1001` settled
  - `DEMO-1002` pending
  - `DEMO-1003` needs attention / failed
- admin audit activity rows for staff, settlement, and inquiry previews.

The script depends on the base seed order rows and payment attempts, so it remains last in the Prisma seed chain.

## Safety notes

- The script uses stable demo identifiers and upserts where possible.
- Audit rows with `demo.seed.*` actions are refreshed before insert to avoid duplicates.
- It does not add production credentials; seeded admin accounts are preview records only.
