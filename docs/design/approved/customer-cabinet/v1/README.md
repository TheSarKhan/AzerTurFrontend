# Customer cabinet — design proposal v1

Status: approved by Sarkhan and implemented, 1 November 2026. See approval.md and implementation.md. Scope is customer My trips overview and request detail, including responsive mobile views. These are raster concepts; website implementation follows approval under the agreed module-by-module workflow.

## Design direction

Continue the approved homepage, tours and planner: off-white, charcoal, forest green, pale sage and restrained orange. No pill statuses, eyebrows, neon, gradients, analytics tiles or admin dashboard styling. Use the same approved generated imagery. The customer should immediately understand their request status, selected services, amounts and next step.

## Example and accounting

One illustrative custom request: 42bf2845, 15–16 May 2027, Quba → Khinalug, two travelers, two days / one night. Status PENDING_REVIEW. Driver €180, Comfort stay €110, guide €130, transfer €35, craft €40 = group estimate €495. Paid €0, remaining €495. Remaining does not mean currently due. No fixed response SLA, universal cancellation window, refund percentage or deposit percentage.

## Current vs planned behavior

Existing API supports authenticated customer identity, booking list, immutable quote snapshot and line items, operator note, change/cancellation requests and demo payments after operator approval. The design reorganizes these into overview and detail views. Account details initially show read-only name/email/language; no unsupported update or password controls.

The pending state must not expose payment or contract acceptance actions. Contract PDF preview/approval, uploaded document retrieval and staged service payments are future work. Documents remain an honest empty state without fictional downloads. Future contract/payment copy explains the intended business sequence without promising those endpoints exist. Current demo mode remains explicit.

Request detail should be addressable and preserve authenticated navigation. Guests return after sign-in; sign-in never sends a request. Detail should show the actual custom route and all service line items rather than only the underlying catalog title. Missing, unauthorized and expired data must get honest error/empty states.

Change/cancellation forms use the existing kind/message endpoint. Submitting requests does not instantly change/cancel a booking or guarantee a refund. An existing pending request blocks duplicate requests and payments, with the operator response shown when resolved. Native dialog semantics, keyboard operation, focus restoration and readable stacked mobile controls are required in implementation. Final code needs EN/RU/AZ, consistent server currency rounding and service-dependent cancellation wording.

## Research

Primary references are the user's approved project originals: planner v1 and tour details v1. No third-party assets were copied.

- Design Monks Travel App UI Kit, creator's listing: https://www.designmonks.co/products/free-travel-app-ui-kit — reviewed description of booking history, user profiles and itinerary screens. Linked Community file: https://www.figma.com/community/file/945364441965000506/travel-app-freebie/duplicate . Direct Figma fetching was restricted, so internal frames were not inspected and no claim of duplicating this kit is made.
- Emily Isabelle, Just You Travel Dashboard: search listing found but the original page returned 404; not used as an inspected visual reference.

## Approval and archive

Keep drafts here. After approval, copy accepted originals and exact prompts to design/approved/customer-cabinet/v1 and the frontend repository archive with the user's approval quote. Do not overwrite previous approved modules.

## Deliverables and visual review

- overview-desktop.png — complete My trips overview, including sidebar, pending request, next steps, account summary and footer.
- detail-desktop.png — complete request detail, including route, five service line items, notes, change/cancellation empty state, documents empty state and summary.
- mobile.png — two different complete mobile pages side by side: overview on left, request detail on right.
- prompts-desktop.json and prompt-mobile.txt — exact generation prompts.
- manifest.json — status, dimensions and sample accounting.

Reviewed all three generated originals. The example line items total €495, paid €0, remaining €495. Pending state shows no pay-now or PDF acceptance. Footer present on each page. Generated microcopy differences are not source of truth: use canonical city spelling Khinalug, accurate EN/RU/AZ and flat orange in implementation. Mobile “Edit” next to notes must open a change request rather than imply the pending booking can be silently edited. Documents are a future empty-state area until supported APIs are implemented.

## Incidental existing-UI correction

During source inspection, found that the custom-journey title guard also suppressed service line items in the existing customer list. Removed that unintended guard while retaining the correct custom journey title. Frontend production build and TypeScript passed; change committed as 978695d on the existing planner PR. New customer-cabinet design itself has not been applied to the website.
