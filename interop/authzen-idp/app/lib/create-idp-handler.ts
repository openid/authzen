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

export function createIdpHandler({
  slug,
  label,
  oauthClient,
  extraParams,
}: CreateIdpHandlerOptions) {
  const client = new OAuth2Client(oauthClient);
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

function buildCallbackUrl(slug: string): string {
  const baseUrl = getRequiredEnv("BASE_URL");
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(`idp/${slug}/callback`, normalizedBase).toString();
}
