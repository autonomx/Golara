# Customer phone registration and profile completion

Golara uses a passwordless phone-first customer account model.

This slice keeps OTP as the single account entry point and clarifies the flow as **sign in or create account**:

1. The customer enters a phone number on `/account/login`.
2. OTP verification links an existing account or creates a phone-backed customer account.
3. If the customer profile does not yet have a display name, the verified session is sent to `/account/profile?status=complete-profile` with the original safe return path preserved.
4. The profile completion form requires the display name only in completion mode, keeps email optional, and returns the customer to the original checkout/account destination after completion.

Guest checkout and inquiry flows remain available; this change only makes the phone account flow explicit and adds the first profile-completion step for new or incomplete accounts.
