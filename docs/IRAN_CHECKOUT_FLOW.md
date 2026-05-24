# Iran checkout flow

Golara should support an Iran-market checkout path similar to established local flower shops while preserving the Phase 3 inquiry-first operating model.

## Observed market pattern

Woshe's public storefront shows these patterns:

- Products can show Toman prices and a direct buy action.
- Some high-touch or constrained-inventory products route customers to contact/WhatsApp instead of pure self-serve checkout.
- Customer account areas include login/register, orders, and addresses.
- Outside-Iran customers are routed to WhatsApp sales support.
- The exact bank gateway is not visible from the public pages because checkout/order areas are gated behind customer login.

## Golara target behavior

Phase 4 should add checkout in this order:

1. Phone-first customer identity.
2. Customer address book.
3. Cart and order draft.
4. Delivery date/time and recipient details.
5. Availability gate: allow staff-contact fallback for custom, VIP, or low-stock products.
6. Gateway handoff for domestic Iran orders.
7. Gateway verification callback.
8. Order status timeline in admin.
9. WhatsApp/manual fallback for overseas or assisted orders.

## Checkout modes

Golara should support three operational modes:

- `inquiry`: current Phase 3 behavior; no online checkout.
- `assisted`: create an order draft and send customer to staff/WhatsApp/manual follow-up.
- `gateway`: create an order draft and redirect to an Iranian card gateway.

## Gateway provider seam

Start with a provider interface rather than hardcoding one PSP:

- `manual`: records a pending/manual payment instruction for staff follow-up.
- `zarinpal`: future domestic card gateway adapter.
- `zibal`: future domestic card gateway adapter.
- `idpay`: future domestic card gateway adapter.

Each adapter should implement:

- create gateway session from an order draft.
- redirect customer to gateway URL.
- verify callback by authority/track ID/reference ID.
- mark order paid only after server-side verification.
- store raw provider reference data in a bounded JSON field.

## Currency and amount rules

- Store canonical money in integer minor units.
- Display domestic prices in Toman because that matches the local storefront pattern.
- Keep the provider adapter responsible for converting to the provider-required unit if a PSP expects Rial.
- Avoid floating-point price math.

## Security rules

- Never trust client-submitted totals.
- Recompute totals server-side before creating a gateway session.
- Use idempotent order/payment records so callback retries are safe.
- Verify the provider callback server-side before marking an order paid.
- Keep customer PII out of provider metadata unless required.
- Log payment lifecycle events in admin audit logs.

## Deferred decisions

- Which PSP to launch with.
- Whether to support multiple PSPs from day one.
- Whether international orders should remain WhatsApp-only.
- Whether to add cash/manual bank-transfer workflows.
