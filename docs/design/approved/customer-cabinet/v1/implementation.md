# Approved customer cabinet implementation

Implemented My trips overview, request detail at /[locale]/trips/[bookingId], and read-only account at /[locale]/trips/account. Guest authentication returns to the exact requested page. Data comes from the existing authenticated customer endpoints; details resolve only from that customer's bookings. No backend contract, document upload or live payment capability is implied.

The accepted three raster originals, exact prompts and approval quote are preserved here. Project-generated imagery is reused. Responsive EN/RU/AZ includes deterministic localized dates and translated destination names. Account name/email/language are read-only; sign-out revokes the session.

Existing change/cancellation requests and demo payments remain connected. A pending request hides duplicate request and payment actions. Closed/rejected or fully paid bookings have no inappropriate payment action. Payment attempts reuse their idempotency key after transport errors. Native dialogs support Escape and focus restoration. Documents are an honest empty state; staged payment and PDF contract features remain planned.

Validation completed on 1 November 2026:
- Production build/TypeScript; localization, discovery, pricing and new cabinet regression checks passed.
- Browser verified upcoming/past filters, detail navigation, all five service lines and €495 total, account, sign-out, guest direct-link login and exact return, unavailable-request state, native dialog Escape/focus, and successful QA change submission.
- Submitted only a clearly marked change request on existing QA booking 42bf2845-a851-497e-a0fc-3bfa58bb143a. It remains pending; duplicate and payment actions are hidden. No real charge or external email sent.
- Desktop screenshot, 390px mobile overview/detail and 320px RU detail showed no document overflow. The viewport override was reset.

Screenshots are stored in the workspace design/approved/customer-cabinet/v1 directory. No cloud deployment or main-branch merge was performed.
