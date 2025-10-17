# AuthZEN IdP Interop

AuthZEN IdP Interop demonstrates how an OpenID Connect identity provider (IdP) can drive AuthZEN policy evaluation through pluggable policy decision points (PDPs). The app walks a user through login, displays the issued ID token, and forwards authorization decisions to the selected PDP while recording a combined AuthN/AuthZ audit trail.

## Quick Start

1. Install prerequisites: Node.js 20+, pnpm 8+ (`corepack enable` once).
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Configure environment variables (see [Configuration](#configuration)).
4. Launch the dev server:
   ```bash
   pnpm dev
   ```
   The app defaults to `http://localhost:5173`.

## Development Workflow

- `pnpm dev` – framework-mode SSR with HMR and automatic route-type generation.
- `pnpm typecheck` – regenerates `./+types/*` and runs the strict TypeScript check; always run after creating or renaming routes.
- `pnpm lint:fix` – Biome formatting and linting.
- `pnpm build && pnpm start` – production build and SSR server.
- Docker: `docker build -t authzen-idp .` and `docker run -p 3000:3000 authzen-idp`.

## Architecture

- **Framework:** React Router v7 in framework mode (loaders/actions, SSR, hydrated SPA). Source lives under `app/`; the route tree is defined in `app/routes.ts`.
- **Identity provider flow:** Default integration is Auth0 at `app/routes/idp/auth0.ts`. One loader handles `/login` initiation and `/callback` processing via `openid-client`.
- **PDP proxy:** `app/routes/authorize.ts` receives `POST /access/*`, forwards the request via `app/lib/pdpClient.ts`, and streams the PDP JSON response to the browser.
- **State & telemetry:** `app/lib/pdpState.ts` tracks the active PDP derived from configuration. `app/lib/auditLog.ts` publishes AuthN/AuthZ events rendered by `app/components/audit-log.tsx`.

### Key Files

- `app/routes/home.tsx` – main UI: login controls, ID token viewer, PDP selector, audit log.
- `app/routes/idp/` – IdP modules; each must import types with `import type { Route } from "./+types/<file>";`.
- `app/lib/` – PDP client, JWT helpers, audit log store.
- `app/data/` – server-only loaders including PDP configuration ingestion.
- `public/` – static assets.
- `build/` – generated output from `pnpm build` (never edit by hand).

## Extending the App

### Add an Identity Provider

1. Copy `app/routes/idp/auth0.ts` to `app/routes/idp/<provider>.ts` and adapt it. Keep the combined `/login` + `/callback` loader structure.
2. Register the route in `app/routes.ts`, e.g. `route("/idp/okta/*", "routes/idp/okta.ts")`, then run `pnpm typecheck` to generate `./+types/<provider>`.
3. Emit authentication audit entries with `pushAuditLog(AuditType.AuthN, …)` to remain consistent with the home view.
4. Surface a login trigger in `app/routes/home.tsx` that points to `/idp/<provider>/login`.
5. Share any new secrets (e.g. `OKTA_DOMAIN`, `OKTA_CLIENT_ID`) with Alex Olivier for production rotation.

### Add a Policy Decision Point

1. Extend `PDP_CONFIG` with a new key that contains the PDP name, `host`, and optional static headers.
2. Base64-encode the updated JSON and redeploy. The config is read at startup, so restart the server after updating it.
3. Confirm the PDP appears in the UI picker rendered by `PDPPicker`. Selecting it updates the active PDP through the home route action.
4. Exercise the PDP via the UI or `curl /access/*` and confirm entries in the authorization audit log.

## Configuration

### Identity Provider (Auth0 example)

- `BASE_URL` – public origin of the app (`http://localhost:5173` in local dev).
- `AUTH0_DOMAIN` – issuer URL with `https://` (e.g. `https://your-tenant.us.auth0.com`).
- `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` – Auth0 application credentials.

### PDP Configuration (`PDP_CONFIG`)

`PDP_CONFIG` is a base64-encoded JSON object consumed by `app/data/pdps.server.ts`. Each entry declares a PDP identifier, required `host`, and optional static headers.

```json
{
  "cerbos": {
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

Encode on macOS/Linux:

```bash
export PDP_CONFIG=$(printf '%s' '{"cerbos":{"host":"https://demo-pdp.cerbos.cloud","headers":{"Authorization":"Bearer <token>"}},"local":{"host":"http://localhost:3593"}}' | base64)
```

Encode on Windows PowerShell:

```powershell
$env:PDP_CONFIG = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('{"local":{"host":"http://localhost:3593"}}'))
```

The UI surfaces each key and defaults to the first entry.

## Observability & Troubleshooting

- The authentication log tracks IdP milestones (login initiation, callback, token exchange success/failure).
- The authorization log captures every PDP call, including request and response payloads; capped at 100 entries with a manual clear action.
- The ID token inspector decodes JWT payloads, including the AuthZEN `level` claim when present.
- Missing `./+types/...` modules indicate type generation hasn’t run; fix by running `pnpm typecheck` rather than changing import paths.
