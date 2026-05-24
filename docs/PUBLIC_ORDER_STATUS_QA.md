# Public order status QA checklist

Use this checklist to manually validate the public order status surface after checkout/order changes.

## Required setup

- `DATABASE_URL` configured.
- At least one product exists and is active.
- A checkout order has been created from a product page.
- The order has a `publicLookupToken`.

## Core routes

Replace `<token>` with a real public lookup token.

```text
/orders/<token>
/orders/<token>?locale=en
/orders/<token>?locale=fa
/orders/<token>?result=paid
/orders/<token>?result=failed
/orders/<token>?result=cancelled
/orders/<token>?locale=fa&result=paid
/orders/<token>?locale=fa&result=failed
/orders/<token>?locale=fa&result=cancelled
```

## Privacy checks

The public order status page must not show:

- customer phone
- customer email
- delivery address
- courier name
- courier phone
- customer notes
- staff notes
- internal audit metadata
- raw public lookup token

The page may show:

- order number
- order status
- checkout mode
- fulfillment status
- total amount
- delivery date/window when available
- item titles and quantities
- safe public timeline titles
- latest payment provider/status summary

## Locale checks

For `?locale=fa`:

- page `dir` should be `rtl`.
- order status label should be Persian.
- fulfillment status label should be Persian.
- result banner should be Persian when `result` is present.
- date formatting should receive the Persian locale.
- order number should remain left-to-right.
- total amount should remain left-to-right.
- item quantity should remain left-to-right.
- language switcher should remain stable and readable.

For `?locale=en` or no locale:

- page should remain left-to-right.
- labels should remain English.

## Result banner checks

- `result=paid` should show a success-style banner.
- `result=failed` should show a warning-style banner.
- `result=cancelled` should show a warning-style banner.
- unknown `result` values should not show a banner.
- switching language should preserve the current `result` query parameter.

## Empty state checks

- If the order has no timeline events, the page should show the localized empty-progress message.
- If delivery date/window are missing, the delivery timing section should be hidden.

## Follow-up work

- Add automated Playwright checks once an e2e test harness exists.
- Add full Persian copy for product and checkout pages.
- Add site-wide language preference persistence.
