# Inquiry-first release status

Last updated: 2026-05-31
Current baseline: Phase 30 merged

## Repository status

The Golara repository has completed the inquiry-first production-readiness roadmap through Phase 30.

Repository blockers before inquiry-first production launch: none known.

The launch path remains inquiry-first. Payment provider implementation and full checkout payment automation remain deferred until explicitly approved.

## Production launch requirement

A real production launch still requires operator/environment sign-off. Complete `docs/LAUNCH_AUDIT.md` for the target deployment before promoting production traffic.

Required operator checks:

1. Configure production secrets and environment variables.
2. Configure production PostgreSQL.
3. Verify backup/restore and rollback path.
4. Configure production-safe media storage.
5. Choose and verify inquiry notification mode.
6. Run `APP_MODE="production" npm run check:deploy-readiness` with production-like environment variables.
7. Complete the manual smoke audit.
8. Record the final go/no-go decision.

## Required automated gates

Every release PR must keep these gates green:

```bash
npm install
npm run check:file-lines
npm run check:runtime
npm run db:generate
npm run typecheck
npm run test:unit
npm run build
npm run smoke:routes:local
```

## Non-blocking deferred work

- Payment provider implementation.
- Full automated checkout/order-payment lifecycle.
- Provider-backed per-user admin auth.
- Email and WhatsApp notification providers.
