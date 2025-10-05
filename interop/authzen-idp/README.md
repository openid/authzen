# AuthZEN IdP Interop

## Overview

AuthZEN IdP Interop is a full-stack React Router v7 application that showcases how an OpenID Connect identity provider (IdP) can drive AuthZEN policy evaluation through pluggable policy decision points (PDPs). It guides a user through an authentication flow, surfaces the returned ID token, and forwards authorization checks to the selected PDP while capturing a combined authentication/authorization audit trail.

## Architecture at a Glance

- **Framework** – React Router v7 in framework mode provides loaders/actions, SSR, and file-based hydration. Component code lives in `app/`, with routes configured in `app/routes.ts`.
- **Identity Provider flow** – The default IdP integration is Auth0 (`app/routes/idp/auth0.ts`). The route loader handles both `/login` initiation and `/callback` response handling via `@badgateway/oauth2-client`.
- **PDP proxy** – `app/routes/authorize.ts` receives `POST /access/*` requests, forwards them to the active PDP using `app/lib/pdpClient.ts`, and streams the PDP JSON back to the client.
- **State & telemetry** – `app/lib/pdpState.ts` tracks the active PDP sourced from environment configuration, and `app/lib/auditLog.ts` records structured authentication (`AuthN`) and authorization (`AuthZ`) events for display in the UI (`app/components/audit-log.tsx`).

## Directory Layout

- `app/routes/home.tsx` – primary UI: login entry point, ID token display, PDP selector, and audit log panel.
- `app/routes/idp/` – IdP-specific route modules, each importing types from `./+types/<route>`.
- `app/lib/` – shared logic (audit log store, JWT decoding, PDP client helpers).
- `app/data/` – server-only data loaders, including PDP configuration ingestion from environment variables.
- `public/` – static assets served as-is.
- `build/` – generated server/client assets after `pnpm build` (do not edit).

## Adding an Additional Identity Provider

1. **Create a new route module** under `app/routes/idp/<provider>.ts` that mirrors `app/routes/idp/auth0.ts`. Import route types as `import type { Route } from "./+types/<provider>";` and implement a loader that handles both the `/login` kickoff and the `/callback` return.
2. **Register the route** in `app/routes.ts`, e.g. `route("/idp/okta/*", "routes/idp/okta.ts")`. Run `pnpm typecheck` to generate the new `./+types/okta` module.
3. **Instrument audit logging** via `pushAuditLog(AuditType.AuthN, …)` to keep the Authentication log consistent.
4. **Expose a login entry point** by adding a button or link in `app/routes/home.tsx` that points to `/idp/<provider>/login`.
5. **Configure provider-specific secrets** (e.g., `OKTA_DOMAIN`, `OKTA_CLIENT_ID`, etc.) and document them in your environment management system.

## Adding a Policy Decision Point

1. **Extend `PDP_CONFIG`.** Add another entry to the JSON map with the PDP name and `host` URL. Include any static headers (for example, API keys) required by that PDP.
2. **Re-encode the JSON** and update the environment variable. The app reads `PDP_CONFIG` at startup; restart the server after changing it.
3. **Verify selection in the UI.** The new PDP appears in the selector rendered by `PDPPicker`. Choosing it updates the active PDP via the home route action.
4. **Exercise the PDP.** Trigger authorization requests from the UI or via direct `curl` calls to `/access/*` to ensure responses are logged under the new PDP identifier.

## Prerequisites

- Node.js 20+
- pnpm 8+ (Corepack ships with Node 20; run `corepack enable` once)
- An Auth0 application (or alternative OIDC provider) with redirect URI `https://<base-url>/idp/auth0/callback`
- One or more reachable PDP endpoints that expose AuthZEN-compatible APIs

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Copy `.env.example` (if present) or create `.env` with the required variables described below.
3. Start the dev server:
   ```bash
   pnpm dev
   ```
   The app listens on `http://localhost:5173` by default.

## Environment Variables

### Identity Provider (Auth0 example)

- `BASE_URL` – public origin of this app (e.g. `http://localhost:5173` in development).
- `AUTH0_DOMAIN` – issuer base URL, including `https://` (e.g. `https://your-tenant.us.auth0.com`).
- `AUTH0_CLIENT_ID` / `AUTH0_CLIENT_SECRET` – credentials for the Auth0 application.

### PDP Configuration (`PDP_CONFIG`)

`PDP_CONFIG` must be a base64-encoded JSON object mapping PDP identifiers to connection metadata (`app/data/pdps.server.ts`). Each entry requires a `host` and can optionally provide static HTTP headers.

Example JSON payload (before encoding):

```json
{
  "cerbos-cloud": {
    "host": "https://demo-pdp.cerbos.cloud",
    "headers": {
      "Authorization": "Bearer <token-from-cerbos>"
    }
  },
  "local": {
    "host": "http://localhost:3593"
  }
}
```

Encode and export it (macOS/Linux):

```bash
export PDP_CONFIG=$(printf '%s' '{"cerbos-cloud":{"host":"https://demo-pdp.cerbos.cloud","headers":{"Authorization":"Bearer <token>"}},"local":{"host":"http://localhost:3593"}}' | base64)
```

On Windows PowerShell:

```powershell
$env:PDP_CONFIG = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('{"local":{"host":"http://localhost:3593"}}'))
```

The UI lists all keys in this object and makes the first entry the default PDP.

## Running, Building, and Deploying

- **Develop:** `pnpm dev` (SSR + HMR + automatic route-type generation).
- **Type safety:** `pnpm typecheck` regenerates `./+types/*` files and validates the project.
- **Formatting & linting:** `pnpm lint:fix` runs Biome.
- **Production build:**
  ```bash
  pnpm build
  pnpm start
  ```
  `pnpm start` serves the SSR build from `build/`.
- **Docker:** Use the provided `Dockerfile` (`docker build -t authzen-idp .` followed by `docker run -p 3000:3000 authzen-idp`).

## Working with the Authorization Proxy

`POST /access/*` requests mirror the downstream PDP API. For example, with `PDP_CONFIG` containing a PDP key `cerbos-cloud` whose host exposes `/access/check`, the UI will POST to `/access/check` and forward the body and headers defined in the configuration.

Manual test with curl while the dev server runs:

```bash
curl \
  -X POST http://localhost:5173/access/check \
  -H 'Content-Type: application/json' \
  -d '{"inputs":[{"resource":{"kind":"document","id":"1"},"principal":{"id":"demo","roles":["admin"]},"actions":["view"]}]}'
```

Responses and errors are emitted into the Authorization audit log panel.

## Observability and Troubleshooting

- The **Authentication log** records IdP milestones (login start, callback, token exchange success/failure).
- The **Authorization log** stores each PDP request with request/response payloads. Logs are capped at 100 entries; use the "Clear log" action if the display becomes noisy.
- The **ID Token inspector** decodes and displays JWT payload claims (including the AuthZEN `level` claim when present).
- Run `pnpm typecheck` if you see missing `./+types/...` imports; do not alter the import paths.
