# Tour catalog and detail implementation

Implemented 1 November 2026 after Sarkhan's explicit approval. Routes: `/en/tours`, `/en/tours/:slug` and corresponding RU/AZ routes. Brand shell, original project imagery and visual hierarchy follow the four accepted mockups.

Catalog supports multi-select destinations, duration and activity, tourism category toggles, maximum indicative price, four sort modes, URL persistence and native mobile filter dialog. Filter groups intersect; multiple values within a group are alternatives. Medical/business inventory remains empty and offers a team inquiry. Existing `duration=short` (1–2 days) and `duration=long` (3+ days) shared links retain their meaning; the new 4+ day checkbox uses `extended`. Reset clears filters and sort while retaining date and traveler selections. In-app navigation back to the catalog clears stale filter state along with the URL.

Detail supports matching destination photo galleries, arrow buttons/keys and Escape, anchor sections, route/day content, per-service planner links, related tours, indicative per-person/group estimates and mobile action bar. Date and traveler selections pass through catalog → detail → trip planner with the correct tour template. Services are selected in the planner, final quotes require operator review, registration remains required before submitting an actual request. Contracts and staged payments are explicitly planned; real payment/auth/backend behavior is unchanged.

## Verification

- Production Next.js build and TypeScript passed.
- Existing localization checks passed.
- `node tests/tour-discovery.mjs` passed: intersecting/combined filters, honest empty categories, sorting without inventory mutation, legacy links, invalid URL values/date/pax, planner parameters, EN/RU/AZ content and asset association. Included in CI.
- Browser QA: all three tour variants; EN desktop, AZ mobile and RU 320px; no document horizontal overflow at 1440px, 390px and 320px tested views.
- Gabala filtering and reset, price sort, medical inquiry state, native mobile filter selection/result count/apply, same-route navbar reset.
- Four-person 15 December 2026 selection retained into the highlands detail and then planner; illustrative €960 base estimate correctly reflects four travelers. No quote submission or payment was executed.
- Gallery next/arrow-key/Escape, FAQ, correct related-tour images, 1-day Baku two-photo layout and 3-day Sheki itinerary, mobile planner action, image loading and empty browser error/warning log during tested flow.

Screenshots in the central approved-design archive include desktop catalog/detail full pages and viewport captures, AZ mobile detail/filter dialog, EN mobile catalog and RU 320px catalog. They are implementation evidence, not replacements for the approved source PNGs.
