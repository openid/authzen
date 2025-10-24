import { generateCodeVerifier, OAuth2Client } from "@badgateway/oauth2-client";
import { createCookie, redirect } from "react-router";
import { clearAuditLog, pushAuditLog } from "~/lib/auditLog";
import { AuditType } from "~/types/audit";
import type { Route } from "./+types/curity";

type OidcDiscovery = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint?: string;
};

let discoveryPromise: Promise<OidcDiscovery> | null = null;

async function discover(issuerBase: string): Promise<OidcDiscovery> {
  if (!discoveryPromise) {
    const wellKnown = buildWellKnownUrl(issuerBase);
    discoveryPromise = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(wellKnown, { signal: controller.signal });
        if (!res.ok) throw new Error(`OIDC discovery failed (${res.status}) at ${wellKnown}`);
        const data = (await res.json()) as OidcDiscovery;
        if (!data.authorization_endpoint || !data.token_endpoint) {
          throw new Error("OIDC discovery missing required endpoints.");
        }
        return data;
      } finally {
        clearTimeout(timeout);
      }
    })();
  }
  return discoveryPromise;
}

function buildWellKnownUrl(issuerBase: string): string {
  const trimmed = issuerBase.endsWith("/") ? issuerBase.slice(0, -1) : issuerBase;
  return `${trimmed}/.well-known/openid-configuration`;
}

function getCurityConfig() {
  return {
    baseUrl: getRequiredEnv("BASE_URL"),
    issuer: getRequiredEnv("ISSUER"),
    clientId: getRequiredEnv("CLIENT_ID"),
    clientSecret: getRequiredEnv("CLIENT_SECRET"),
    scope: (process.env.SCOPE ?? "openid profile email").split(/\s+/),
  };
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function buildCallbackUrl(baseUrl: string): string {
  const normalized = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL("idp/curity/callback", normalized).toString();
}

const pkceCookie = createCookie("authzen:curity:pkce", {
  httpOnly: true,
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 300, 
});

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);

  if (url.pathname.endsWith("/login")) {
    return initiateLogin();
  }

  if (url.pathname.endsWith("/callback")) {
    return handleCallback(request);
  }

  return redirect("/");
}

async function initiateLogin() {
  clearAuditLog();
  pushAuditLog(AuditType.AuthN, { message: "Initiating Curity login", idp: "curity" });

  const cfg = getCurityConfig();
  const callbackUrl = buildCallbackUrl(cfg.baseUrl);
  const meta = await discover(cfg.issuer);

  const client = new OAuth2Client({
    server: meta.issuer || cfg.issuer,
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
    authorizationEndpoint: meta.authorization_endpoint,
    tokenEndpoint: meta.token_endpoint,
  });

  const codeVerifier = await generateCodeVerifier();

  const authorizationUrl = await client.authorizationCode.getAuthorizeUri({
    redirectUri: callbackUrl,
    scope: cfg.scope,
    codeVerifier,
    extraParams: { prompt: "login" },
  });

  return redirect(authorizationUrl, {
    headers: { "Set-Cookie": await pkceCookie.serialize(codeVerifier) },
  });
}

async function handleCallback(request: Request) {
  pushAuditLog(AuditType.AuthN, { message: "Handling Curity callback", idp: "curity" });

  const codeVerifier = await readPkceVerifier(request);
  if (!codeVerifier) {
    pushAuditLog(AuditType.AuthN, {
      message: "Missing PKCE code verifier cookie during Curity callback",
      idp: "curity",
      ok: false,
    });
    return redirectWithClearedCookie("/");
  }

  try {
    const cfg = getCurityConfig();
    const callbackUrl = buildCallbackUrl(cfg.baseUrl);
    const meta = await discover(cfg.issuer);

    const client = new OAuth2Client({
      server: meta.issuer || cfg.issuer,
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
      authorizationEndpoint: meta.authorization_endpoint,
      tokenEndpoint: meta.token_endpoint,
    });

    const tokenResponse =
      await client.authorizationCode.getTokenFromCodeRedirect(request.url, {
        redirectUri: callbackUrl,
        codeVerifier,
      });

    const idToken = tokenResponse.idToken;
    const accessTokenIssued = Boolean(tokenResponse.accessToken);
    const idTokenIssued = Boolean(idToken);

    pushAuditLog(AuditType.AuthN, {
      message: "Successfully obtained OAuth2 token from Curity",
      idp: "curity",
      response: { accessTokenIssued, idTokenIssued },
      ok: idTokenIssued,
    });

    if (!idToken) {
      return redirectWithClearedCookie("/");
    }
    return redirectWithClearedCookie(`/#id_token=${idToken}`);
  } catch (error) {
    pushAuditLog(AuditType.AuthN, {
      message: `Error obtaining OAuth2 token: ${(error as Error).message}`,
      idp: "curity",
      ok: false,
    });
    return redirectWithClearedCookie("/");
  }
}

async function readPkceVerifier(request: Request): Promise<string | undefined> {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return undefined;
  const codeVerifier = await pkceCookie.parse(cookieHeader);
  return typeof codeVerifier === "string" && codeVerifier.length > 0 ? codeVerifier : undefined;
}

async function redirectWithClearedCookie(location: string) {
  return redirect(location, {
    headers: { "Set-Cookie": await pkceCookie.serialize("", { maxAge: 0 }) },
  });
}