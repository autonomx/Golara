# Phase 4 closeout — production ecommerce foundation

Phase 4 moved Golara from inquiry-only commerce toward a production ecommerce foundation.

## Implemented foundation

### Checkout and order draft

- Product-page order draft form.
- Server-side checkout action.
- Phone-first customer profile upsert.
- Customer delivery address creation.
- Server-side order draft creation with recomputed totals from product prices.
- Safe public order confirmation/status redirects.

### Customer-safe public order status

- Non-guessable public order lookup token on checkout orders.
- Public `/orders/[token]` status page.
- Privacy-limited public fields only.
- Public result banners for paid, failed, and cancelled return states.
- Customer-safe fulfillment status display.
- Public language links for English and Persian.
- Persian label/copy foundation and RTL mixed-direction polish.

### Provider/payment foundation

- Payment attempt records.
- Manual payment provider mode.
- Configurable external handoff provider seam.
- Return route scaffold requiring both order number and public token.
- Return handler updates latest payment attempt and order status.
- Idempotency hardening for repeated return/result calls.

### Admin order operations

- Admin order list.
- Order filters by order status, payment status, fulfillment status, and search.
- Pagination for admin orders.
- CSV export and print view for filtered order lists.
- Admin order detail page.
- Order timeline events.
- Staff notes.
- Fulfillment fields and staff fulfillment action.
- Packing slip view.
- Audit-log events for order status, notes, and fulfillment updates.

### Fulfillment foundation

- Fulfillment status field.
- Fulfillment note.
- Courier name/phone fields for staff use.
- Fulfillment filters in admin.
- Fulfillment/courier details on packing slips.

### QA and docs

- Iran checkout direction docs.
- Public order status QA checklist.
- Phase notes for each bundled Phase 4 slice.

## Still deferred

### Real gateway integrations

The app has a configurable provider handoff seam and return scaffold, but still needs provider-specific implementation for a selected domestic PSP.

Remaining work:

- Provider-specific create/request API call.
- Provider-specific signed/verified callback handling.
- Provider-specific verify API call before marking paid.
- Provider idempotency keys and retry hardening.
- Provider error code mapping.

### Cart/session flow

Current public order entry is product-page order draft creation, not a full multi-item cart experience.

Remaining work:

- Cart session storage.
- Add/remove/update quantities across products.
- Cart review page.
- Multi-product checkout flow.

### Customer accounts

Customer identity is phone-first and order-linked, but there is no customer login/account dashboard yet.

Remaining work:

- Customer authentication or phone OTP flow.
- Customer order history.
- Customer address book management.
- Customer notification preferences.

### Production hardening

Remaining work:

- Automated e2e tests for checkout/order routes.
- Security review of return/provider routes.
- Rate limiting for public order lookups.
- Monitoring/analytics events.
- Full Persian storefront copy and RTL QA.

## Recommended next phase

Move to Phase 5 polish/growth, while keeping one Phase 4 follow-up track for real PSP integration once the exact provider is chosen.
