# Trip planner — design proposal v1

Status: **approved and implemented**, 1 November 2026. Approval: “Tesdiqleyirem basla”. Original GPT Images assets and prompts are preserved here.

## Deliverables

- `desktop.png`: complete planner from navigation through route, services, review and footer.
- `mobile.png`: the same mobile page in two sequential narrow segments; read left, then right.
- `stay-chooser.png`: stay category selection as desktop dialog and mobile bottom sheet.
- `tour-picker-refined.png`: individual tour selection/combination as desktop dialog and mobile bottom sheet.
- `prompts.json`, `prompt-tour-picker.txt` and `prompt-tour-picker-refinement.txt`: exact generation/refinement prompts. The initial `tour-picker.png` is a superseded draft with an incorrect route-order row.

## Source of truth for implementation

Continue the approved homepage and tour-page brand, using existing generated assets in `repositories/AzerTurFrontend/public/images/homepage-v3/`. Images remain illustrative; they do not represent verified hotel inventory. Use proper EN/RU/AZ translations and semantic controls. Small lettering or incidental background differences in raster concepts are not instructions to change the agreed copy or app behavior: for example, the desktop language selector must read **EN**, not any generated spelling variation. Dialog backdrops should be the actual implemented planner, not a separate layout copied from the chooser concept.

The main example is two travelers, two days/one night, 15–16 May 2027, Quba then Khinalug, with return to Baku via Quba coordinated by the team. Daily selections must obey connected-route rules; no invented maps or driving times. The route editor supports adding/removing up to 14 days, destination changes, and starting from existing tours or from scratch. Preserve existing date/traveler/template links. Never silently discard other selections when editing one day; explain changes needed to reconnect a route.

Tour selection is individual and may combine multiple connected itinerary templates. The tour-picker example selects the one-day Baku tour plus the two-day highlands tour, proposing three days after Apply. This is a different draft state from the two-day main example. Recalculate dates, accommodation nights, services and estimate when applying it. Do not add a catalog starting price as another charge on top of those services. Adding multiple tour templates requires implementation beyond the existing single-template planner; this proposal does not claim that capability already exists.

## Sample pricing

The main example follows the current Spring Boot `QuoteCalculator` sample service rates, not live commercial prices:

- Private car/driver: 2 days × €90 = **€180**.
- Comfort stay: 1 room × 1 night × €110 = **€110**.
- Guide: 2 days × €65 = **€130**.
- Airport transfer: 1 × €35 = **€35**.
- Craft experience: 2 travelers × €20 = **€40**.

Group estimate: **€495**. All five services are selected in the example. No package base fee is added. Hotel-category alternatives are Standard €65, Comfort €110 and Premium €190 per room/night. Own stay removes that service charge. The team confirms the actual property and availability. Per-person display, if implemented, must use the app's agreed rounding consistently and not change the group total. Any change in days, travelers or selected services requires recalculation; stale totals must not be presented as current. Backend unavailability should show an honest retry/manual-inquiry state.

The stay chooser is a category preference, not named inventory. Future partner/manual hotel listings can replace or extend it only with actual supported data. Flights and visa help remain team inquiries with separately confirmed quotes, not invented automatic prices.

## Request flow and interactions

Browsing and configuring can happen without authentication. **Review my request** preserves the draft and asks guests to sign in/create an account. Authentication must return to this same plan. The user reviews and explicitly submits after authentication; neither signing in nor choosing a service automatically sends a request. Authenticated users proceed directly to review. Submitting requires operator review, not instant confirmation.

PDF contract preview/approval and the initial deposit follow the confirmed operator offer; later payment requests depend on services becoming due. These are planned features. Do not expose a Pay now action, fixed deposit percentage, automatic contract acceptance, universal cancellation window or refund percentage on the planner. Current payment behavior remains demo-only. Cancellation terms depend on service, provider and request timing.

Each service can be selected, edited or removed independently, with an itemized price and unit basis. Provide real keyboard-operable day controls, checkboxes/radios, accessible native dialogs, focus restoration and Escape support. Mobile form fields stack; keep the summary in the review section, with a bottom action that has enough footer clearance. Copy-plan links share only route/service configuration, not notes, account details or private documents.

## Research and review

Primary visual references are the user's approved tour designs in `design/approved/tours/v1/`. No third-party assets were copied.

- Tour Booking Website by Hamza Anza: https://www.freefigmatemplates.com/gallery/tour-booking-website — listing describes package creation and tour-planning screens; linked Figma file https://www.figma.com/community/file/1266327434611803038 could not be fetched directly.
- Hawkeye Travel App Template by Alan Love: https://www.freefigmatemplates.com/gallery/travel-app-template — listing describes itinerary forms, calendar planning and account screens; linked Figma file https://www.figma.com/community/file/1103934811768503323 was blocked by robots policy. Internal Figma frames were not inspected.
- Existing implementation: `repositories/AzerTurFrontend/components/travel-site.tsx` and `repositories/AzerTurBackend/src/main/java/az/azertur/quote/QuoteCalculator.java`.

Visual QA checks the full page/footer, consistent project photos, selected-service accounting, guest-auth gate, mobile readable fields, correct tour/photo association and lack of payment/availability guarantees. Interaction and accessibility testing will follow implementation after approval.
