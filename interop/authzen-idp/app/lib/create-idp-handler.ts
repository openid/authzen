import { generateCodeVerifier, OAuth2Client } from "@badgateway/oauth2-client";
import type { ClientSettings } from "@badgateway/oauth2-client/dist/client";

import { createCookie, redirect } from "react-router";
import { clearAuditLog, pushAuditLog } from "~/lib/auditLog";
import { AuditType } from "~/types/audit";
import { getRequiredEnv } from "./utils";

export interface CreateIdpHandlerOptions {
  slug: string;
  label: string;
  oauthClient: ClientSettings;
  extraParams?: Record<string, string>;
}

type OidcDiscovery = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint?: string;
};

export function createIdpHandler({
  slug,
  label,
  oauthClient,
  extraParams,
}: CreateIdpHandlerOptions) {
  const callbackUrl = buildCallbackUrl(slug);
  const scopes = ["openid", "profile", "email"];

  const pkceCookie = createCookie(`authzen:${slug}:pkce`, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 300,
  });

  async function readPkceVerifier(
    cookieHeader: string | null,
  ): Promise<string | undefined> {
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

  return {
    slug,
    label,
    loader: async function loader(request: Request) {
      let client: OAuth2Client;
      try {
        client = await getOAuthClient(oauthClient, slug);
      } catch (error) {
        return Response.json(
          {
            message: `Failed to initialize OAuth client for IDP ${slug}: ${(error as Error).message}`,
          },
          {
            status: 500,
          },
        );
      }

      const url = new URL(request.url);
      const cookieHeader = request.headers.get("Cookie");

      if (url.pathname.endsWith("/login")) {
        clearAuditLog();
        pushAuditLog(AuditType.AuthN, {
          message: `Initiating ${label} login`,
          idp: slug,
        });

        const codeVerifier = await generateCodeVerifier();

        const authorizationUrl = await client.authorizationCode.getAuthorizeUri(
          {
            redirectUri: callbackUrl,
            scope: scopes,
            codeVerifier,
            extraParams,
          },
        );

        return redirect(authorizationUrl, {
          headers: {
            "Set-Cookie": await pkceCookie.serialize(codeVerifier),
          },
        });
      }

      if (url.pathname.endsWith("/callback")) {
        pushAuditLog(AuditType.AuthN, {
          message: `Handling ${label} callback`,
          idp: slug,
        });

        const codeVerifier = await readPkceVerifier(cookieHeader);
        if (!codeVerifier) {
          pushAuditLog(AuditType.AuthN, {
            message: `Missing PKCE code verifier cookie during ${label} callback`,
            idp: slug,
            ok: false,
          });
          return redirectWithClearedCookie("/");
        }

        try {
          const tokenResponse =
            await client.authorizationCode.getTokenFromCodeRedirect(url, {
              redirectUri: callbackUrl,
              codeVerifier,
            });

          const idToken = tokenResponse.idToken;
          const accessTokenIssued = Boolean(tokenResponse.accessToken);
          const idTokenIssued = Boolean(idToken);

          pushAuditLog(AuditType.AuthN, {
            message: `Successfully obtained OAuth2 token from ${label}`,
            idp: slug,
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
            idp: slug,
            ok: false,
          });
          return redirectWithClearedCookie("/");
        }
      }

      return redirect("/");
    },
  };
}

async function getOAuthClient(
  oauthClient: ClientSettings,
  slug: string,
): Promise<OAuth2Client> {
  if (!oauthClient.server) {
    throw new Error(`OAuth client for IDP ${slug} is missing issuer`);
  }

  if (oauthClient.tokenEndpoint && oauthClient.authorizationEndpoint) {
    return new OAuth2Client({
      server: oauthClient.server,
      clientId: oauthClient.clientId,
      clientSecret: oauthClient.clientSecret,
      tokenEndpoint: oauthClient.tokenEndpoint,
      authorizationEndpoint: oauthClient.authorizationEndpoint,
    });
  } else if (oauthClient.discoveryEndpoint) {
    let discoveryPromise: Promise<OidcDiscovery> | null = null;

    async function discover(): Promise<OidcDiscovery> {
      if (!oauthClient.server) {
        throw new Error(`OAuth client for IDP ${slug} is missing issuer`);
      }
      if (!discoveryPromise) {
        const wellKnown = buildWellKnownUrl(
          oauthClient.server,
          oauthClient.discoveryEndpoint || "/.well-known/openid-configuration",
        );
        discoveryPromise = (async () => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          try {
            const res = await fetch(wellKnown, { signal: controller.signal });
            if (!res.ok)
              throw new Error(
                `OIDC discovery failed (${res.status}) at ${wellKnown}`,
              );
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

    const discovery = await discover();

    return new OAuth2Client({
      server: oauthClient.server,
      clientId: oauthClient.clientId,
      clientSecret: oauthClient.clientSecret,
      tokenEndpoint: discovery.token_endpoint,
      authorizationEndpoint: discovery.authorization_endpoint,
    });
  } else {
    throw new Error(`OAuth client for IDP ${slug} is missing endpoints`);
  }
}

function buildCallbackUrl(slug: string): string {
  const baseUrl = getRequiredEnv("BASE_URL");
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(`idp/${slug}/callback`, normalizedBase).toString();
}

function buildWellKnownUrl(
  issuerBase: string,
  discoveryEndpoint: string,
): string {
  const trimmed = issuerBase.endsWith("/")
    ? issuerBase.slice(0, -1)
    : issuerBase;
  return `${trimmed}${discoveryEndpoint}`;
}
