# Phase 12.4-12.6 — Local smoke route runner

This bundle adds a small local runner around the Phase 12 route smoke checks.

## Goals

- Make the existing route smoke checks easier to run against a built local app.
- Start the app, wait for it to respond, run the smoke checks, and stop the app.
- Keep the implementation dependency-free.
- Avoid introducing Playwright or browser automation in this bundle.

## Added foundation

- `tools/run-smoke-routes-local.mjs`
- `npm run smoke:routes:local`

## Usage

Build the app first:

```bash
npm run build
```

Then run:

```bash
npm run smoke:routes:local
```

The runner starts the app with `npm run start`, waits for `http://127.0.0.1:3000`, runs `npm run smoke:routes`, then stops the started process.

## Configuration

Use a different base URL:

```bash
SMOKE_BASE_URL=http://127.0.0.1:4000 npm run smoke:routes:local
```

Use a different start command:

```bash
SMOKE_START_COMMAND="npm run start -- -p 4000" SMOKE_BASE_URL=http://127.0.0.1:4000 npm run smoke:routes:local
```

Adjust readiness timeout:

```bash
SMOKE_READY_TIMEOUT_MS=60000 npm run smoke:routes:local
```

## Scope note

This runner does not replace CI build/typecheck coverage. It is meant for local or staging smoke checks after the app has been built.

A future bundle can add GitHub Actions wiring once the exact environment and startup expectations are stable.

## Manual QA checklist

1. Run `npm run build`.
2. Run `npm run smoke:routes:local`.
3. Confirm the runner starts the app and waits until it responds.
4. Confirm route smoke checks report pass/fail statuses.
5. Confirm the started app process is stopped after the checks finish.
