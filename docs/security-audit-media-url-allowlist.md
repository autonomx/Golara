# Media URL allowlist hardening

Production platform hardening narrowed Next image optimization to approved remote providers, but the manual media URL path still accepted any HTTP or HTTPS URL.

This slice aligns manual media URL registration with the production image host policy:

- local upload URLs under `/uploads/` remain valid;
- external URLs must use HTTPS;
- external URLs must use the approved Cloudinary image host;
- arbitrary HTTP URLs and arbitrary external HTTPS hosts are rejected before media records are persisted.

The guard is covered by `tests/unit/media-url-allowlist.test.ts` and is wired into `npm run test:unit`.
