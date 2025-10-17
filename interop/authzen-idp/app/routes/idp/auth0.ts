import { generateCodeVerifier, OAuth2Client } from "@badgateway/oauth2-client";

import { createCookie, redirect } from "react-router";
import { clearAuditLog, pushAuditLog } from "~/lib/auditLog";
import { AuditType } from "~/types/audit";
import type { Route } from "./+types/auth0";

const auth0Config = getAuth0Config();
const client = new OAuth2Client(auth0Config.client);
const callbackUrl = buildCallbackUrl(auth0Config.baseUrl);
const auth0Scopes = ["openid", "profile", "email"] as const;

const pkceCookie = createCookie("authzen:auth0:pkce", {
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
  pushAuditLog(AuditType.AuthN, {
    message: "Initiating Auth0 login",
    idp: "auth0",
  });

  const codeVerifier = await generateCodeVerifier();

  const authorizationUrl = await client.authorizationCode.getAuthorizeUri({
    redirectUri: callbackUrl,
    scope: [...auth0Scopes],
    codeVerifier,
    extraParams: {
      prompt: "login",
    },
  });

  return redirect(authorizationUrl, {
    headers: {
      "Set-Cookie": await pkceCookie.serialize(codeVerifier),
    },
  });
}

async function handleCallback(request: Request) {
  pushAuditLog(AuditType.AuthN, {
    message: "Handling Auth0 callback",
    idp: "auth0",
  });

  const codeVerifier = await readPkceVerifier(request);
  if (!codeVerifier) {
    pushAuditLog(AuditType.AuthN, {
      message: "Missing PKCE code verifier cookie during Auth0 callback",
      idp: "auth0",
      ok: false,
    });
    return redirectWithClearedCookie("/");
  }

  try {
    const tokenResponse =
      await client.authorizationCode.getTokenFromCodeRedirect(request.url, {
        redirectUri: callbackUrl,
        codeVerifier,
      });

    const idToken = tokenResponse.idToken;
    const accessTokenIssued = Boolean(tokenResponse.accessToken);
    const idTokenIssued = Boolean(idToken);

    pushAuditLog(AuditType.AuthN, {
      message: "Successfully obtained OAuth2 token from Auth0",
      idp: "auth0",
      response: {
        accessTokenIssued,
        idTokenIssued,
      },
      ok: idTokenIssued,
    });

    if (!idToken) {
      return redirectWithClearedCookie("/");
    }

    return redirectWithClearedCookie(`/#id_token=${idToken}`);
  } catch (error) {
    pushAuditLog(AuditType.AuthN, {
      message: `Error obtaining OAuth2 token: ${(error as Error).message}`,
      idp: "auth0",
      ok: false,
    });
    return redirectWithClearedCookie("/");
  }
}

async function readPkceVerifier(request: Request): Promise<string | undefined> {
  const cookieHeader = request.headers.get("Cookie");

  if (!cookieHeader) {
    return undefined;
  }

  const codeVerifier = await pkceCookie.parse(cookieHeader);
  return typeof codeVerifier === "string" && codeVerifier.length > 0
    ? codeVerifier
    : undefined;
}

async function redirectWithClearedCookie(location: string) {
  return redirect(location, {
    headers: {
      "Set-Cookie": await pkceCookie.serialize("", { maxAge: 0 }),
    },
  });
}

function getAuth0Config() {
  return {
    baseUrl: getRequiredEnv("BASE_URL"),
    client: {
      server: getRequiredEnv("AUTH0_DOMAIN"),
      clientId: getRequiredEnv("AUTH0_CLIENT_ID"),
      clientSecret: getRequiredEnv("AUTH0_CLIENT_SECRET"),
    },
  };
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function buildCallbackUrl(baseUrl: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL("idp/auth0/callback", normalizedBase).toString();
}
