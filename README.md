# Triger storefront

The existing Next.js 16 / React 19 / TypeScript UI is retained, including its
scroll animation, globe, product cards, colors, and page layout. This is **not a
Vite app**. Migrating it to Vite would discard working Next.js routing and font
handling without helping the store.

```text
Browser: existing React / Next.js storefront (Vercel, repository root)
    -> same-origin /api proxy (Next.js rewrites)
    -> Express 5 / TypeScript REST API (separate Vercel project, backend/)
    -> Prisma ORM -> managed PostgreSQL
```

The API can also run on conventional Node hosting with `npm start`. It has no
filesystem persistence, background workers, or mandatory long-running listener
in its Vercel entry point. PostgreSQL runs separately, never inside Vercel.
See [Vercel's Express deployment documentation](https://vercel.com/docs/frameworks/backend/express).

## Requirements and folders

- Node.js **22.13+** within the Node 22 line (local validation used 22.12; npm warned
  that the ESLint toolchain requires a newer patch). Select Node 22 in Vercel.
- npm; PostgreSQL 17 or 18 for local development; a managed PostgreSQL service for production.
- `app/`, `components/`, `lib/`, `public/`: frontend and existing assets.
- `backend/src/app.ts`: exported Vercel Express app; `src/server.ts`: conventional listener.
- `backend/src/services/`: catalog, authentication, cart, orders, payment boundaries.
- `backend/prisma/`: schema, committed initial migration, development seed.
- `backend/tests/`: real database integration, production cookie, and proxy smoke tests.

Prisma client/CLI are pinned together to 6.12.0. The initially evaluated 6.19.2
CLI dependency tree reported high-severity advisories; the selected version
passed database/build verification and npm audit. Review client/CLI upgrades
together and rerun the isolated suite; do not apply an unreviewed major upgrade.

## Local setup

Install both independently locked packages:

```sh
npm install
npm --prefix backend install
```

Copy `.env.example` to root `.env.local`, and `backend/.env.example` to
`backend/.env`. Preserve any existing local environment values rather than
overwriting them. These secret files are ignored; only the example files are tracked.

Create a dedicated local database and a dedicated database role using your
PostgreSQL administrator tools. Choose your own strong password; none is shipped
in this repository. Supply that connection URI in `backend/.env`. URL-encode
special characters in credentials. Set `DATABASE_URL` and `DIRECT_URL` to the
same connection locally. Use separate development, testing, preview and production databases.

Run from the repository root:

```sh
npm --prefix backend run db:validate
npm --prefix backend run db:generate
npm --prefix backend run db:deploy
npm --prefix backend run db:seed
npm run dev:api
```

In a second terminal, `npm run dev` starts the frontend on localhost port 3000.
The API defaults to port 4000. Root `API_BACKEND_URL` must match that API origin.
The frontend requests `/api` and sends cookies via `credentials: 'include'`.

The seed creates three example categories and the six original product designs,
with illustrative **EUR 20.00** prices and example stock. This is not a conversion
of the old static KM prices. It creates no users, passwords, or administrators,
does not overwrite existing products, and refuses to run in production.

## Environment variables

Frontend variables (root `.env.local`, or frontend Vercel settings):

| Variable | Purpose |
| --- | --- |
| `API_BACKEND_URL` | Server-only Express origin without path/trailing slash. Required for production build; HTTPS for production deployments. Rebuild after changing it. |
| `NEXT_PUBLIC_API_URL` | Public browser API base; use `/api` for the same-origin proxy. Never put credentials or secrets here. |

Backend variables (`backend/.env`, or backend host settings):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Runtime PostgreSQL connection; use managed service pooling and TLS in production. |
| `DIRECT_URL` | Direct PostgreSQL connection for migration CLI; use the provider's TLS configuration. |
| `FRONTEND_URL` | Exact allowed frontend origin; HTTPS required in production, no trailing slash. |
| `ADDITIONAL_FRONTEND_ORIGINS` | Optional comma-separated exact origins, e.g. approved previews. No wildcards. |
| `NODE_ENV` | `development`, `test`, or `production`. Set production on deployment. |
| `PORT` | Local/conventional server port; default 4000. |
| `SESSION_DAYS` | Session expiration, 1–30 days; default 7. |
| `SHIPPING_AMOUNT` | Server-controlled EUR decimal string; default `0.00`. Confirm your shipping policy before launch. |
| `TRUST_PROXY_HOPS` | Trusted reverse-proxy hop count; default 0. Configure for the actual hosting/proxy topology. |

No `JWT_SECRET` is needed: authentication uses random opaque tokens in HttpOnly
cookies, with only token hashes stored in PostgreSQL. No authentication token is
stored in localStorage. `NEXT_PUBLIC_` values are exposed to browsers, as `VITE_`
values would be in Vite; never prefix database credentials or secrets this way.
Do not paste connection strings into issues, command logs, or Git.

## Database and migrations

Models: **User, Session, Address, Category, Product, Cart, CartItem, Order, OrderItem**.
Users default to CUSTOMER; ADMIN cannot be chosen during registration. Addresses
default to DE. All monetary columns are PostgreSQL `DECIMAL(12,2)`, and backend
arithmetic uses `Prisma.Decimal`. EUR is the only initial order currency.

Unique constraints protect emails, slugs, one cart per user, one item per
cart/product, session hashes, payment references, and user/order idempotency keys.
Foreign keys and indexes cover ownership and lookup paths. Deleting a user removes
addresses/cart/sessions but is restricted when orders exist. Category deletion is
restricted while any product exists. Product DELETE soft-deactivates the product.
Historical order name/price snapshots survive product changes; hard deletion of
a product sets the historical item product reference to null. Order deletion
cascades its items. SQL CHECK constraints enforce nonnegative money/stock,
valid quantities, EUR, and consistent order totals.

For future **development** schema changes:

```sh
npm --prefix backend run db:migrate -- --name describe_change
npm --prefix backend run db:generate
```

Commit reviewed schema and SQL migration files. Development migration creation
requires shadow-database privileges (or a configured shadow database). Do not use
`migrate dev`, `db push`, `migrate reset`, or the example seed on production.

For **production**, after backup and SQL review, run the following once from a
trusted release runner with the target environment variables, before promoting
the new API deployment:

```sh
npm --prefix backend run db:deploy
```

The migration uses `DIRECT_URL`. The runtime uses `DATABASE_URL`. Run deployment
migrations as a controlled release step, not in every Vercel preview build or at
application startup. Build commands generate Prisma client but never migrate.
For future changes use backward-compatible expand/backfill/contract migrations.

## REST API

Write bodies are validated and unknown fields are rejected. Set JSON content type.
Browser write requests must include a configured `Origin`; this also protects
cookie-authenticated routes from CSRF. For manual API clients explicitly set that
Origin and maintain a cookie jar. CORS is limited to the configured origins.

| Endpoint | Access and behavior |
| --- | --- |
| `POST /api/auth/register` | Email, password (12+ characters, at most 72 UTF-8 bytes), firstName, lastName; signs in as CUSTOMER. |
| `POST /api/auth/login` | Email/password; rotates current session. |
| `POST /api/auth/logout` | Revokes session and clears cookie. |
| `GET /api/auth/me` | Authenticated safe user fields; never passwordHash. |
| `GET /api/products` | Public; optional `slug`, `categoryId`, `page`, `limit` (max 100). Active products only. |
| `GET /api/products/:id` | Public active product. |
| `POST /api/products` | ADMIN; name, slug, description, decimal-string price, integer stock, imageUrl, categoryId, optional isActive. |
| `PATCH /api/products/:id` | ADMIN; validated partial product body. |
| `DELETE /api/products/:id` | ADMIN; soft deactivation. |
| `GET /api/categories` / `GET /api/categories/:id` | Public reads. |
| `POST /api/categories` | ADMIN; name and slug. |
| `PATCH /api/categories/:id` / `DELETE /api/categories/:id` | ADMIN; partial update / delete empty category. |
| `GET /api/cart` | Authenticated user's cart, current database products, server subtotal. |
| `POST /api/cart/items` | Authenticated; productId and integer quantity 1–99; checks active product, resulting quantity and stock. |
| `PATCH /api/cart/items/:id` | Authenticated owner; replacement quantity. |
| `DELETE /api/cart/items/:id` | Authenticated owner. |
| `POST /api/orders` | Authenticated; UUID `idempotencyKey` only. Server snapshots/recalculates cart and clears it atomically. |
| `GET /api/orders` / `GET /api/orders/:id` | Authenticated owner's orders only. List capped at latest 100. |
| `POST /api/checkout` | Authenticated stub; 501, no provider calls or payment creation. |
| `POST /api/webhooks/payment` | Raw-body stub; 501, never marks paid. |
| `GET /api/health` | Database readiness check; no connection details returned. |

Order creation uses serializable transactions with bounded conflict retries and
idempotency to prevent repeated submission from duplicating an order. It checks
availability but **does not reserve/decrement stock yet**: these are unpaid drafts,
not accepted fulfillable orders. Orders start AWAITING_PAYMENT / PENDING and have
null provider/reference fields. Monetary API values are decimal strings.

## Frontend behavior

Product prices and catalog data come from the API; only the original product card
numbering/colors remain local. The cart page contains sign-in/register/logout
controls and an explicit **prepare order (no payment)** action. Loading and API
errors are surfaced. Guest selections remain in browser storage; an authenticated
user has a separate database cart. Guest carts are not automatically merged.
Inactive items already in an account cart remain visible so they can be removed.

## First ADMIN

Register the intended account through the normal UI using a unique strong
password. Verify the account belongs to the intended administrator. From a trusted
operator machine/release runner with the intended database environment, run:

```sh
npm --prefix backend run admin:promote -- administrator-email
```

This promotes an existing account only and revokes its existing sessions; sign in
again. No public promotion endpoint, default administrator, seed password, or
production password exists. Restrict access to this operator command/database.

## Security and production deployment

Helmet, restricted credentialed CORS, Origin checks, 32 KiB JSON limits, input
validation, database ownership checks, ADMIN middleware and centralized sanitized
errors are configured. Passwords use bcrypt cost 12; session tokens use 256 bits
of randomness and SHA-256 at rest. Production cookies are `__Host-` prefixed,
HttpOnly, Secure, SameSite=Lax, host-only, with path `/` and expiration. Use the
same-origin proxy: separate unrelated frontend/API domains can cause third-party
cookie problems. Responses use `Cache-Control: no-store` for user data safety.

Auth write requests have a supplemental per-instance rate limiter. Configure an
edge/distributed rate limit on the hosting platform for production, especially
for login/register and when scaling to multiple Vercel instances. Verify trusted
proxy hops against the actual frontend-to-API path; do not blindly trust all hops.

Suggested managed database: **Neon PostgreSQL in an EU region near Frankfurt**, or
an equivalent managed service with pooling, TLS, backups and restore testing.
See [Neon's Prisma connection guidance](https://neon.com/docs/guides/prisma)
and [available regions](https://neon.com/docs/introduction/regions).
Use pooled credentials for runtime and direct credentials for migration jobs,
least-privilege runtime roles, and separate preview databases. Review the
provider's region, retention, DPA and pricing yourself before provisioning;
no infrastructure or paid service was created by this change.

Deploy in this order:

1. Provision/select managed PostgreSQL and configure backup/restore and TLS.
2. Create/select the **API** Vercel project with Root Directory `backend`, Express
   framework and Node 22. `backend/vercel.json` configures Frankfurt execution.
   Configure backend environment variables in Vercel, including the intended
   frontend origin, then apply reviewed production migrations from your release runner.
3. Build/deploy API. Verify `/api/health`. The API root can alternatively be hosted
   on a Node platform using `npm ci`, `npm run build`, `npm start` in `backend/`.
4. Select the existing **frontend** Vercel project referenced in ignored
   `.vercel/repo.json` (project name `trigger`, repository root `.`). Configure
   `API_BACKEND_URL` to the deployed HTTPS API origin and `NEXT_PUBLIC_API_URL=/api`.
   Use `vercel.json`, Next.js framework, Node 22, `npm ci`, `npm run build`.
5. Build locally with the same configuration, then deploy through the authorized
   Vercel account/Git integration or an installed authenticated CLI. Verify the
   deployed pages, cookie flow, API proxy and production origins after deployment.
6. Register/promote the first ADMIN and enter real catalog/prices/stock. Confirm
   shipping amount. Do not seed example products into production.

No deployment was performed in this session: Vercel CLI was not available on PATH,
and no standard `.vercel/project.json` link was present. Existing `.env.local`
contains a Vercel token variable; its contents were neither copied nor disclosed.
There is no newly verified deployment URL and no production database migration.
Account authorization, project linking/selection, paid provisioning and secret
entry require the owner's action. Do not deploy a frontend proxy pointing to
localhost; the local smoke-test build uses localhost only for isolated validation.

Before accepting real German customer orders, confirm your actual gross EUR
pricing/VAT, shipping destinations/charges, delivery promises and customer-facing
legal/privacy/returns content. The existing FAQ currently mentions UK shipping;
that claim and sample ingredient text need business review. Legal/tax content,
email verification/recovery, fulfillment, address capture and an admin UI are not
implemented in this preparation scope. Account/cart services are usable without payments.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build:api
npm run build
npm run test:api
npm audit
npm --prefix backend audit
```

The isolated test runner creates a disposable real PostgreSQL cluster in the OS
temporary directory with a generated password and an unused loopback port,
applies the committed migration, validates status, seeds, tests, and shuts down
and removes its own cluster. It never uses an existing database. Set `PG_BIN` to
your PostgreSQL bin directory; on Windows the default is PostgreSQL 18's standard
installation directory. On Unix use `PG_BIN=$(pg_config --bindir)` and run as a
normal user, not root. Do not set production connection strings for these tests.

After building both packages with frontend `API_BACKEND_URL=http://localhost:4000`,
also test the built pages/proxy:

```sh
TEST_FRONTEND_PROXY=1 npm run test:api
```

PowerShell: `$env:TEST_FRONTEND_PROXY='1'; npm run test:api`. Port 4000 must be free.
The runner tests schema/client generation, migration application/status, seed,
registration/login/logout/me, password/token hashing, session expiry/rotation,
cookie flags, CORS/CSRF, ADMIN rejection and CRUD, cart ownership/quantity/stock,
concurrent adds, decimal totals, historical snapshots, order idempotency,
PENDING status and disabled payment endpoints. The proxy smoke test checks built
page HTTP responses and session cookies through Next.js. It is not a browser
visual or mobile accessibility audit. `.github/workflows/verify.yml` repeats these
checks on GitHub; the hosted workflow itself has not been run in this session.

## Exact next step: payment integration

Choose a provider and sandbox account, and define shipping/tax and stock
reservation/expiry rules. Implement the provider adapter in
`backend/src/services/payment.ts`; checkout must validate ownership and stored
order totals, reserve/revalidate stock, create an idempotent provider session and
persist provider/reference. Extend the schema with a unique provider event ledger
and any reservation/address snapshots needed before accepting payments.

The existing raw-body webhook route must verify signatures **before** parsing,
deduplicate events, and match order reference, amount and currency. Only verified
successful provider events may atomically set paymentStatus=PAID and
status=PROCESSING and start fulfillment. Test replay, tampering, mismatched totals,
failure, refunds, and reservation expiry. A frontend success URL never marks an
order paid. No Stripe, PayPal, Klarna or other provider is installed or connected.
