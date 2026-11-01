# Customer request flow verification — 1 November 2026

Local Docker PostgreSQL, Redis and Spring Boot API are running. Health is UP. Frontend preview: http://127.0.0.1:4182; office dashboard: http://localhost:5173.

Verified in browser: guest configures Quba → Khinalug, 15 May 2027, two travelers, five services (€495); notes survive registration; registration returns to explicit checkout without auto-submitting; submission creates request 42bf2845-a851-497e-a0fc-3bfa58bb143a in PENDING_REVIEW; the customer sees no payment action; operator panel receives exact date, traveler count, route, categories, language, all five line amounts and note. This clearly marked QA request remains pending for inspection. No real payment or external email was sent.

Checks passed: backend Docker Maven build/tests; API smoke through Next.js quote proxy; booking_flow.py including access isolation, review, simulated payments, retries, concurrent requests, changes/cancellations, outbox and logout; frontend production build/TypeScript, localization, discovery and new pricing regression; dashboard production build/TypeScript.

Fixed two issues: preview currency totals now round each service before summing, matching Spring Boot (a one-day single-traveler Standard example in AZN previously displayed 393 versus the server’s 392); customer and office lists now identify customized trips as custom journeys instead of the base catalog tour title.

Contract approval and per-service staged payments remain separate planned work. Existing demo-payment rules were exercised only by automated local tests. The current step verifies request intake, not production readiness or live payments.
