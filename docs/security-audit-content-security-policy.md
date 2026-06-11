# Security audit — content security policy

## Scope

Adds a baseline `Content-Security-Policy` header to the shared Next.js response header configuration.

## Controls

The policy keeps the current Next.js runtime compatible while tightening high-risk browser surfaces:

- `default-src 'self'`
- `base-uri 'self'`
- `object-src 'none'`
- `frame-ancestors 'none'`
- `form-action 'self'`
- `img-src 'self' data: blob: https://res.cloudinary.com`
- `font-src 'self' data:`
- `style-src 'self' 'unsafe-inline'`
- `script-src 'self' 'unsafe-inline'`
- `connect-src 'self'`
- `upgrade-insecure-requests`

## Follow-up

A nonce or hash-based script policy can replace `script-src 'unsafe-inline'` in a later slice once the app has a nonce plumbing strategy for framework/runtime scripts.
