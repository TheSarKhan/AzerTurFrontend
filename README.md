# AzerTurFrontend

Customer website · standard Next.js App Router / TypeScript / Tailwind.

```sh
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Website: http://localhost:3000. `API_BASE_URL` is a server-only address pointing to Spring Boot (default `http://127.0.0.1:8080`). The quote route is a transport proxy; all pricing and validation run in Java. No customer secret belongs in a `NEXT_PUBLIC_` variable.

```sh
npm run typecheck
npm run build
npm start
```

The Dockerfile produces a standalone Next.js Node server. Local `next start` uses the normal build; container builds set `NEXT_OUTPUT=standalone`.

The approved design, EN/RU pages, planner, filters, gallery and sample checkout remain intact. Customer accounts, reservations and payment requests use the real backend; online card payment (Epoint) is not connected yet. Itinerary copy and display-only from-prices are sample content. Photos and font attribution are included in the website.

See [architecture and repository links](docs/ARCHITECTURE.md).

## Customer review workflow update

The customer registration, durable reservation request, offer and contract workflow and finance-recorded payments are now implemented. See [the current architecture, API and remaining production work](docs/ARCHITECTURE.md); that document supersedes the initial foundation-only notes above. No cloud deployment or live payment/provider connection is included.

## Customer office-workflow updates

`/[locale]/trips/notifications` shows owned in-app updates and read state. The payment page includes exact-version acceptance of a reviewed remaining-service plan after partial cancellation. Cancellation results show separate manual refund tracking and the office's customer-facing explanation. The original deposit history is kept distinct from funds allocated to active services. EN/RU/AZ are supported. See [workflow and setup details](docs/OFFICE_WORKFLOWS.md) and `docs/design/implemented/office-workflows/v1/` for browser verification screenshots.

## Account security and paid changes

Email verification, password recovery and session revocation now protect customer writes. Paid changes use a separately reviewed proposal and exact PDF acceptance before the effective booking changes. See [setup, workflow and verification](docs/ACCOUNT_SECURITY_AMENDMENTS.md). This work is stacked on `feature/complete-office-workflows`; live delivery still needs the configured server SMTP environment.
