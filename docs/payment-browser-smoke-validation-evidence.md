# Payment Browser Smoke Validation Evidence

Environment:
Deployed SHA:
Operator:
Date:
Base URL:
Provider mode:
Enabled provider(s):

## Completion checklist

Do not set `PAYMENT_BROWSER_SMOKE_TESTS_CONFIRMED="true"` until every checklist item below has concrete target-environment evidence.

- [ ] Deployed SHA matches the intended release candidate.
- [ ] Guest cart add/update/remove/clear/subtotal/count behavior tested.
- [ ] Guest checkout contact, delivery, validation, and server-recomputed summary tested.
- [ ] Signed-in checkout profile/default-address prefill tested.
- [ ] Provider handoff idempotency tested with duplicate/repeated checkout submission.
- [ ] Provider success return tested through public order status.
- [ ] Provider cancel/failure/missing-token/unverified returns tested and confirmed not paid.
- [ ] Public order privacy checked for provider/payment/timeline details.
- [ ] English LTR checkout/payment/order pages checked.
- [ ] Persian RTL checkout/payment/order pages checked.
- [ ] Signed-in order history session boundary checked.
- [ ] Rollback to inquiry/manual checkout confirmed.

## Evidence rows

| Case ID | Result | Evidence reference | Notes |
| --- | --- | --- | --- |
| cart-guest-add-update-remove | Pending |  |  |
| checkout-guest-order-summary | Pending |  |  |
| checkout-signed-in-prefill | Pending |  |  |
| provider-handoff-idempotency | Pending |  |  |
| return-success-public-order | Pending |  |  |
| return-cancel-failure | Pending |  |  |
| public-order-privacy | Pending |  |  |
| localization-en-fa-payment-copy | Pending |  |  |
| account-context-order-history | Pending |  |  |

## Notes

Evidence references can be screenshots, provider sandbox session IDs, admin observations, test logs, or ticket links. Do not paste secrets, card values, private provider credentials, full customer payloads, or unredacted phone/email values into this document.

This template is incomplete until every row has a non-pending result and evidence reference. Unit tests, source guards, static route smoke tests, and documentation-only checks do not count as target-environment browser smoke evidence.
