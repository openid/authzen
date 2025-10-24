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

- Framework: React Router v7 in framework mode (loaders/actions, SSR, hydrated SPA). Source lives under `app/`; the route tree is defined in `app/routes.ts`.
- Identity provider flow: Route `app/routes/idp/handler.ts` dispatches to provider handlers created from `IDP_CONFIG` by `app/data/idps.server.ts` using `app/lib/create-idp-handler.ts`. Each handler drives `/login` and `/callback` using `@badgateway/oauth2-client`.
- PDP proxy: `app/routes/authorize.ts` receives `POST /access/*`, forwards the request via `app/lib/pdpClient.ts`, and streams the PDP JSON response to the browser.
- State & telemetry: `app/lib/pdpState.ts` tracks the active PDP derived from configuration. `app/lib/auditLog.ts` publishes AuthN/AuthZ events rendered by `app/components/audit-log.tsx`.

### Key Files

- `app/routes/home.tsx` – main UI: login controls, ID token viewer, PDP selector, audit log.
- `app/routes/idp/handler.ts` – generic IdP route that dispatches `/idp/:idp/*` to a provider handler created from env config.
- `app/data/idps.server.ts` – loads `IDP_CONFIG` and instantiates provider handlers via `create-idp-handler`.
- `app/lib/` – PDP client, JWT helpers, audit log store, IdP handler factory.
- `app/data/` – server-only loaders including PDP configuration ingestion.
- `public/` – static assets.
- `build/` – generated output from `pnpm build` (never edit by hand).

## Configuration

- `BASE_URL` – public origin of the app (e.g. `http://localhost:5173` in local dev).
- `IDP_CONFIG` – base64-encoded JSON array of IdP configurations (see example below). Used by `app/data/idps.server.ts`.
- `PDP_CONFIG` – base64-encoded JSON object mapping PDP names to config (see example below). Used by `app/data/pdps.server.ts`.

## Extending the App

### Add an Identity Provider

IdPs are configured via the `IDP_CONFIG` env variable which is a base64-encoded array of IdP configurations:

```json
[
  {
    "slug": "auth0", //used in the callback slug
    "label": "Auth0", //used in the UI
    "oauthClient": {
      // OAuth client settings
      "server": "https://authzen-idp-demo.eu.auth0.com",
      "clientId": "....",
      "clientSecret": "...",
      "discoveryEndpoint": "/.well-known/openid-configuration"
    }, // Optional extra params to send during OAuth request
    "extraParams": {
      "prompt": "login"
    }
  }
]
```

- `server` should point to the IdP issuer/domain.
- The callback URL is derived automatically as `${BASE_URL}/idp/<slug>/callback`. (The production `BASE_URL` is `https://sts.authzen-interop.net`). Ensure the redirect URI `${BASE_URL}/idp/<slug>/callback` is registered with the IdP OAuth Client.

Once your client is set up, send it to alex@cerbos.dev for deployment to the demo application.

### Adding a PDP

Example `PDP_CONFIG` (before base64-encoding):

```json
{
  "cerbos": {
    "host": "https://pdp.example.com",
    "headers": { "Authorization": "Bearer <token>" }
  },
  "opa": { "host": "http://localhost:8181" }
}
```

Once your PDP is set up, send the details to alex@cerbos.dev for deployment to the demo application.
