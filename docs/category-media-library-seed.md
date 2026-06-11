# Category media library seed

This note tracks the category-image media-library seed slice.

## What changed

- `npm run db:seed` now runs `prisma/seed-demo-category-media.ts` after the main catalog seed.
- The script upserts every unique seed category image URL into `Media` with `metadata.mediaCategory = "category"`.
- Category rows keep their existing `imageUrl`; the media-library seed makes those same image URLs visible in the admin media library.
- Duplicate category image URLs are grouped into one media row with `metadata.seedCategorySlugs` and `metadata.seedCategoryTitles`.
- The category image route no longer points `today-vip` or `royal` at the removed `woshe-royal` asset; both route to the VIP flower-box replacement.

## Deployment

After this PR is deployed, run:

```bash
npm run db:seed
```

against the deployed database to populate category image rows in `/admin/media`.
