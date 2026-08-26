# Matariya OMS

Matariya OMS is a Next.js, TypeScript and Tailwind CSS order-management system for a manufacturing company. It manages dealers, products, one running order per dealer, partial dispatch, reduction history, production-planning views, Fan Rod planning, and packing sheets. Prices and inventory are outside scope.

## PostgreSQL data design

PostgreSQL is accessed only by server-side Prisma services. Browser screens call Next.js route handlers; database credentials never enter browser code.

Quantities are append-only history transactions in `order_additions`, `dispatches`, and `cancellation_reductions`, each with separate item rows. The running order is a stable header, not a mutable quantity ledger. Every screen derives:

`Pending = SUM(Order Additions) - SUM(Dispatches) - SUM(Cancellations/Reductions)`

The database enforces foreign keys, positive quantities, one running-order header per dealer, searchable indexes, and unique business references. `ORD`, `OA`, `DSP`, and `CAN` numbers use atomic counters. Dispatch/reduction checks run inside serializable transactions to protect against simultaneous submissions.

## Local setup

Requirements: Node.js and a PostgreSQL server you control. No paid service is required.

1. Run `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Create an empty PostgreSQL database and update `DATABASE_URL` (and `DIRECT_URL` for Supabase/migrations).
4. Apply the committed migration with `npm run db:deploy`, or rely on `npm run build` which runs migrate + optional admin bootstrap.
5. Optionally create clearly marked development masters with `npm run db:seed`.
6. Start with `npm run dev`.

## First administrator and login

Authentication uses Better Auth with PostgreSQL-backed sessions and its built-in `scrypt` password hashing. Configure `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` from `.env.example`; never commit real values.

Temporarily set `FIRST_ADMIN_NAME`, `FIRST_ADMIN_EMAIL`, `FIRST_ADMIN_USERNAME`, and `FIRST_ADMIN_PASSWORD`. On Vercel, add the same values for the first production deploy; `npm run build` runs migrations and creates the first admin automatically when those vars are present. You can also run `npm run auth:bootstrap-admin` locally.

Remove the four temporary credential values afterwards. Bootstrap skips if an administrator already exists or if the vars are unset. Sign in at `/login`, then use **Settings → Users** to create the second Admin and two Office Staff accounts, reset passwords, or activate/deactivate accounts.

ADMIN can manage masters, users, reductions/cancellations, and protected deletion. OFFICE_STAFF can manage dealer information, add orders, dispatch, view planning/history, and print packing sheets. Product master changes, user management, and reductions/cancellations are enforced as Admin-only on the server.

Set `NEXT_PUBLIC_DATA_PROVIDER="postgres"` only after applying the migration. If PostgreSQL is not configured, leave it unset and the browser-local development layer remains usable. Existing browser data is not silently copied because guessing mappings for permanent business history would be unsafe.

## Production migration and backup

On Vercel, set `DATABASE_URL` (pooler) and `DIRECT_URL` (session/direct on port 5432). Each production build runs `prisma migrate deploy` automatically. Do not use `prisma migrate dev` against production. The development seed refuses production use unless `ALLOW_DEV_SEED=true` is deliberately set.

To move providers later: back up PostgreSQL, restore it into the new PostgreSQL service, change `DATABASE_URL` / `DIRECT_URL`, redeploy (or run `npm run db:deploy`), and run the checks. The UI does not need rebuilding because it depends on repository interfaces rather than Prisma.

## Checks

- `npm run db:validate`
- `npm run test:database-architecture`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

Connection, migration, seed, restart-persistence, and multi-user concurrency checks require a real PostgreSQL `DATABASE_URL`. Schema and generated migration checks work without a running server.

## Development seed

The optional seed creates three test dealers, four normal products, one Fan Rod product, seven sizes, six colours, and three gauges. It creates no orders or transaction history and does not import browser-local records.
