# Security audit — admin login origin boundary

## Scope

Adds an explicit same-origin check to the admin login server action before it creates an admin session.

## Control

The guard compares the submitted `Origin` header to the request origin inferred from forwarded host/protocol headers. Cross-origin submissions are rejected before password validation or session cookie creation.

Missing origin/host headers are tolerated to avoid breaking framework-internal or local development flows.

## Follow-up

The same helper can be rolled out to additional cookie-backed server actions in separate narrow slices.
