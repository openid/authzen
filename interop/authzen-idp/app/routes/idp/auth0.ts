/** biome-ignore-all lint/style/noNonNullAssertion: Init */
import { generateCodeVerifier, OAuth2Client } from "@badgateway/oauth2-client";

import { createCookie, redirect } from "react-router";
import { clearAuditLog, pushAuditLog } from "~/lib/auditLog";
import { AuditType } from "~/types/audit";
import type { Route } from "./+types/auth0";

const client = new OAuth2Client({
	server: process.env.AUTH0_DOMAIN!,
	clientId: process.env.AUTH0_CLIENT_ID!,
	clientSecret: process.env.AUTH0_CLIENT_SECRET!,
});

const callbackUrl = `${process.env.BASE_URL!}/idp/auth0/callback`;

const pkceCookie = createCookie("authzen:auth0:pkce", {
	httpOnly: true,
	path: "/",
	sameSite: "lax",
	secure: process.env.NODE_ENV === "production",
	maxAge: 300,
});


export async function loader({ request }: Route.LoaderArgs) {
	if (request.url.includes("/login")) {
		clearAuditLog();
		pushAuditLog(AuditType.AuthN, {
			message: "Initiating Auth0 login",
			idp: "auth0",
		});
		const codeVerifier = await	generateCodeVerifier();
		
		const url = await client.authorizationCode.getAuthorizeUri({
			redirectUri: callbackUrl,
			scope: ["openid", "profile", "email"],
			codeVerifier,
			extraParams: {
				prompt: "login",
				
			},
		});
		return redirect(url, {
			headers: {
				"Set-Cookie": await pkceCookie.serialize(codeVerifier),
			},
		});
	}

	if (request.url.includes("/callback")) {
		pushAuditLog(AuditType.AuthN, {
			message: "Handling Auth0 callback",
			idp: "auth0",
		});

		const cookieHeader = request.headers.get("Cookie");
		const codeVerifier = cookieHeader
			? await pkceCookie.parse(cookieHeader)
			: undefined;

		if (!codeVerifier || typeof codeVerifier !== "string") {
			pushAuditLog(AuditType.AuthN, {
				message: "Missing PKCE code verifier cookie during Auth0 callback",
				idp: "auth0",
				ok: false,
			});
			return redirect("/", {
				headers: {
					"Set-Cookie": await pkceCookie.serialize("", { maxAge: 0 }),
				},
			});
		}

		try {
			const oauth2Token =
				await client.authorizationCode.getTokenFromCodeRedirect(
					request.url,
					{
						redirectUri: callbackUrl,
						codeVerifier,
					} as any,
				);

			pushAuditLog(AuditType.AuthN, {
				message: "Successfully obtained OAuth2 token from Auth0",
				idp: "auth0",
				response: {
					accessTokenIssued: Boolean(oauth2Token.accessToken),
					idTokenIssued: Boolean(oauth2Token.idToken),
				},
				ok: true,
			});

			return redirect(`/#id_token=${oauth2Token.idToken}`, {
				headers: {
					"Set-Cookie": await pkceCookie.serialize("", { maxAge: 0 }),
				},
			});
		} catch (error) {
			pushAuditLog(AuditType.AuthN, {
				message: `Error obtaining OAuth2 token: ${(error as Error).message}`,
				idp: "auth0",
				ok: false,
			});
			return redirect(`/`, {
				headers: {
					"Set-Cookie": await pkceCookie.serialize("", { maxAge: 0 }),
				},
			});
		}
	}
	return redirect("/");
}
