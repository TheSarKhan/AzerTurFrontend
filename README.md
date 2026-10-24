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

The approved design, EN/RU pages, planner, filters, gallery and sample checkout remain intact. Customer accounts, checkout, deposits and balances are still UI demos; real booking/payment APIs are not yet implemented. Itinerary copy and display-only from-prices are sample content. Photos and font attribution are included in the website.

See [architecture and repository links](docs/ARCHITECTURE.md).
